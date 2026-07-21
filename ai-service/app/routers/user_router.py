from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user, verify_firebase_token
from app.models.user import User, UserRole, UserStatus
from app.security.roles import RoleChecker
from app.schemas.user import UserCreate, UserRegister, UserResponse, UserUpdate
from app.services import user_service

logger = logging.getLogger("cropvision.user_router")

router = APIRouter(prefix="/users", tags=["users"])

# Dependencies shortcuts
get_admin_user = Depends(RoleChecker([UserRole.ADMIN]))


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_reg: UserRegister,
    decoded_token: Annotated[dict, Depends(verify_firebase_token)],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Self-signup registration endpoint.
    
    Verifies Firebase token and registers the user in MySQL database as a FARMER.
    """
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")

    logger.info(f"Self-registration attempt for email '{email}' (UID: {firebase_uid})")

    if not firebase_uid or not email:
        logger.warning("Registration failed: Firebase token missing email or UID claim.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token missing email or UID claim.",
        )

    # Check if user already exists
    existing_user = user_service.get_user_by_firebase_uid(db, firebase_uid)
    if existing_user:
        logger.info(f"User with UID '{firebase_uid}' already registered. Returning profile.")
        return existing_user

    # Double check if email already registered to someone else
    existing_email = user_service.get_user_by_email(db, email)
    if existing_email:
        logger.warning(f"Registration failed: Email address '{email}' already registered.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use.",
        )

    # Provision standard active FARMER
    user_in = UserCreate(
        firebase_uid=firebase_uid,
        email=email,
        full_name=user_reg.full_name,
        role=UserRole.FARMER,
        status=UserStatus.ACTIVE,
    )
    new_user = user_service.create_user(db, user_in)
    logger.info(f"Successfully registered new FARMER user in MySQL: '{email}' (ID: {new_user.id})")
    return new_user


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Retrieve profile details of the currently authenticated database user."""
    return current_user


# --- ADMIN ONLY ROUTES ---

@router.get("", response_model=list[UserResponse], dependencies=[get_admin_user])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
) -> list[UserResponse]:
    """Retrieve all users in the platform (Admin only)."""
    return user_service.get_users(db, skip=skip, limit=limit)


@router.post("", response_model=UserResponse, dependencies=[get_admin_user])
def admin_create_user(
    user_in: UserCreate,
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Pre-register or provision a user manually (Admin only)."""
    existing_user = user_service.get_user_by_firebase_uid(db, user_in.firebase_uid)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this Firebase UID already exists.",
        )

    existing_email = user_service.get_user_by_email(db, user_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    return user_service.create_user(db, user_in)


@router.put("/{user_id}", response_model=UserResponse, dependencies=[get_admin_user])
def admin_update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Update user parameters, including roles and active/inactive status (Admin only)."""
    db_user = user_service.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    # Validate email changes
    if user_update.email and user_update.email != db_user.email:
        existing_email = user_service.get_user_by_email(db, user_update.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already in use.",
            )

    return user_service.update_user(db, db_user, user_update)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[get_admin_user])
def admin_delete_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Remove a user from the platform (Admin only)."""
    deleted = user_service.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )
