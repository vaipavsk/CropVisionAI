from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.claim import Claim
    from app.models.upload import Upload


class PredictionStatus(str, Enum):
    """Supported prediction states."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class Prediction(Base):
    """Represents the AI prediction generated for an upload."""

    __tablename__ = "predictions"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    upload_id: Mapped[int] = mapped_column(
        ForeignKey("uploads.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    damage_class: Mapped[str] = mapped_column(String(100), nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PredictionStatus] = mapped_column(
        default=PredictionStatus.PENDING,
        nullable=False,
        index=True,
    )
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

    upload: Mapped["Upload"] = relationship(back_populates="prediction")
    claim: Mapped["Claim | None"] = relationship(
        back_populates="prediction",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
