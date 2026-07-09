from __future__ import annotations

from app.services.base_service import BaseService


class EfficientNetService(BaseService):
    """Placeholder service for crop damage classification."""

    def execute(self, *args, **kwargs) -> dict[str, str]:
        """Return a placeholder response for future EfficientNet implementation."""
        return {"message": "EfficientNet classification service placeholder"}
