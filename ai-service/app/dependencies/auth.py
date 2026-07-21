from __future__ import annotations

import logging

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserStatus
from app.services.user_service import get_user_by_firebase_uid

logger = logging.getLogger("cropvision.auth")

# ---------------------------------------------------------
# Initialize Firebase Admin SDK
# ---------------------------------------------------------
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(
            "cropvisionai-70c7a-firebase-adminsdk-fbsvc-162f48124e.json"
        )
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as exc:
        logger.exception("Firebase Admin SDK initialization failed")
        raise exc

security = HTTPBearer()


def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verify Firebase ID token.
    """
    token = credentials.credentials

    try:
        decoded_token = firebase_auth.verify_id_token(token)

        logger.info(
            f"Firebase token verified successfully for UID: {decoded_token.get('uid')}"
        )

        return decoded_token

    except Exception as exc:
        logger.exception("Firebase token verification failed")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase authentication token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
) -> User:
    """
    Get the currently authenticated user from MySQL.
    """

    firebase_uid = decoded_token.get("uid")

    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing Firebase UID claim.",
        )

    db_user = get_user_by_firebase_uid(db, firebase_uid)

    if not db_user:
        logger.warning(
            f"User with Firebase UID '{firebase_uid}' not found in MySQL."
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered in local database. Please complete registration.",
        )

    if db_user.status == UserStatus.INACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated. Please contact administration.",
        )

    logger.info(
        f"Authenticated user: {db_user.email} ({db_user.role})"
    )

    return db_user