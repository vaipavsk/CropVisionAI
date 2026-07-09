from __future__ import annotations

from app.services.base_service import BaseService


class YOLOService(BaseService):
    """Placeholder service for YOLO-based crop detection."""

    def execute(self, *args, **kwargs) -> dict[str, str]:
        """Return a placeholder response for future YOLO implementation."""
        return {"message": "YOLO detection service placeholder"}
