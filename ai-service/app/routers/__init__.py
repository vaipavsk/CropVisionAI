"""API routers package."""

from app.routers.health import router as health_router
from app.routers.placeholders import router as placeholder_router
from app.routers.prediction import router as prediction_router
from app.routers.upload import router as upload_router

__all__ = ["health_router", "placeholder_router", "prediction_router", "upload_router"]
