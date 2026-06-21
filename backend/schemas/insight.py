"""Insight schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InsightBase(BaseModel):
    """Base insight schema."""

    category: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    description: str
    priority: str = Field(..., pattern=r"^(high|medium|low)$")
    action: str


class InsightCreate(InsightBase):
    """Schema for creating an insight."""

    pass


class InsightResponse(InsightBase):
    """Schema for insight response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    is_read: bool
    created_at: datetime


class InsightUpdate(BaseModel):
    """Schema for updating an insight."""

    is_read: bool | None = None
