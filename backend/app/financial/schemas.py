from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import BaseSchema


# Internal engine result contracts. These models are consumed by the tool
# layer (``app.financial.tools``) and serialised into agent ``data`` payloads
# and artifact ``content`` dicts, so they use ``BaseSchema`` to emit the same
# camelCase keys the agents and the React Native cards expect.
#
# Budget / goal / health / net-worth results reuse the canonical API response
# models from ``app.schemas.financial`` directly — they are intentionally NOT
# redefined here.


class TaxSlab(BaseSchema):
    limit: float
    rate: float


class TaxAnalysis(BaseSchema):
    """Old-vs-new regime comparison for the current user."""

    regime: str
    gross_income: float = 0
    deductions: float = 0
    taxable_income: float = 0
    tax_amount: float = 0
    effective_tax_rate: float = 0
    old_regime_tax: float = 0
    new_regime_tax: float = 0
    better_regime: str = ""
    savings: float = 0
    slabs: list[TaxSlab] = Field(default_factory=list)


class CashFlowAnalysis(BaseSchema):
    total_income: float = 0
    total_expenses: float = 0
    savings: float = 0
    savings_rate: float = 0
    burn_rate: float = 0
    runway_months: float = 0
    monthly_trend: list[dict[str, Any]] = Field(default_factory=list)


class ScenarioInput(BaseSchema):
    variable: str
    delta: float
    unit: str = "amount"


class Recommendation(BaseSchema):
    title: str
    description: str
    category: str
    priority: str = "medium"


class RecommendationResult(BaseSchema):
    recommendations: list[Recommendation] = Field(default_factory=list)
    priority_summary: dict[str, int] = Field(default_factory=dict)


class ReportSection(BaseSchema):
    title: str
    type: str
    data: dict[str, Any] = Field(default_factory=dict)


class ReportResult(BaseSchema):
    period: str = "monthly"
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    summary: str = ""
    health_score: float = 0
    budget_summary: dict[str, Any] = Field(default_factory=dict)
    goal_progress: dict[str, Any] = Field(default_factory=dict)
    net_worth: dict[str, Any] = Field(default_factory=dict)
    cash_flow: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[Recommendation] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    improvement_areas: list[str] = Field(default_factory=list)
    sections: list[ReportSection] = Field(default_factory=list)


class SimulationResult(BaseSchema):
    """What-if scenario output.

    ``inputs`` echoes the baseline values used, ``assumptions`` exposes every
    modelling assumption that influenced the numbers so callers can inspect
    or display them.
    """

    scenario: ScenarioInput
    inputs: dict[str, Any] = Field(default_factory=dict)
    assumptions: dict[str, Any] = Field(default_factory=dict)
    current: dict[str, Any] = Field(default_factory=dict)
    optimized: dict[str, Any] = Field(default_factory=dict)
    difference: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)
