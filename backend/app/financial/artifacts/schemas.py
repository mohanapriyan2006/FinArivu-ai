from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.base import BaseSchema


class ArtifactType(str, Enum):
    """Controlled vocabulary of artifact types the backend may emit.

    The React Native client renders a dedicated card for the card types it
    knows and falls back to a generic card for anything else.
    """

    HEALTH_CARD = "health_card"
    BUDGET_CARD = "budget_card"
    EXPENSE_CARD = "expense_card"
    GOAL_CARD = "goal_card"
    TAX_CARD = "tax_card"
    RETIREMENT_CARD = "retirement_card"
    NETWORTH_CARD = "networth_card"
    CASHFLOW_CARD = "cashflow_card"
    REPORT_CARD = "report_card"
    INSIGHT_CARD = "insight_card"
    GENERIC_CARD = "generic_card"
    PIE_CHART = "pie_chart"
    BAR_CHART = "bar_chart"
    LINE_CHART = "line_chart"
    DONUT_CHART = "donut_chart"
    COMPARISON_TABLE = "comparison_table"
    PROGRESS_CARD = "progress_card"
    TIMELINE_CARD = "timeline_card"
    WEEKLY_REPORT_CARD = "weekly_report_card"
    MONTHLY_REPORT_CARD = "monthly_report_card"
    ACTION_PREVIEW_CARD = "action_preview_card"
    ACTION_RESULT_CARD = "action_result_card"
    ACTION_HISTORY_CARD = "action_history_card"
    SCENARIO_CARD = "scenario_card"
    SCENARIO_COMPARISON_CARD = "scenario_comparison_card"
    MONEY_RADAR_CARD = "money_radar_card"


class Artifact(BaseSchema):
    """Structured UI artifact returned to the React Native frontend.

    Canonical definition — do not redefine this model elsewhere.
    ``content`` is a camelCase key dict produced by the deterministic
    financial engines / tool layer.
    """

    type: str
    title: str
    content: dict[str, Any] = Field(default_factory=dict)


class ChartDataset(BaseModel):
    label: str
    data: list[float]


class BarChartArtifact(BaseModel):
    labels: list[str]
    datasets: list[ChartDataset]


class PieChartArtifact(BaseModel):
    labels: list[str]
    data: list[float]


class LineChartArtifact(BaseModel):
    labels: list[str]
    datasets: list[ChartDataset]


class DonutChartArtifact(BaseModel):
    labels: list[str]
    data: list[float]
