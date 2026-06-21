"""Expense schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseBase(BaseModel):
    """Base expense schema."""

    category_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    description: str | None = None
    expense_date: date


class ExpenseCreate(ExpenseBase):
    """Schema for creating expense."""

    pass


class ExpenseUpdate(BaseModel):
    """Schema for updating expense."""

    category_id: uuid.UUID | None = None
    amount: Decimal | None = Field(None, gt=0)
    description: str | None = None
    expense_date: date | None = None


class ExpenseResponse(ExpenseBase):
    """Schema for expense response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    category_name: str | None = None
    created_at: datetime
    updated_at: datetime
