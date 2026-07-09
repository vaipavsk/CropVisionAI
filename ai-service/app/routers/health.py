from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Provide a simple health-check response."""
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.project_name)
