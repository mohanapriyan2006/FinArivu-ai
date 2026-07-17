from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.dependencies.auth import get_current_user_id
from app.exceptions import AuthenticationError, ConflictError
from app.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest
from app.schemas.users import UserCreate, UserResponse
from app.services.users import UserService
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user with email and password",
)
async def register(
    data: UserRegisterRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Create a local user account and issue an access/refresh token pair."""
    service = UserService(session)

    email = data.email.lower().strip()
    if await service._repo.get_by_email(email):
        raise ConflictError("Email already registered")

    user = await service.create(
        UserCreate(
            external_id=str(uuid.uuid4()),
            email=email,
        )
    )
    user.password_hash = hash_password(data.password)
    if data.full_name:
        # full_name is stored on the profile; keep it in user preferences for now.
        user.preferences = {**(user.preferences or {}), "fullName": data.full_name}
    await session.flush()

    access_token = create_access_token(user.external_id, user.email)
    refresh_token = create_refresh_token(user.external_id, user.email)

    return success_response(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        ).model_dump(),
        message="User registered successfully",
    )


@router.post(
    "/login",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Authenticate a user with email and password",
)
async def login(
    data: UserLoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Verify credentials and issue an access/refresh token pair."""
    service = UserService(session)

    email = data.email.lower().strip()
    user = await service._repo.get_by_email(email)
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")

    user.last_login_at = datetime.now(timezone.utc)
    await session.flush()

    access_token = create_access_token(user.external_id, user.email)
    refresh_token = create_refresh_token(user.external_id, user.email)

    return success_response(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        ).model_dump(),
        message="Login successful",
    )


@router.post(
    "/refresh",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Refresh an access token",
)
async def refresh(
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict:
    """Exchange a valid refresh token for a new access token."""
    if not authorization:
        raise AuthenticationError("Authorization header is missing")

    payload = verify_token(authorization)
    if payload.get("type") != "refresh":
        raise AuthenticationError("Invalid token type")

    access_token = create_access_token(payload["sub"], payload["email"])
    return success_response(
        data={"accessToken": access_token, "tokenType": "bearer"},
        message="Token refreshed successfully",
    )


@router.post(
    "/logout",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Log out the current user",
)
async def logout() -> dict:
    """Client-side token discard endpoint; returns success."""
    return success_response(message="Logged out successfully")


@router.get(
    "/me",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user",
)
async def me(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Return the currently authenticated user."""
    service = UserService(session)
    user = await service.get(uuid.UUID(user_id))
    return success_response(
        data=UserResponse.model_validate(user).model_dump(),
        message="User retrieved successfully",
    )
