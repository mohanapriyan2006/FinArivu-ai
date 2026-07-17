from __future__ import annotations

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema
from app.schemas.users import UserResponse


class UserRegisterRequest(BaseSchema):
    """Email/password registration request."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = Field(default=None, max_length=255)


class UserLoginRequest(BaseSchema):
    """Email/password login request."""

    email: EmailStr
    password: str


class TokenResponse(BaseSchema):
    """Token pair returned on successful authentication."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse | None = None
