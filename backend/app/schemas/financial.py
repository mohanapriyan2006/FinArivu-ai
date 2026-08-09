from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema


class HealthScoreResponse(BaseSchema):
    """Computed financial health score."""

    overall_score: Decimal
    savings_score: Decimal
    emergency_score: Decimal
    debt_score: Decimal
    goal_score: Decimal
    budget_score: Decimal
    breakdown: dict
    recommendations: list[str]


class DeductionsInput(BaseSchema):
    """Tax deduction inputs."""

    section_80c: Decimal = Field(default=Decimal("0"), ge=0)
    section_80ccd_1b: Decimal = Field(default=Decimal("0"), ge=0)
    section_80d: Decimal = Field(default=Decimal("0"), ge=0)
    hra: Decimal = Field(default=Decimal("0"), ge=0)
    lta: Decimal = Field(default=Decimal("0"), ge=0)
    section_80e: Decimal = Field(default=Decimal("0"), ge=0)
    section_80g: Decimal = Field(default=Decimal("0"), ge=0)
    standard_deduction: Decimal = Field(default=Decimal("50000"), ge=0)


class TaxRequest(BaseSchema):
    """Income tax calculation request."""

    gross_income: Decimal = Field(..., gt=0)
    regime: str = Field(default="new", pattern="^(old|new)$")
    deductions: DeductionsInput = Field(default_factory=DeductionsInput)


class TaxResponse(BaseSchema):
    """Income tax calculation response."""

    regime: str
    gross_income: Decimal
    deductions_applied: Decimal
    taxable_income: Decimal
    tax_before_cess: Decimal
    cess: Decimal
    total_tax: Decimal
    effective_tax_rate: Decimal
    notes: list[str]


class RetirementRequest(BaseSchema):
    """Retirement projection request."""

    current_age: int = Field(..., ge=18, le=100)
    retirement_age: int = Field(..., ge=19, le=100)
    monthly_expenses: Decimal = Field(..., gt=0)
    inflation_rate: Decimal = Field(default=Decimal("0.06"), ge=0, le=0.5)
    safe_withdrawal_rate: Decimal = Field(default=Decimal("0.04"), ge=0, le=0.5)


class RetirementResponse(BaseSchema):
    """Retirement projection response."""

    current_age: int
    retirement_age: int
    years_to_retirement: int
    current_monthly_expenses: Decimal
    inflation_rate: Decimal
    future_monthly_expenses: Decimal
    future_annual_expenses: Decimal
    retirement_corpus: Decimal
    safe_withdrawal_rate: Decimal
    notes: list[str]


class NetWorthResponse(BaseSchema):
    """Net worth summary response."""

    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    asset_breakdown: dict[str, Decimal]
    liability_breakdown: dict[str, Decimal]
    asset_count: int
    liability_count: int


class BudgetAnalysisCategory(BaseSchema):
    """Budget usage for a category."""

    category_id: UUID
    category_name: str
    budget: Decimal
    spent: Decimal
    usage: Decimal
    overspend: Decimal
    status: str


class BudgetAnalysisResponse(BaseSchema):
    """Budget analysis response."""

    total_budget: Decimal
    total_spent: Decimal
    overall_utilization: Decimal
    remaining_budget: Decimal
    categories: list[BudgetAnalysisCategory]
    overspending_categories: list[BudgetAnalysisCategory]
    savings_opportunity: Decimal
    recommendations: list[str]


class GoalContributionResponse(BaseSchema):
    """Goal contribution projection."""

    goal_id: UUID
    monthly_contribution: Decimal
    months_remaining: int
    completion_percentage: Decimal
    status: str
    suggestions: list[str]


class GoalProjectionsResponse(BaseSchema):
    """All goal projections."""

    goals: list[GoalContributionResponse]
    total_monthly_contribution: Decimal


class DashboardCard(BaseSchema):
    """A single metric card shown on the home dashboard."""

    id: str
    title: str
    label: str
    value: Decimal
    count: int
    has_data: bool
    route: str | None = None


class DashboardResponse(BaseSchema):
    """Aggregated dashboard data for the home screen."""

    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    recent_income: list[dict]
    recent_expenses: list[dict]
    expense_breakdown: list[dict]
    cards: list[DashboardCard]
