from __future__ import annotations

import logging
import time
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.upload import Upload
from app.models.user import User, UserRole
from app.services.segmentation_models import SegmentationResponse
from app.services.segmentation_service import SegmentationService, SegmentationServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/segmentation", tags=["segmentation"])


def _can_access_upload(user: User, upload: Upload) -> bool:
    return user.role in {UserRole.INSPECTOR, UserRole.ADMIN} or upload.user_id == user.id


@router.post(
    "/{upload_id}",
    response_model=SegmentationResponse,
    status_code=status.HTTP_200_OK,
)
def run_plant_segmentation(
    upload_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    threshold: Annotated[Optional[float], Query(ge=0.0, le=1.0, description="Optional probability cutoff threshold")] = None,
) -> SegmentationResponse:
    """Run experimental Small U-Net plant segmentation on an uploaded image.

    NOTE: This segmentation output represents preliminary experimental spatial evidence.
    It does NOT represent physical crop damage percentage or yield loss.

    Args:
        upload_id: Database ID of the upload.
        db: Database session.
        current_user: Authenticated user.
        threshold: Optional probability threshold for binary mask discretization (default: 0.5).

    Returns:
        SegmentationResponse: Standard API response wrapper containing the SegmentationResult payload.
    """
    logger.info(f"Request received: POST /segmentation/{upload_id}")
    start_time = time.perf_counter()

    # 1. Validate upload_id
    if upload_id <= 0:
        logger.error(f"Validation error: upload_id must be a positive integer. Got: {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="upload_id must be a positive integer.",
        )

    # 2. Check if upload record exists and verify authorization
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        logger.error(f"Upload record not found: ID {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record with ID {upload_id} not found.",
        )

    if not _can_access_upload(current_user, upload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to run segmentation on this upload.",
        )

    # 3. Execute segmentation service
    service = SegmentationService(db=db)
    try:
        result = service.execute(upload_id, threshold=threshold)
    except SegmentationServiceError as exc:
        logger.exception(f"Segmentation service failed for upload ID: {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Segmentation execution failed: {str(exc)}",
        ) from exc
    except Exception as exc:
        logger.exception(f"Unexpected exception during segmentation for upload ID: {upload_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during segmentation execution.",
        ) from exc

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    logger.info(f"Segmentation completed for upload ID {upload_id} in {elapsed_ms:.2f} ms")

    return SegmentationResponse(
        success=True,
        message="Experimental plant segmentation completed successfully.",
        data=result,
    )
