"""
SQLAlchemy ORM model for the `users` table.

Matches the existing MySQL schema exactly — no ALTER TABLE required.

Schema (from DESCRIBE users):
  id            INT AUTO_INCREMENT PRIMARY KEY
  firebase_uid  VARCHAR(128) NOT NULL UNIQUE
  full_name     VARCHAR(150) NOT NULL
  email         VARCHAR(255) NOT NULL UNIQUE
  role          ENUM('FARMER','INSPECTOR','ADMIN') NOT NULL
  status        ENUM('ACTIVE','INACTIVE') NOT NULL
  created_at    DATETIME NOT NULL
  updated_at    DATETIME NOT NULL
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func

from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    firebase_uid = Column(String(128), nullable=False, unique=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    role = Column(
        Enum("FARMER", "INSPECTOR", "ADMIN", name="user_role"),
        nullable=False,
        default="FARMER",
    )
    status = Column(
        Enum("ACTIVE", "INACTIVE", name="user_status"),
        nullable=False,
        default="ACTIVE",
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self) -> dict:
        """Return a JSON-serialisable representation of this user."""
        return {
            "id": self.id,
            "firebase_uid": self.firebase_uid,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
