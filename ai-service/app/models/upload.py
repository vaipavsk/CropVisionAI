from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.prediction import Prediction
    from app.models.user import User


class UploadStatus(str, Enum):
    """Supported file upload states."""

    PENDING_ANALYSIS = "PENDING_ANALYSIS"
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Upload(Base):
    """Represents an image upload submitted by a user."""

    __tablename__ = "uploads"
    __table_args__ = (
        UniqueConstraint("file_name", name="uq_uploads_file_name"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(nullable=True)
    status: Mapped[UploadStatus] = mapped_column(default=UploadStatus.PENDING_ANALYSIS, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    user: Mapped["User | None"] = relationship(back_populates="uploads")
    prediction: Mapped["Prediction | None"] = relationship(
        back_populates="upload",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
