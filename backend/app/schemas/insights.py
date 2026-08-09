from __future__ import annotations

from app.schemas.base import BaseSchema


class HealthFactor(BaseSchema):
    """One dimension of the financial health score."""

    id: str
    name: str
    status: str


class FinancialHealth(BaseSchema):
    """Financial health score with explanation."""

    score: int
    status: str
    factors: list[HealthFactor]
    explanation: str


class InsightCard(BaseSchema):
    """A single insight card."""

    category: str
    title: str
    explanation: str
    metric: str | None = None
    action_label: str | None = None
    route: str | None = None


class WeeklyMetric(BaseSchema):
    """One metric in the weekly summary."""

    id: str
    label: str
    value: str


class Trend(BaseSchema):
    """A single trend row."""

    id: str
    label: str
    from_value: str
    to_value: str
    delta: str
    is_positive: bool


class MissingDataItem(BaseSchema):
    """A prompt to add missing financial data."""

    id: str
    title: str
    explanation: str
    action_label: str
    route: str


class InsightsResponse(BaseSchema):
    """Full dynamic payload for the Insights screen."""

    has_data: bool
    health: FinancialHealth | None = None
    top_insight: InsightCard | None = None
    weekly: list[WeeklyMetric] = []
    trends: list[Trend] = []
    attention: list[InsightCard] = []
    positive: list[InsightCard] = []
    missing: list[MissingDataItem] = []
