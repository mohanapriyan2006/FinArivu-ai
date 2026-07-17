from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.constants import BudgetPeriod
from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class BudgetBase(BaseSchema):
    """Base budget fields."""

    category_id: UUID
    monthly_limit: Decimal = Field(..., decimal_places=2, max_digits=15, gt=0)
    period: BudgetPeriod = BudgetPeriod.MONTHLY


class BudgetCreate(BudgetBase):
    """Create a budget."""

    pass


class BudgetUpdate(BaseSchema):
    """Update a budget."""

    monthly_limit: Decimal | None = Field(default=None, gt=0)
    period: BudgetPeriod | None = None


class BudgetResponse(AuditedSchema, BudgetBase):
    """Budget response DTO."""

    user_id: UUID


class BudgetListResponse(PaginatedResponse[BudgetResponse]):
    """Paginated list of budgets."""

    pass
