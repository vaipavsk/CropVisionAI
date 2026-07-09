from __future__ import annotations

from app.services.base_service import BaseService


class ReportService(BaseService):
    """Placeholder service for PDF report generation."""

    def execute(self, *args, **kwargs) -> dict[str, str]:
        """Return a placeholder response for future report implementation."""
        return {"message": "Report generation service placeholder"}
