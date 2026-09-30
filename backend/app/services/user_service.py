"""
User service — database operations for the users table.

All functions accept a SQLAlchemy Session and return ORM User objects.
None of these functions commit the session; callers manage transactions.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_firebase_uid(db: Session, firebase_uid: str) -> Optional[User]:
    """Return the User row whose firebase_uid matches, or None."""
    return db.query(User).filter(User.firebase_uid == firebase_uid).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Return the User row whose email matches, or None."""
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    firebase_uid: str,
    email: str,
    full_name: str,
    role: str = "FARMER",
) -> User:
    """
    Insert a new user row and return the persisted User object.

    The caller is responsible for committing the session after this call.
    Status is always set to 'ACTIVE' for new self-registered users.
    """
    now = datetime.utcnow()
    new_user = User(
        firebase_uid=firebase_uid,
        email=email,
        full_name=full_name,
        role=role,
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    db.add(new_user)
    db.flush()   # Assigns the auto-increment id without committing
    db.refresh(new_user)
    return new_user
