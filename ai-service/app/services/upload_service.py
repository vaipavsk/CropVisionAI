from __future__ import annotations

from app.services.base_service import BaseService


class UploadService(BaseService):
    """Placeholder service for image upload and file handling."""

    def execute(self, *args, **kwargs) -> dict[str, str]:
        """Return a placeholder response for future upload implementation."""
        return {"message": "Upload service placeholder"}
