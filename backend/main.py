import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from sqlalchemy import text

from app.config.database import engine
from app.routes.upload import router as upload_router
from app.routes.users import router as users_router

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(
    title="CropVisionAI API",
    description="XAI-Driven Crop Damage Assessment Backend",
    version="1.0",
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


# ── Security Headers Middleware ───────────────────────────────────────────────
app.add_middleware(SecurityHeadersMiddleware)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Vite dev server (port 5173) and any configured production origin.
_raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allowed_origins = [orig.strip() for orig in _raw_origins.split(",") if orig.strip()]
if not _allowed_origins:
    _allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to CropVisionAI Backend"
    }


@app.get("/health")
def health():
    return {
        "status": "Backend Running",
        "project": "CropVisionAI",
        "version": "1.0"
    }


@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "database": "Connected Successfully"
        }
    except Exception as exc:
        return {
            "database": "Connection Failed",
            "error": str(exc)
        }