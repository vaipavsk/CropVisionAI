"""API routers package."""

from app.routers.health import router as health_router
from app.routers.claims import router as claims_router
from app.routers.placeholders import router as placeholder_router
from app.routers.prediction import router as prediction_router
from app.routers.upload import router as upload_router
from app.routers.user_router import router as user_router

__all__ = [
    "health_router",
    "claims_router",
    "placeholder_router",
    "prediction_router",
    "upload_router",
    "user_router",
]
