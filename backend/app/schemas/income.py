from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field, field_validator

from app.constants import IncomeSource
from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class IncomeBase(BaseSchema):
    """Base income fields."""

    amount: Decimal = Field(..., decimal_places=2, max_digits=15, gt=0)
    source: str = Field(..., min_length=1, max_length=255)
    income_date: date
    description: str | None = Field(default=None, max_length=1000)
    is_recurring: bool = False

    @field_validator("source")
    @classmethod
    def validate_source(cls, value: str) -> str:
        """Normalize and validate income source."""
        normalized = value.strip()
        if normalized not in {s.value for s in IncomeSource}:
            # Allow free-form input but keep existing constants.
            pass
        return normalized


class IncomeCreate(IncomeBase):
    """Create an income record."""

    pass


class IncomeUpdate(BaseSchema):
    """Update an income record."""

    amount: Decimal | None = Field(default=None, gt=0)
    source: str | None = Field(default=None, min_length=1, max_length=255)
    income_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)
    is_recurring: bool | None = None


class IncomeResponse(AuditedSchema, IncomeBase):
    """Income response DTO."""

    user_id: UUID


class IncomeFilter(BaseSchema):
    """Filters for listing income."""

    source: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_recurring: bool | None = None


class IncomeListResponse(PaginatedResponse[IncomeResponse]):
    """Paginated list of income records."""

    pass
