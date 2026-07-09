"""API routers package."""

from app.routers.health import router as health_router
from app.routers.placeholders import router as placeholder_router

__all__ = ["health_router", "placeholder_router"]
