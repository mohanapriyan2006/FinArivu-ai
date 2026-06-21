"""Income schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class IncomeBase(BaseModel):
    """Base income schema."""

    source: str
    amount: Decimal = Field(..., gt=0)
    income_date: date
    notes: str | None = None


class IncomeCreate(IncomeBase):
    """Schema for creating income."""

    pass


class IncomeUpdate(BaseModel):
    """Schema for updating income."""

    source: str | None = None
    amount: Decimal | None = Field(None, gt=0)
    income_date: date | None = None
    notes: str | None = None


class IncomeResponse(IncomeBase):
    """Schema for income response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
