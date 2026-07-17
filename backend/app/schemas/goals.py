from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.constants import GoalPriority, GoalStatus
from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class GoalBase(BaseSchema):
    """Base goal fields."""

    goal_name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., decimal_places=2, max_digits=15, gt=0)
    current_amount: Decimal = Field(default=Decimal("0"), decimal_places=2, max_digits=15, ge=0)
    target_date: date | None = None
    priority: GoalPriority = GoalPriority.MEDIUM
    status: GoalStatus = GoalStatus.ACTIVE
    description: str | None = Field(default=None, max_length=1000)


class GoalCreate(GoalBase):
    """Create a financial goal."""

    pass


class GoalUpdate(BaseSchema):
    """Update a financial goal."""

    goal_name: str | None = Field(default=None, min_length=1, max_length=255)
    target_amount: Decimal | None = Field(default=None, gt=0)
    current_amount: Decimal | None = Field(default=None, ge=0)
    target_date: date | None = None
    priority: GoalPriority | None = None
    status: GoalStatus | None = None
    description: str | None = Field(default=None, max_length=1000)


class GoalResponse(AuditedSchema, GoalBase):
    """Goal response DTO."""

    user_id: UUID


class GoalContributionResponse(BaseSchema):
    """Projected monthly contribution for a goal."""

    goal_id: UUID
    monthly_contribution: Decimal
    months_remaining: int
    completion_percentage: Decimal
    status: str
    suggestions: list[str]


class GoalListResponse(PaginatedResponse[GoalResponse]):
    """Paginated list of goals."""

    pass
