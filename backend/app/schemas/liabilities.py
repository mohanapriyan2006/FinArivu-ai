from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.constants import LiabilityType
from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class LiabilityBase(BaseSchema):
    """Base liability fields."""

    liability_type: LiabilityType
    name: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    currency: str = Field(default="INR", min_length=1, max_length=10)
    interest_rate: Decimal | None = Field(default=None, decimal_places=2, max_digits=5, ge=0)
    emi: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    remaining_tenure_months: int | None = Field(default=None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)


class LiabilityCreate(LiabilityBase):
    """Create a liability."""

    pass


class LiabilityUpdate(BaseSchema):
    """Update a liability."""

    liability_type: LiabilityType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=10)
    interest_rate: Decimal | None = Field(default=None, decimal_places=2, max_digits=5, ge=0)
    emi: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    remaining_tenure_months: int | None = Field(default=None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)


class LiabilityResponse(AuditedSchema, LiabilityBase):
    """Liability response DTO."""

    user_id: UUID


class LiabilityListResponse(PaginatedResponse[LiabilityResponse]):
    """Paginated list of liabilities."""

    pass
