from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    """Base fields for User schemas."""

    email: str = Field(..., max_length=255)
    full_name: str = Field(..., max_length=150)


class UserCreate(UserBase):
    """Schema for creating a new user in the database."""

    firebase_uid: str = Field(..., max_length=128)
    role: UserRole = Field(default=UserRole.FARMER)
    status: UserStatus = Field(default=UserStatus.ACTIVE)


class UserRegister(BaseModel):
    """Schema for a user registering via self-signup."""

    full_name: str = Field(..., max_length=150)
    role: UserRole = Field(default=UserRole.FARMER)


class UserUpdate(BaseModel):
    """Schema for updating an existing user's details."""

    full_name: str | None = Field(default=None, max_length=150)
    email: str | None = Field(default=None, max_length=255)
    role: UserRole | None = Field(default=None)
    status: UserStatus | None = Field(default=None)


class UserResponse(UserBase):
    """Schema for returning user information."""

    id: int
    firebase_uid: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
