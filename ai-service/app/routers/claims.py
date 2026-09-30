from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.dependencies.rate_limiter import feedback_rate_limiter
from app.models.claim import Claim, ClaimStatus
from app.models.explanation_feedback import ExplanationFeedback, ExplanationFeedbackLabel
from app.models.prediction import Prediction
from app.models.upload import Upload
from app.models.user import User, UserRole
from app.schemas.feedback import ExplanationFeedbackCreate
from app.security.roles import RoleChecker
from app.services.prediction_service import categorize_issue

router = APIRouter(prefix="/claims", tags=["claims"])
logger = logging.getLogger(__name__)

get_inspector = Depends(RoleChecker([UserRole.INSPECTOR, UserRole.ADMIN]))
get_farmer = Depends(RoleChecker([UserRole.FARMER]))


class ClaimCreateRequest(BaseModel):
    prediction_id: int | None = None
    upload_id: int | None = None
    crop_type: str | None = None
    disease_type: str | None = None
    estimated_severity: str | None = None
    amount: float | None = None
    reason: str | None = None


def _public_media_path(path: str | None, kind: str) -> str | None:
    if not path:
        return None
    name = Path(path).name
    if name:
        return f"/media/{kind}/{name}"
    return None


def _metadata(explanation: str | None) -> dict[str, Any]:
    if not explanation:
        return {}
    try:
        value = json.loads(explanation)
        if isinstance(value, dict):
            return value
        return {}
    except json.JSONDecodeError:
        return {}


def _serialize_feedback(fb: Any) -> dict[str, Any] | None:
    if not fb:
        return None
    inspector = getattr(fb, "inspector", None)
    label = getattr(fb, "feedback_label", None)
    label_val = label.value if hasattr(label, "value") else str(label) if label else None
    return {
        "id": getattr(fb, "id", None),
        "prediction_id": getattr(fb, "prediction_id", None),
        "claim_id": getattr(fb, "claim_id", None),
        "inspector_id": getattr(fb, "inspector_id", None),
        "inspector_name": getattr(inspector, "full_name", None),
        "inspector_email": getattr(inspector, "email", None),
        "feedback_label": label_val,
        "comment": getattr(fb, "comment", None),
        "created_at": fb.created_at.isoformat() if getattr(fb, "created_at", None) else None,
        "updated_at": fb.updated_at.isoformat() if getattr(fb, "updated_at", None) else None,
    }


def _status(value: ClaimStatus | str) -> str:
    if isinstance(value, ClaimStatus):
        raw = value.value
    else:
        raw = str(value)
    return {"draft": "PENDING", "submitted": "UNDER_REVIEW"}.get(raw.lower(), raw.upper())


def _serialize_claim(claim: Claim) -> dict[str, Any]:
    prediction = claim.prediction
    upload = prediction.upload if prediction else None
    user = upload.user if upload else None

    meta = _metadata(prediction.explanation if prediction else None)
    confidence = prediction.confidence_score if prediction else None
    damage_type = prediction.damage_class if prediction else "Prediction not available"
    
    category = meta.get("category")
    if not category:
        category = categorize_issue(damage_type) if damage_type else "Unknown"
        
    damage_pct = meta.get("damage_percentage")
    if damage_pct is not None:
        try:
            damage_pct = float(damage_pct)
        except (TypeError, ValueError):
            damage_pct = None

    risk_lvl = meta.get("risk_level")
    rec_reason = meta.get("recommendation_reason")

    farmer_dict = None
    if user:
        farmer_dict = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        }
    else:
        farmer_dict = {
            "id": None,
            "full_name": "Unknown Farmer",
            "email": "N/A",
            "role": "FARMER",
        }
            
    # Serialize sub-structures
    upload_dict = None
    if upload:
        upload_dict = {
            "id": upload.id,
            "original_name": upload.original_name,
            "created_at": upload.created_at.isoformat() if upload.created_at else None,
            "image_url": _public_media_path(upload.file_path, "uploads")
        }
        
    prediction_dict = None
    if prediction:
        crop_name = meta.get("crop_name")
        if not crop_name:
            crop_name = damage_type.split()[0] if damage_type else "Unknown"
            
        rec_val = meta.get("recommendation", prediction.explanation or "Not available")
        
        ts_val = meta.get("timestamp")
        if not ts_val:
            ts_val = prediction.created_at.isoformat() if prediction.created_at else None
            
        prediction_dict = {
            "id": prediction.id,
            "damage_type": damage_type,
            "crop_name": crop_name,
            "confidence": confidence,
            "severity": meta.get("severity"),
            "severity_score": meta.get("severity_score"),
            "recommendation": rec_val,
            "timestamp": ts_val,
            "gradcam_url": _public_media_path(meta.get("gradcam_image_path"), "heatmaps"),
            "category": category,
            "risk_level": risk_lvl,
            "recommendation_reason": rec_reason,
            "detections_count": meta.get("detections_count", 0),
            "damage_percentage": damage_pct
        }
        
    claim_id_val = claim.claim_number if claim.claim_number else f"CLM-{claim.id:06d}"
    
    approved_at_val = None
    if _status(claim.status) == "APPROVED" and claim.updated_at:
        approved_at_val = claim.updated_at.isoformat()
        
    rejected_at_val = None
    if _status(claim.status) == "REJECTED" and claim.updated_at:
        rejected_at_val = claim.updated_at.isoformat()

    feedback_list = []
    if getattr(claim, "feedbacks", None):
        feedback_list = [_serialize_feedback(f) for f in claim.feedbacks if f]
    elif prediction and getattr(prediction, "feedbacks", None):
        feedback_list = [_serialize_feedback(f) for f in prediction.feedbacks if f]

    latest_feedback = feedback_list[-1] if feedback_list else None
        
    return {
        "id": claim.id,
        "claim_id": claim_id_val,
        "status": _status(claim.status),
        "amount": claim.amount,
        "reason": claim.reason,
        "created_at": claim.created_at.isoformat() if claim.created_at else None,
        "updated_at": claim.updated_at.isoformat() if claim.updated_at else None,
        "approved_at": approved_at_val,
        "rejected_at": rejected_at_val,
        "upload": upload_dict,
        "prediction": prediction_dict,
        "farmer": farmer_dict,
        "feedback": latest_feedback,
        "feedbacks": feedback_list,
    }


def _claim_query(db: Session):
    return db.query(Claim).options(
        joinedload(Claim.prediction)
        .joinedload(Prediction.upload)
        .joinedload(Upload.user),
        joinedload(Claim.feedbacks).joinedload(ExplanationFeedback.inspector),
    )


@router.get("")
def list_claims(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, get_inspector]
) -> list[dict[str, Any]]:
    try:
        claims = _claim_query(db).order_by(Claim.created_at.desc()).all()
    except Exception:
        logger.exception("Inspector claim query failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load claims."
        )
    
    logger.info("Inspector claim query returned %s claims", len(claims))
    return [_serialize_claim(claim) for claim in claims]


@router.get("/mine")
def list_my_claims(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, get_farmer]
) -> list[dict[str, Any]]:
    claims = (
        _claim_query(db)
        .join(Claim.prediction)
        .join(Prediction.upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Claim.created_at.desc())
        .all()
    )
    return [_serialize_claim(claim) for claim in claims]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_or_submit_claim(
    payload: ClaimCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, get_farmer]
) -> dict[str, Any]:
    prediction = None
    if payload.prediction_id:
        prediction = (
            db.query(Prediction)
            .join(Prediction.upload)
            .filter(Prediction.id == payload.prediction_id, Upload.user_id == current_user.id)
            .first()
        )
    elif payload.upload_id:
        prediction = (
            db.query(Prediction)
            .join(Prediction.upload)
            .filter(Upload.id == payload.upload_id, Upload.user_id == current_user.id)
            .first()
        )
    else:
        prediction = (
            db.query(Prediction)
            .join(Prediction.upload)
            .filter(Upload.user_id == current_user.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )

    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prediction record found for claim filing. Please upload and analyze a crop image first."
        )

    claim = db.query(Claim).filter(Claim.prediction_id == prediction.id).first()
    if claim is None:
        claim = Claim(
            prediction_id=prediction.id,
            claim_number=f"CLM-{prediction.id:06d}",
            amount=payload.amount,
            reason=payload.reason,
            status=ClaimStatus.SUBMITTED,
        )
        db.add(claim)
    else:
        if payload.amount is not None:
            claim.amount = payload.amount
        if payload.reason is not None:
            claim.reason = payload.reason
        if claim.status == ClaimStatus.DRAFT:
            claim.status = ClaimStatus.SUBMITTED

    try:
        db.commit()
        db.refresh(claim)
    except IntegrityError:
        db.rollback()
        logger.warning("Concurrent claim creation detected for prediction_id=%s. Loading existing record.", prediction.id)
        existing_claim = db.query(Claim).filter(Claim.prediction_id == prediction.id).first()
        if existing_claim:
            loaded_claim = _claim_query(db).filter(Claim.id == existing_claim.id).first()
            return _serialize_claim(loaded_claim or existing_claim)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit claim record due to concurrency conflict."
        )
    except Exception as exc:
        db.rollback()
        logger.exception("Claim creation/submission failed for prediction_id=%s", prediction.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit claim record."
        ) from exc

    logger.info("Claim created/submitted: claim_id=%s status=%s user_id=%s", claim.id, claim.status.value, current_user.id)
    loaded_claim = _claim_query(db).filter(Claim.id == claim.id).first()
    return _serialize_claim(loaded_claim or claim)


@router.get("/{claim_id}")
def get_claim(
    claim_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, get_inspector]
) -> dict[str, Any]:
    claim = _claim_query(db).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    return _serialize_claim(claim)


class ClaimAdjudicationRequest(BaseModel):
    reason: str | None = None


def _update_status(
    claim_id: int,
    new_status: ClaimStatus,
    db: Session,
    reason: str | None = None
) -> dict[str, Any]:
    claim = _claim_query(db).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    
    if reason is not None and reason.strip():
        claim.reason = reason.strip()

    claim.status = new_status
    try:
        db.commit()
        db.refresh(claim)
    except Exception:
        db.rollback()
        logger.exception(
            "Claim status update failed: claim_id=%s status=%s",
            claim_id,
            new_status.value
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update claim status."
        )
    
    logger.info(
        "Claim status updated: claim_id=%s status=%s",
        claim_id,
        new_status.value
    )
    return _serialize_claim(claim)


@router.put("/{claim_id}/approve")
def approve_claim(
    claim_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, get_inspector],
    payload: ClaimAdjudicationRequest | None = None,
) -> dict[str, Any]:
    reason = payload.reason if payload else None
    return _update_status(claim_id, ClaimStatus.APPROVED, db, reason=reason)


@router.put("/{claim_id}/reject")
def reject_claim(
    claim_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, get_inspector],
    payload: ClaimAdjudicationRequest | None = None,
) -> dict[str, Any]:
    reason = payload.reason if payload else None
    return _update_status(claim_id, ClaimStatus.REJECTED, db, reason=reason)


@router.post(
    "/{claim_id}/feedback",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(feedback_rate_limiter)],
)
def submit_explanation_feedback(
    claim_id: int,
    payload: ExplanationFeedbackCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, get_inspector],
) -> dict[str, Any]:
    """Record or update an inspector's Grad-CAM explanation feedback for a claim."""
    claim = _claim_query(db).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found.",
        )

    prediction = claim.prediction
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prediction record found for this claim.",
        )

    # Check for existing feedback by this inspector for this prediction (upsert pattern)
    existing_feedback = (
        db.query(ExplanationFeedback)
        .filter(
            ExplanationFeedback.prediction_id == prediction.id,
            ExplanationFeedback.inspector_id == current_user.id,
        )
        .first()
    )

    clean_comment = payload.comment.strip() if (payload.comment and payload.comment.strip()) else None

    if existing_feedback:
        existing_feedback.feedback_label = payload.feedback_label
        existing_feedback.comment = clean_comment
        existing_feedback.claim_id = claim.id
        feedback_record = existing_feedback
    else:
        feedback_record = ExplanationFeedback(
            prediction_id=prediction.id,
            claim_id=claim.id,
            inspector_id=current_user.id,
            feedback_label=payload.feedback_label,
            comment=clean_comment,
        )
        db.add(feedback_record)

    try:
        db.commit()
        db.refresh(feedback_record)
    except Exception as exc:
        db.rollback()
        logger.exception("Explanation feedback persistence failed for claim_id=%s inspector_id=%s", claim_id, current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save explanation feedback.",
        ) from exc

    loaded = (
        db.query(ExplanationFeedback)
        .options(joinedload(ExplanationFeedback.inspector))
        .filter(ExplanationFeedback.id == feedback_record.id)
        .first()
    )

    logger.info(
        "Explanation feedback persisted: id=%s claim_id=%s prediction_id=%s inspector_id=%s label=%s",
        feedback_record.id,
        claim_id,
        prediction.id,
        current_user.id,
        feedback_record.feedback_label,
    )

    return {
        "success": True,
        "message": "AI explanation feedback saved successfully.",
        "data": _serialize_feedback(loaded or feedback_record),
    }


@router.get("/{claim_id}/feedback", status_code=status.HTTP_200_OK)
def get_claim_explanation_feedback(
    claim_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, get_inspector],
) -> dict[str, Any]:
    """Retrieve all recorded explanation feedback for a claim."""
    claim = _claim_query(db).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found.",
        )

    feedbacks = (
        db.query(ExplanationFeedback)
        .options(joinedload(ExplanationFeedback.inspector))
        .filter(
            (ExplanationFeedback.claim_id == claim.id)
            | (ExplanationFeedback.prediction_id == claim.prediction_id)
        )
        .order_by(ExplanationFeedback.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "claim_id": claim.id,
        "prediction_id": claim.prediction_id,
        "feedbacks": [_serialize_feedback(fb) for fb in feedbacks],
    }



