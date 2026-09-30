"""
Firebase Admin SDK initialization and token verification.

Initializes the Firebase Admin App once at import time.
Exposes verify_firebase_token() for use in FastAPI route dependencies.
"""

import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

# Load .env so FIREBASE_SERVICE_ACCOUNT_PATH is available when this module
# is imported before FastAPI startup (e.g. during testing).
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

# ── Resolve service account path ────────────────────────────────────────────
# Priority:
#   1. FIREBASE_SERVICE_ACCOUNT_PATH env var (absolute or relative to backend/)
#   2. Default: ../ai-service/<json> (works in the existing repo layout)
_env_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
if _env_path:
    SERVICE_ACCOUNT_PATH = Path(_env_path) if Path(_env_path).is_absolute() else BASE_DIR / _env_path
else:
    # Fallback: discover first admin-sdk JSON in the ai-service directory
    _ai_service = BASE_DIR.parent / "ai-service"
    _candidates = list(_ai_service.glob("*firebase-adminsdk*.json"))
    if not _candidates:
        raise FileNotFoundError(
            "Firebase service account JSON not found. "
            "Set FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env."
        )
    SERVICE_ACCOUNT_PATH = _candidates[0]

# ── Initialize Firebase Admin (once) ────────────────────────────────────────
if not firebase_admin._apps:
    cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
    firebase_admin.initialize_app(cred)

# ── HTTP Bearer scheme for FastAPI dependency injection ──────────────────────
_bearer_scheme = HTTPBearer(auto_error=False)


def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency that verifies the Firebase ID token from the
    Authorization: Bearer <token> header.

    Returns the decoded token payload dict on success.
    Raises HTTP 401 if the token is missing or invalid.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token. Please log in.",
        )

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Firebase token has expired. Please log in again.")
    except firebase_auth.InvalidIdTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {exc}")
