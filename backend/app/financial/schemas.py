from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class MoneyValue(BaseModel):
    value: float
    currency: str = "INR"
    formatted: str = ""


class BudgetAnalysis(BaseModel):
    total_budget: float = 0
    total_spent: float = 0
    total_remaining: float = 0
    utilisation_percentage: float = 0
    overspending_percentage: float = 0
    average_monthly_spending: float = 0
    top_expense_categories: list[dict[str, Any]] = Field(default_factory=list)
    category_breakdown: list[dict[str, Any]] = Field(default_factory=list)
    overspending_categories: list[dict[str, Any]] = Field(default_factory=list)
    savings_opportunities: list[str] = Field(default_factory=list)
    recurring_expenses: list[dict[str, Any]] = Field(default_factory=list)
    month_over_month: list[dict[str, Any]] = Field(default_factory=list)


class SubScore(BaseModel):
    name: str
    score: float
    weight: float


class FinancialHealthResult(BaseModel):
    overall_score: float = 0
    grade: str = "N/A"
    status: str = "Unknown"
    savings_score: float = 0
    emergency_fund_score: float = 0
    debt_score: float = 0
    goal_score: float = 0
    budget_score: float = 0
    sub_scores: list[SubScore] = Field(default_factory=list)
    improvement_areas: list[str] = Field(default_factory=list)
    trend: list[dict[str, Any]] = Field(default_factory=list)


class GoalAnalysis(BaseModel):
    goals: list[dict[str, Any]] = Field(default_factory=list)
    overall_progress: float = 0
    projected_completion: datetime | None = None
    monthly_savings_required: float = 0
    risk_goals: list[str] = Field(default_factory=list)


class RetirementAnalysis(BaseModel):
    current_age: int = 0
    retirement_age: int = 60
    years_remaining: int = 0
    future_monthly_expense: float = 0
    required_corpus: float = 0
    current_gap: float = 0
    monthly_investment_required: float = 0
    inflation_rate: float = 0.06
    safe_withdrawal_rate: float = 0.04
    readiness_score: float = 0


class TaxSlab(BaseModel):
    limit: float
    rate: float


class TaxAnalysis(BaseModel):
    regime: str
    gross_income: float = 0
    deductions: float = 0
    taxable_income: float = 0
    tax_amount: float = 0
    effective_tax_rate: float = 0
    savings_vs_other_regime: float = 0
    recommended_regime: str = ""
    slabs: list[TaxSlab] = Field(default_factory=list)


class NetWorthAnalysis(BaseModel):
    total_assets: float = 0
    total_liabilities: float = 0
    net_worth: float = 0
    asset_breakdown: dict[str, float] = Field(default_factory=dict)
    liability_breakdown: dict[str, float] = Field(default_factory=dict)
    monthly_growth: float = 0
    annual_growth: float = 0
    debt_ratio: float = 0
    asset_allocation: dict[str, float] = Field(default_factory=dict)


class CashFlowAnalysis(BaseModel):
    total_income: float = 0
    total_expenses: float = 0
    savings: float = 0
    savings_rate: float = 0
    burn_rate: float = 0
    runway_months: float = 0
    monthly_trend: list[dict[str, Any]] = Field(default_factory=list)


class ScenarioInput(BaseModel):
    variable: str
    delta: float
    unit: str = "amount"


class ScenarioResult(BaseModel):
    current: dict[str, Any] = Field(default_factory=dict)
    optimized: dict[str, Any] = Field(default_factory=dict)
    difference: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)


class Recommendation(BaseModel):
    title: str
    description: str
    category: str
    priority: str = "medium"


class RecommendationResult(BaseModel):
    recommendations: list[Recommendation] = Field(default_factory=list)
    priority_summary: dict[str, int] = Field(default_factory=dict)


class ReportSection(BaseModel):
    title: str
    type: str
    data: dict[str, Any] = Field(default_factory=dict)


class ReportResult(BaseModel):
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


class SimulationResult(BaseModel):
    scenario: ScenarioInput
    current: dict[str, Any] = Field(default_factory=dict)
    optimized: dict[str, Any] = Field(default_factory=dict)
    difference: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)
