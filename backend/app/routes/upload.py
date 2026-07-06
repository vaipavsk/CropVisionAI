from fastapi import APIRouter, File, UploadFile

from app.services.upload_service import save_upload

router = APIRouter(
    prefix="",
    tags=["upload"]
)


@router.post("/upload")
def upload_image(file: UploadFile = File(...)):
    """Handle image upload requests and return the stored file metadata."""
    saved_file = save_upload(file)
    return {
        "status": "success",
        "filename": saved_file["filename"],
        "filepath": saved_file["filepath"]
    }
