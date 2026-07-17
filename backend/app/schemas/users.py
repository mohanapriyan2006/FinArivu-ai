from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.constants import UserRole
from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class UserBase(BaseSchema):
    """Base user fields."""

    email: EmailStr
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = True
    email_verified: bool = False
    preferences: dict | None = None

    model_config = ConfigDict(use_enum_values=True)


class UserCreate(UserBase):
    """Create a user manually (e.g., admin onboarding)."""

    clerk_id: str = Field(..., min_length=1, max_length=255)


class UserUpdate(BaseSchema):
    """Update a user."""

    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    email_verified: bool | None = None
    preferences: dict | None = None


class UserResponse(AuditedSchema, UserBase):
    """User response DTO."""

    clerk_id: str
    last_login_at: datetime | None


class UserListResponse(PaginatedResponse[UserResponse]):
    """Paginated list of users."""

    pass


class UserLoginResponse(BaseModel):
    """Response for a successful Clerk authentication sync."""

    message: str
    user: UserResponse
