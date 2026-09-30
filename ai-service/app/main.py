from __future__ import annotations

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.config import get_settings
from app.routers import (
    claims_router,
    health_router,
    media_router,
    placeholder_router,
    prediction_router,
    segmentation_router,
    upload_router,
    user_router,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds standard defense-in-depth HTTP security headers to all responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


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

    # Security Headers Middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS Middleware with configurable allowlist
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(placeholder_router)
    app.include_router(prediction_router)
    app.include_router(segmentation_router)
    app.include_router(upload_router)
    app.include_router(user_router)
    app.include_router(claims_router)
    app.include_router(media_router)

    @app.get("/", tags=["health"])
    def root() -> dict[str, str]:
        """Return the public API welcome payload."""
        return {"message": "CropVisionAI API Running", "version": settings.version}

    return app


app = create_app()
