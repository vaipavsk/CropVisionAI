from __future__ import annotations

import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserStatus
from app.services.user_service import get_user_by_firebase_uid

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app()
    except Exception:
        # Fallback or pass options if initialized in a specific cloud environment
        pass

security = HTTPBearer()


def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate incoming Firebase ID Token and return decoded token payload."""
    token = credentials.credentials
    try:
        # verify_id_token decodes the token and checks signature + expiration
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase authentication token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
) -> User:
    """Resolve user from database using verified Firebase UID, validating active status."""
    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing Firebase UID claim.",
        )

    db_user = get_user_by_firebase_uid(db, firebase_uid)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered in local database. Please complete registration.",
        )

    if db_user.status == UserStatus.INACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated. Please contact administration.",
        )

    return db_user
