from __future__ import annotations

from app.services.base_service import BaseService


class GradCAMService(BaseService):
    """Placeholder service for explainability visualization."""

    def execute(self, *args, **kwargs) -> dict[str, str]:
        """Return a placeholder response for future Grad-CAM implementation."""
        return {"message": "Grad-CAM service placeholder"}
