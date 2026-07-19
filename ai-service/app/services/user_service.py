from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Retrieve a user by their database ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_firebase_uid(db: Session, firebase_uid: str) -> User | None:
    """Retrieve a user by their unique Firebase UID."""
    return db.query(User).filter(User.firebase_uid == firebase_uid).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Retrieve a user by their unique email address."""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    """Retrieve a list of users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user_in: UserCreate) -> User:
    """Create a new user record in the database."""
    db_user = User(
        firebase_uid=user_in.firebase_uid,
        full_name=user_in.full_name,
        email=user_in.email,
        role=user_in.role,
        status=user_in.status,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    """Update an existing user record in the database."""
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user record by database ID."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
