from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.prediction import Prediction


class ClaimStatus(str, Enum):
    """Supported claim states."""

    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class Claim(Base):
    """Represents an insurance claim derived from a prediction."""

    __tablename__ = "claims"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    prediction_id: Mapped[int] = mapped_column(
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    claim_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    amount: Mapped[float | None] = mapped_column(nullable=True)
    status: Mapped[ClaimStatus] = mapped_column(
        default=ClaimStatus.DRAFT,
        nullable=False,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    prediction: Mapped["Prediction"] = relationship(back_populates="claim")
