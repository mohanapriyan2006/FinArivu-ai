"""Goal schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class GoalBase(BaseModel):
    """Base goal schema."""

    goal_name: str = Field(..., min_length=1, max_length=100)
    goal_type: str = Field(..., pattern=r"^(House|Car|Emergency Fund|Vacation|Marriage|Education|Custom)$")
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=Decimal("0"), ge=0)
    target_date: date
    status: str = Field(default="Active", pattern=r"^(Active|Completed|Paused)$")


class GoalCreate(GoalBase):
    """Schema for creating a goal."""

    pass


class GoalUpdate(BaseModel):
    """Schema for updating a goal."""

    goal_name: str | None = Field(None, min_length=1, max_length=100)
    goal_type: str | None = Field(None, pattern=r"^(House|Car|Emergency Fund|Vacation|Marriage|Education|Custom)$")
    target_amount: Decimal | None = Field(None, gt=0)
    current_amount: Decimal | None = Field(None, ge=0)
    target_date: date | None = None
    status: str | None = Field(None, pattern=r"^(Active|Completed|Paused)$")


class GoalResponse(GoalBase):
    """Schema for goal response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class GoalSummary(BaseModel):
    """Goal summary statistics."""

    total_goals: int
    completed_goals: int
    average_progress: float
    upcoming_deadlines: list[GoalResponse]
