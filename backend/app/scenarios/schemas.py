"""Typed contracts for the Scenario Lab.

Two layers of models:

* ``*Params`` — the typed input for each scenario type. Names may be
  resolvable references (``category_name``, ``goal_name``, ``loan_name``);
  the service resolves them against user-owned entities.
* Wire models — ``ScenarioRunRequest`` / ``ScenarioRunResponse`` /
  ``ScenarioHistoryItem`` / ``ScenarioCompare*``.

Every response carries baseline + scenario + metric diffs + explicit
assumptions — the frontend never has to infer what changed or why.
All models serialise camelCase via ``BaseSchema``.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import Field, model_validator

from app.scenarios.scenario_types import (
    DataQuality,
    MetricDirection,
    MetricUnit,
    ScenarioRunStatus,
    ScenarioType,
)
from app.schemas.base import BaseSchema


# ── Parameter models (one per scenario type — no generic variable/delta) ───


class IncomeChangeParams(BaseSchema):
    """'What if my salary rises 10%' / 'income becomes ₹90,000'."""

    change_type: Literal["percent", "amount", "set"] = "amount"
    change_value: Decimal = Field(..., description="percent points, ±amount, or absolute")
    source: str | None = Field(default=None, max_length=255)


class ExpenseChangeParams(BaseSchema):
    """'What if my expenses go up by ₹5,000' — total spending change."""

    change_type: Literal["percent", "amount", "set"] = "amount"
    change_value: Decimal


class CategorySpendingChangeParams(BaseSchema):
    """'What if I spend ₹3,000 less on dining' — one category."""

    category_id: UUID | None = None
    category_name: str | None = Field(default=None, max_length=255)
    change_type: Literal["percent", "amount", "set"] = "amount"
    # amount = signed monthly change; percent = % of current; set = new level
    change_value: Decimal


class BudgetChangeParams(BaseSchema):
    """'What if my dining budget is ₹6,000' — simulated budget cap."""

    budget_id: UUID | None = None
    category_id: UUID | None = None
    category_name: str | None = Field(default=None, max_length=255)
    new_monthly_limit: Decimal = Field(..., gt=0)


class MonthlySavingsChangeParams(BaseSchema):
    """'What if I save ₹5,000 more each month'."""

    change_amount: Decimal = Field(..., description="signed monthly delta")


class GoalContributionChangeParams(BaseSchema):
    """'What if I put ₹5,000 more each month toward my laptop goal'."""

    goal_id: UUID | None = None
    goal_name: str | None = Field(default=None, max_length=255)
    additional_monthly: Decimal | None = None
    new_monthly_contribution: Decimal | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _one_required(self) -> "GoalContributionChangeParams":
        if self.additional_monthly is None and self.new_monthly_contribution is None:
            raise ValueError(
                "additionalMonthly or newMonthlyContribution is required"
            )
        return self


class GoalTargetChangeParams(BaseSchema):
    """'What if my laptop goal becomes ₹90,000'."""

    goal_id: UUID | None = None
    goal_name: str | None = Field(default=None, max_length=255)
    new_target_amount: Decimal = Field(..., gt=0)


class GoalDeadlineChangeParams(BaseSchema):
    """'What if I move my laptop goal to December'."""

    goal_id: UUID | None = None
    goal_name: str | None = Field(default=None, max_length=255)
    new_target_date: date


class PurchaseParams(BaseSchema):
    """'Can I afford a ₹75,000 laptop next month'."""

    purchase_amount: Decimal = Field(..., gt=0)
    item_name: str = Field(default="Purchase", max_length=255)
    months_from_now: int = Field(default=1, ge=0, le=24)
    funding_source: Literal["surplus_and_savings"] = "surplus_and_savings"


class RetirementAgeChangeParams(BaseSchema):
    """'What if I retire at 55'."""

    new_retirement_age: int = Field(..., ge=30, le=80)


class InflationChangeParams(BaseSchema):
    """'What if inflation is 8%'."""

    new_inflation_rate: Decimal = Field(..., ge=0, le=Decimal("0.20"))


class LoanPrepaymentParams(BaseSchema):
    """'What if I prepay ₹50,000 on my home loan'."""

    loan_id: UUID | None = None
    loan_name: str | None = Field(default=None, max_length=255)
    prepayment_amount: Decimal = Field(..., gt=0)


class LoanEmiChangeParams(BaseSchema):
    """'What if my EMI goes to ₹15,000'."""

    loan_id: UUID | None = None
    loan_name: str | None = Field(default=None, max_length=255)
    new_emi: Decimal = Field(..., gt=0)


class EmergencyFundTargetChangeParams(BaseSchema):
    """'What if my emergency fund target is 9 months'."""

    target_months: int = Field(..., ge=1, le=36)
    monthly_contribution: Decimal | None = Field(default=None, gt=0)


# ── Proposal (extractor / controller output — never trusted blindly) ───────


class ScenarioProposal(BaseSchema):
    """Structured scenario proposal — still requires service validation."""

    scenario_type: str = ""
    parameters: dict[str, Any] = Field(default_factory=dict)
    title: str = ""
    missing_fields: list[str] = Field(default_factory=list)
    reason: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


# ── Wire request/response models ───────────────────────────────────────────


class ScenarioRunRequest(BaseSchema):
    """Client request to run a scenario simulation. Never mutates data."""

    scenario_type: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    title: str | None = Field(default=None, max_length=255)
    session_id: str | None = Field(default=None, max_length=255)
    save: bool = False


class ScenarioSaveRequest(BaseSchema):
    """Persist a scenario definition (and optionally its latest result)."""

    scenario_type: str
    title: str | None = Field(default=None, max_length=255)
    parameters: dict[str, Any] = Field(default_factory=dict)
    session_id: str | None = Field(default=None, max_length=255)


class ScenarioAssumption(BaseSchema):
    """A single disclosed assumption — every material default is surfaced."""

    key: str
    label: str
    value: Any
    source: Literal["default", "user", "engine"] = "default"


class ScenarioMetric(BaseSchema):
    """One baseline→scenario comparison row."""

    key: str
    label: str
    before: Any = None
    after: Any = None
    change: Any = None
    unit: MetricUnit = MetricUnit.CURRENCY
    direction: MetricDirection = MetricDirection.UNCHANGED


class ScenarioApplyAction(BaseSchema):
    """Phase 1 bridge — the operation + arguments to hand to /preview."""

    operation: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    label: str


class ScenarioRunResponse(BaseSchema):
    """Canonical scenario result — baseline, scenario, diff, assumptions."""

    scenario_id: UUID | None = None
    scenario_type: ScenarioType | None = None
    title: str = ""
    status: ScenarioRunStatus
    baseline: dict[str, Any] = Field(default_factory=dict)
    scenario: dict[str, Any] = Field(default_factory=dict)
    metrics: list[ScenarioMetric] = Field(default_factory=list)
    assumptions: list[ScenarioAssumption] = Field(default_factory=list)
    affected_domains: list[str] = Field(default_factory=list)
    data_available: list[str] = Field(default_factory=list)
    data_missing: list[str] = Field(default_factory=list)
    data_quality: DataQuality = DataQuality.COMPLETE
    summary: str = ""
    explanation: list[str] = Field(default_factory=list)
    apply_action: ScenarioApplyAction | None = None
    alternatives: list[dict[str, Any]] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    clarification_question: str | None = None
    engine_version: str = ""
    generated_at: datetime | None = None
    simulated_at: datetime | None = None


class ScenarioHistoryItem(BaseSchema):
    """Compact saved-scenario row for the history surface."""

    id: UUID
    scenario_type: ScenarioType
    title: str = ""
    status: ScenarioRunStatus
    headline: str = ""
    created_at: datetime | None = None
    engine_version: str = ""


class ScenarioCompareRequest(BaseSchema):
    """Compare up to N scenarios — fresh inputs or saved run ids."""

    scenarios: list[ScenarioSaveRequest] = Field(default_factory=list)
    scenario_ids: list[UUID] = Field(default_factory=list)


class ScenarioCompareCell(BaseSchema):
    after: Any = None
    change: Any = None
    direction: MetricDirection = MetricDirection.UNCHANGED


class ScenarioCompareRow(BaseSchema):
    key: str
    label: str
    unit: MetricUnit = MetricUnit.CURRENCY
    before: Any = None
    cells: list[ScenarioCompareCell] = Field(default_factory=list)


class ScenarioCompareResponse(BaseSchema):
    titles: list[str] = Field(default_factory=list)
    rows: list[ScenarioCompareRow] = Field(default_factory=list)
    engine_version: str = ""
    generated_at: datetime | None = None
