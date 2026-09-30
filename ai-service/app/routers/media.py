from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.prediction import Prediction
from app.models.upload import Upload
from app.models.user import User, UserRole

router = APIRouter(prefix="/media", tags=["media"])


def _safe_filename(filename: str) -> str:
    if not filename or Path(filename).name != filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found.")
    return filename


def _metadata(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _can_view_upload(user: User, upload: Upload) -> bool:
    return user.role in {UserRole.INSPECTOR, UserRole.ADMIN} or upload.user_id == user.id


def _serve(path: Path, media_type: str | None) -> FileResponse:
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found.")
    return FileResponse(path, media_type=media_type)


@router.get("/uploads/{filename}")
def get_uploaded_image(
    filename: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FileResponse:
    filename = _safe_filename(filename)
    upload = db.query(Upload).filter(Upload.file_name == filename).first()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found.")
    if not _can_view_upload(current_user, upload):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to access this media file.")
    return _serve(Path(upload.file_path), upload.mime_type)


@router.get("/heatmaps/{filename}")
def get_gradcam_image(
    filename: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FileResponse:
    filename = _safe_filename(filename)
    candidates = (
        db.query(Prediction)
        .options(joinedload(Prediction.upload))
        .filter(Prediction.explanation.contains(filename))
        .all()
    )
    prediction = next(
        (
            candidate for candidate in candidates
            if Path(str(_metadata(candidate.explanation).get("gradcam_image_path", ""))).name == filename
        ),
        None,
    )
    if not prediction or not prediction.upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found.")
    if not _can_view_upload(current_user, prediction.upload):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to access this media file.")
    settings = get_settings()
    return _serve(settings.report_dir / "heatmaps" / filename, "image/jpeg")


@router.get("/segmentation/{filename}")
def get_segmentation_image(
    filename: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FileResponse:
    filename = _safe_filename(filename)
    settings = get_settings()
    file_path = settings.report_dir / "segmentation" / filename

    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found.")

    # Check upload-level ownership if filename contains upload_{id}
    if filename.startswith("upload_"):
        parts = filename.split("_")
        if len(parts) >= 2 and parts[1].isdigit():
            upload_id = int(parts[1])
            upload = db.query(Upload).filter(Upload.id == upload_id).first()
            if upload and not _can_view_upload(current_user, upload):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to access this media file.")

    media_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
    return _serve(file_path, media_type)
