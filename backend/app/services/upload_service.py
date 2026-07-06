import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

# Allowed image file extensions for upload.
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

# Base directory for saving uploaded files.
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_extension(filename: str) -> str:
    """Extract and normalize the file extension from the uploaded filename."""
    return Path(filename).suffix.lower().lstrip('.')


def validate_file_type(upload_file: UploadFile) -> None:
    """Raise an HTTPException when the uploaded file type is not allowed."""
    extension = get_extension(upload_file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )


def save_upload(upload_file: UploadFile) -> dict:
    """Save the uploaded file to the backend/uploads directory with a UUID filename."""
    validate_file_type(upload_file)

    file_extension = get_extension(upload_file.filename)
    unique_name = f"{uuid.uuid4().hex}.{file_extension}"
    destination_path = UPLOAD_DIR / unique_name

    with destination_path.open("wb") as buffer:
        content = upload_file.file.read()
        buffer.write(content)

    return {
        "filename": unique_name,
        "filepath": f"uploads/{unique_name}"
    }
