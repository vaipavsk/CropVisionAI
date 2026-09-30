from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.claim import Claim
    from app.models.prediction import Prediction
    from app.models.user import User


class ExplanationFeedbackLabel(str, Enum):
    """Supported inspector evaluation labels for Grad-CAM explanations."""

    RELEVANT = "RELEVANT"
    PARTIALLY_RELEVANT = "PARTIALLY_RELEVANT"
    NOT_RELEVANT = "NOT_RELEVANT"
    UNABLE_TO_ASSESS = "UNABLE_TO_ASSESS"


class ExplanationFeedback(Base):
    """Represents an inspector's qualitative assessment of a Grad-CAM heatmap explanation."""

    __tablename__ = "explanation_feedbacks"
    __table_args__ = (
        UniqueConstraint("prediction_id", "inspector_id", name="uq_feedback_prediction_inspector"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    prediction_id: Mapped[int] = mapped_column(
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    claim_id: Mapped[int | None] = mapped_column(
        ForeignKey("claims.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    inspector_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    feedback_label: Mapped[ExplanationFeedbackLabel] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    prediction: Mapped["Prediction"] = relationship(back_populates="feedbacks")
    claim: Mapped["Claim | None"] = relationship(back_populates="feedbacks")
    inspector: Mapped["User"] = relationship()
