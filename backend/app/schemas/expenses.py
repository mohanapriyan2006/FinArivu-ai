from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class ExpenseBase(BaseSchema):
    """Base expense fields."""

    category_id: UUID
    amount: Decimal = Field(..., decimal_places=2, max_digits=15, gt=0)
    description: str | None = Field(default=None, max_length=1000)
    expense_date: date
    payment_method: str | None = Field(default=None, max_length=100)
    is_recurring: bool = False


class ExpenseCreate(ExpenseBase):
    """Create an expense record."""

    pass


class ExpenseUpdate(BaseSchema):
    """Update an expense record."""

    category_id: UUID | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=1000)
    expense_date: date | None = None
    payment_method: str | None = Field(default=None, max_length=100)
    is_recurring: bool | None = None


class ExpenseResponse(AuditedSchema, ExpenseBase):
    """Expense response DTO."""

    user_id: UUID


class ExpenseFilter(BaseSchema):
    """Filters for listing expenses."""

    category_id: UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    payment_method: str | None = None
    is_recurring: bool | None = None


class ExpenseListResponse(PaginatedResponse[ExpenseResponse]):
    """Paginated list of expense records."""

    pass
