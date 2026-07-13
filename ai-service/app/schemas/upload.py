from __future__ import annotations

from pydantic import BaseModel, Field


class UploadResponseData(BaseModel):
    """Response payload for a successful upload."""

    upload_id: int = Field(..., description="Database identifier of the upload record")
    filename: str = Field(..., description="Stored filename")
    status: str = Field(..., description="Upload status")


class UploadResponse(BaseModel):
    """API response model for image upload."""

    success: bool = Field(default=True)
    message: str = Field(default="Image uploaded successfully.")
    data: UploadResponseData
