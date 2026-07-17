from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id, get_token_payload
from app.schemas.base import MessageResponse
from app.schemas.users import UserCreate, UserResponse, UserUpdate
from app.services.users import UserService
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/users", tags=["Users"])


def get_user_service(session: AsyncSession = Depends(get_db_session)) -> UserService:
    return UserService(session)


@router.post(
    "/sync",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Sync authenticated Clerk user to local database",
)
async def sync_user(
    request: Request,
    payload: dict = Depends(get_token_payload),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Verify the Clerk token and sync/create the user record."""
    service = UserService(session)
    user = await service.get_or_create_from_clerk(payload)
    request.state.user_id = user.id
    return success_response(
        data=UserResponse.model_validate(user).model_dump(),
        message="User synced successfully",
    )


@router.get("/me", response_model=dict, summary="Get current authenticated user")
async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the currently authenticated user."""
    service = UserService(session)
    user = await service.get(uuid.UUID(user_id))
    request.state.user_id = user.id
    return success_response(
        data=UserResponse.model_validate(user).model_dump(),
        message="User retrieved successfully",
    )


@router.get("/{user_id}", response_model=dict, summary="Get a user by ID")
async def get_user(
    user_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a user by ID (users can only access themselves for now)."""
    if str(user_id) != current_user_id:
        return error_response(
            message="You can only view your own profile",
            error_code="AUTHORIZATION_ERROR",
        )

    service = UserService(session)
    user = await service.get(user_id)
    request.state.user_id = user.id
    return success_response(
        data=UserResponse.model_validate(user).model_dump(),
        message="User retrieved successfully",
    )


@router.put("/{user_id}", response_model=dict, summary="Update a user")
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> dict:
    """Update the authenticated user."""
    if str(user_id) != current_user_id:
        return error_response(
            message="You can only update your own profile",
            error_code="AUTHORIZATION_ERROR",
        )

    user = await service.update(user_id, data)
    request.state.user_id = user.id
    return success_response(
        data=UserResponse.model_validate(user).model_dump(),
        message="User updated successfully",
    )


@router.delete(
    "/{user_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Soft-delete a user",
)
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> dict:
    """Soft-delete the authenticated user."""
    if str(user_id) != current_user_id:
        return error_response(
            message="You can only delete your own profile",
            error_code="AUTHORIZATION_ERROR",
        )

    await service.delete(user_id, soft=True)
    request.state.user_id = user_id
    return success_response(
        message="User deleted successfully",
    )
