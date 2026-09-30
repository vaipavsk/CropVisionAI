from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.rate_limiter import upload_rate_limiter
from app.models.user import User, UserRole
from app.security.roles import RoleChecker
from app.schemas.upload import UploadResponse
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])

# Require user to be an active FARMER to upload images
get_farmer_user = Depends(RoleChecker([UserRole.FARMER]))


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(upload_rate_limiter)])
def upload_image(
    image: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, get_farmer_user],
) -> UploadResponse:
    """Upload an image and persist its metadata in the database."""
    service = UploadService(db=db)
    try:
        return service.create_upload(image=image, user_id=current_user.id)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("Unexpected error during upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while uploading the image.",
        ) from exc
