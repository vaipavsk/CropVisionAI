from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Optional

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

# Log the exact Python interpreter so we can diagnose wrong-executable issues.
logger.info("[auth] Python executable: %s", sys.executable)

# ---------------------------------------------------------
# Initialize Firebase Admin SDK
# ---------------------------------------------------------
if not firebase_admin._apps:
    try:
        # Resolve the service account path absolutely from __file__ so it
        # works regardless of the process working directory or how uvicorn
        # was launched (reloader child, direct, etc.).
        _sa_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
        if _sa_env:
            _sa_path = Path(_sa_env) if Path(_sa_env).is_absolute() else Path(__file__).resolve().parent.parent.parent / _sa_env
        else:
            # Default: same directory as this auth.py's service root (ai-service/)
            _sa_path = Path(__file__).resolve().parents[2] / "cropvisionai-70c7a-firebase-adminsdk-fbsvc-162f48124e.json"

        logger.info("[auth] Firebase service account path: %s", _sa_path)
        logger.info("[auth] Path exists: %s", _sa_path.exists())

        cred = credentials.Certificate(str(_sa_path))
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as exc:
        logger.exception("Firebase Admin SDK initialization failed")
        raise exc

security = HTTPBearer(auto_error=False)


def verify_firebase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Verify Firebase ID token.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
