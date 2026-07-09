from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response model for health checks."""

    status: str = Field(default="ok")
    service: str = Field(default="CropVisionAI")
