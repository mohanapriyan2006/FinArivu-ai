from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class ProfileBase(BaseSchema):
    """Base profile fields."""

    full_name: str | None = Field(default=None, max_length=255)
    date_of_birth: date | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    city: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    pan: str | None = Field(default=None, max_length=50)
    monthly_income: Decimal | None = Field(default=None, ge=0)
    retirement_age: int | None = Field(default=None, ge=18, le=100)
    risk_profile: str | None = Field(default=None, max_length=50)
    investment_experience: str | None = Field(default=None, max_length=50)
    bio: str | None = Field(default=None, max_length=1000)

    @field_validator("age", mode="before")
    @classmethod
    def calculate_age(cls, value: int | None, info) -> int | None:
        """Derive age from date_of_birth if age is not provided."""
        if value is not None:
            return value
        dob = info.data.get("date_of_birth")
        if dob:
            today = date.today()
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None


class ProfileCreate(ProfileBase):
    """Create a profile for a user."""

    user_id: UUID


class ProfileUpdate(ProfileBase):
    """Update a user profile."""

    pass


class ProfileResponse(AuditedSchema, ProfileBase):
    """Profile response DTO."""

    user_id: UUID


class ProfileListResponse(PaginatedResponse[ProfileResponse]):
    """Paginated list of profiles."""

    pass
