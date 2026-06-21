"""Budget schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    """Base budget schema."""

    category_id: uuid.UUID
    monthly_limit: Decimal = Field(..., gt=0, description="Monthly budget limit must be greater than 0")


class BudgetCreate(BudgetBase):
    """Schema for creating a budget."""

    pass


class BudgetUpdate(BaseModel):
    """Schema for updating a budget."""

    category_id: uuid.UUID | None = None
    monthly_limit: Decimal | None = Field(None, gt=0, description="Monthly budget limit must be greater than 0")


class BudgetResponse(BudgetBase):
    """Schema for budget response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    category_name: str | None = None
    created_at: datetime
    updated_at: datetime


class BudgetAnalysisItem(BaseModel):
    """Single category budget analysis result."""

    category: str
    budget: Decimal
    spent: Decimal
    remaining: Decimal
    usage: float
    status: str
    recommendation: str


class BudgetAnalysisResponse(BaseModel):
    """Budget analysis response with all categories and summary."""

    categories: list[BudgetAnalysisItem]
    summary: dict
