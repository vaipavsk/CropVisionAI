"""
User routes — Firebase-authenticated endpoints for user profile management.

Endpoints:
  GET  /users/me        — return the MySQL profile for the authenticated Firebase user
  POST /users/register  — create a MySQL user row for a newly registered Firebase user
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.firebase_admin_init import verify_firebase_token
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


# ── Database session dependency ──────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Request / Response schemas ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    role: Literal["FARMER", "INSPECTOR"] = "FARMER"

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("full_name must not be blank.")
        return v


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me")
def get_current_user(
    token_payload: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    """
    Return the MySQL user profile for the authenticated Firebase user.

    The Firebase ID token is verified server-side; the UID is extracted from
    the verified payload — never trusted from the client body.

    Returns 404 if the Firebase user exists but has no MySQL profile yet
    (triggers the CompleteProfile fallback in the frontend).
    """
    firebase_uid: str = token_payload["uid"]

    user = user_service.get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User profile not found in database. Please complete your registration.",
        )

    return user.to_dict()


@router.post("/register", status_code=201)
def register_user(
    body: RegisterRequest,
    token_payload: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    """
    Synchronise a Firebase-authenticated user into the MySQL database.

    The Firebase UID and email are extracted from the VERIFIED token payload
    — the client cannot supply or spoof them.

    Behaviour:
    - If a MySQL row already exists for this firebase_uid → return it (idempotent).
    - If another MySQL row already owns this email → 409 Conflict.
    - Otherwise → INSERT new row with status='ACTIVE' and return it.
    """
    firebase_uid: str = token_payload["uid"]
    email: str = token_payload.get("email", "")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Firebase token does not contain an email address.",
        )

    # ── Idempotency: already registered? ────────────────────────────────────
    existing_by_uid = user_service.get_user_by_firebase_uid(db, firebase_uid)
    if existing_by_uid:
        # Already synced — just return the existing profile.
        return existing_by_uid.to_dict()

    # ── Duplicate email guard ────────────────────────────────────────────────
    existing_by_email = user_service.get_user_by_email(db, email)
    if existing_by_email:
        raise HTTPException(
            status_code=409,
            detail="An account with this email address already exists in the database.",
        )

    # ── Create new MySQL record ──────────────────────────────────────────────
    try:
        new_user = user_service.create_user(
            db=db,
            firebase_uid=firebase_uid,
            email=email,
            full_name=body.full_name,
            role=body.role,
        )
        db.commit()
        db.refresh(new_user)
        return new_user.to_dict()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user profile: {exc}",
        )
