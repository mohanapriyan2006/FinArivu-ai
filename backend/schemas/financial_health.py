"""Financial Health Score schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FinancialHealthScoreBase(BaseModel):
    """Base financial health score schema."""

    score: int = Field(..., ge=0, le=100)
    grade: str
    savings_score: int = Field(..., ge=0, le=30)
    emergency_score: int = Field(..., ge=0, le=20)
    debt_score: int = Field(..., ge=0, le=20)
    goal_score: int = Field(..., ge=0, le=15)
    budget_score: int = Field(..., ge=0, le=15)


class FinancialHealthScoreResponse(FinancialHealthScoreBase):
    """Schema for financial health score response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    component_scores: dict
    insights: list[str]
    created_at: datetime


class FinancialHealthCurrentResponse(BaseModel):
    """Current financial health score with breakdown."""

    score: int
    grade: str
    savings_score: int
    emergency_score: int
    debt_score: int
    goal_score: int
    budget_score: int
    insights: list[str]
