from __future__ import annotations

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema
from app.schemas.users import UserResponse


class UserRegisterRequest(BaseSchema):
    """Email/password registration request."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = Field(default=None, min_length=1, max_length=255)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        """Require at least one letter and one digit."""
        if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one letter and one number")
        return value


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
