from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health_router, placeholder_router, prediction_router, upload_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()

    app = FastAPI(
        title=settings.project_name,
        version=settings.version,
        description="XAI-driven crop damage assessment backend",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(placeholder_router)
    app.include_router(prediction_router)
    app.include_router(upload_router)

    @app.get("/", tags=["health"])
    def root() -> dict[str, str]:
        """Return the public API welcome payload."""
        return {"message": "CropVisionAI API Running", "version": settings.version}

    return app


app = create_app()
