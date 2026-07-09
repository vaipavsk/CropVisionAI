from __future__ import annotations

from app.services.base_service import BaseService


class AuthService(BaseService):
    """Placeholder service for authentication and authorization."""

    def execute(self, *args, **kwargs) -> dict[str, str]:
        """Return a placeholder response for future auth implementation."""
        return {"message": "Authentication service placeholder"}
