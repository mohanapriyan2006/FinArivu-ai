"""Auth API routes (register, login)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.user import TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from services.user_service import user_service
from utils.exceptions import ValidationError, AuthenticationError
from utils.response import success_response, error_response

router = APIRouter(tags=["Auth"])


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegisterRequest,
    session: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    try:
        user = await user_service.register(session, data.email, data.password)
        token = await user_service.authenticate(session, data.email, data.password)
        return success_response(
            data=TokenResponse(
                access_token=token,
                user=UserResponse.model_validate(user),
            ),
            message="User registered successfully",
        )
    except ValidationError as exc:
        return error_response(
            message=exc.detail,
            error_code=exc.error_code,
        )
    except AuthenticationError as exc:
        return error_response(
            message=exc.detail,
            error_code=exc.error_code,
        )


@router.post("/auth/login", status_code=status.HTTP_200_OK)
async def login(
    data: UserLoginRequest,
    session: AsyncSession = Depends(get_db),
):
    """Login and get access token."""
    try:
        token = await user_service.authenticate(session, data.email, data.password)
        return success_response(
            data=TokenResponse(access_token=token),
            message="Login successful",
        )
    except AuthenticationError as exc:
        return error_response(
            message=exc.detail,
            error_code=exc.error_code,
        )
