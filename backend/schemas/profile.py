"""Profile schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProfileBase(BaseModel):
    """Base profile schema."""

    full_name: str | None = None
    age: int | None = Field(None, ge=18, le=100)
    city: str | None = None
    occupation: str | None = None
    monthly_income: Decimal | None = Field(None, ge=0)
    retirement_age: int | None = Field(None, ge=40, le=80)


class ProfileCreate(ProfileBase):
    """Schema for creating a profile."""

    user_id: uuid.UUID


class ProfileUpdate(ProfileBase):
    """Schema for updating a profile."""

    pass


class ProfileResponse(ProfileBase):
    """Schema for profile response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
