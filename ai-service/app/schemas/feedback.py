from __future__ import annotations

from pydantic import BaseModel, Field
from app.models.explanation_feedback import ExplanationFeedbackLabel


class ExplanationFeedbackCreate(BaseModel):
    """Payload to submit or update an inspector's Grad-CAM explanation feedback."""

    feedback_label: ExplanationFeedbackLabel = Field(
        ...,
        description="Standardized inspector assessment label (RELEVANT, PARTIALLY_RELEVANT, NOT_RELEVANT, UNABLE_TO_ASSESS)",
    )
    comment: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional qualitative comment or context from the inspector",
    )


class ExplanationFeedbackData(BaseModel):
    """Serialized representation of an explanation feedback record."""

    id: int
    prediction_id: int
    claim_id: int | None = None
    inspector_id: int
    inspector_name: str | None = None
    inspector_email: str | None = None
    feedback_label: ExplanationFeedbackLabel
    comment: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class ExplanationFeedbackResponse(BaseModel):
    """Standard API response envelope for explanation feedback."""

    success: bool = True
    message: str = "Explanation feedback recorded successfully."
    data: ExplanationFeedbackData
