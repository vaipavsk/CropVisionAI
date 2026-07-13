from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.upload import Upload, UploadStatus
from app.schemas.upload import UploadResponse, UploadResponseData

logger = logging.getLogger(__name__)


class UploadService:
    """Handle image validation, storage, and persistence."""

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.upload_dir = self.settings.upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def create_upload(self, image: UploadFile) -> UploadResponse:
        """Validate, store, and persist an uploaded image."""
        self._validate_file(image)

        stored_name = self._build_stored_filename(image.filename)
        destination = self.upload_dir / stored_name

        try:
            contents = image.file.read()
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception("Failed to read uploaded file")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to read the uploaded file.",
            ) from exc

        if len(contents) > self.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 10 MB limit.",
            )

        try:
            destination.write_bytes(contents)
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception("Failed to write uploaded file to disk")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save the uploaded image.",
            ) from exc

        upload_record = Upload(
            file_name=stored_name,
            file_path=str(destination),
            original_name=image.filename or "unknown",
            mime_type=image.content_type,
            file_size_bytes=len(contents),
            status=UploadStatus.PENDING_ANALYSIS,
        )

        try:
            self.db.add(upload_record)
            self.db.commit()
            self.db.refresh(upload_record)
        except Exception as exc:  # pragma: no cover - defensive guard
            self.db.rollback()
            logger.exception("Failed to persist upload metadata")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store upload metadata.",
            ) from exc

        return UploadResponse(
            success=True,
            message="Image uploaded successfully.",
            data=UploadResponseData(
                upload_id=upload_record.id,
                filename=upload_record.file_name,
                status=upload_record.status.value,
            ),
        )

    def _validate_file(self, image: UploadFile) -> None:
        """Validate uploaded file type and presence."""
        if image.filename is None or image.filename.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A filename is required.",
            )

        suffix = Path(image.filename).suffix.lower()
        if suffix not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Unsupported file type.",
                    "allowed_types": ["jpg", "jpeg", "png"],
                },
            )

        if image.content_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content type is required.",
            )

    def _build_stored_filename(self, original_name: str | None) -> str:
        """Create a UUID-based stored filename while preserving the extension."""
        suffix = Path(original_name or "file").suffix.lower()
        unique_name = uuid.uuid4().hex
        return f"{unique_name}{suffix}"
