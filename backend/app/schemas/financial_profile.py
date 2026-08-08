from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema


class AboutYouUpdate(BaseSchema):
    """About-you section payload."""

    age: int | None = Field(default=None, ge=0, le=120)
    employment_type: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=255)
    dependents: int | None = Field(default=None, ge=0)
    children_count: int | None = Field(default=None, ge=0)


class IncomeProfileUpdate(BaseSchema):
    """Primary income section payload."""

    amount: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    source: str = Field(default="Salary", min_length=1, max_length=255)
    frequency: str = Field(default="monthly", max_length=50)
    is_recurring: bool = True
    is_primary: bool = True
    income_date: date = Field(default_factory=date.today)


class ExpenseEstimateItem(BaseSchema):
    """Estimated expense for a single category."""

    category_id: UUID | None = None
    amount: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)


class ExpenseProfileUpdate(BaseSchema):
    """Estimated monthly expenses section payload."""

    total_amount: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    source: str = Field(default="manual_estimate", max_length=50)
    breakdown: list[ExpenseEstimateItem] = Field(default_factory=list)
    estimate_month: date = Field(default_factory=date.today)


class SavingsUpdate(BaseSchema):
    """Savings section payload."""

    emergency_fund: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    general_savings: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    goal_savings: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)


class InvestmentItem(BaseSchema):
    """Single investment record."""

    asset_type: str = Field(..., max_length=100)
    name: str = Field(default="Investment", min_length=1, max_length=255)
    value: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    description: str | None = Field(default=None, max_length=1000)


class InvestmentUpdate(BaseSchema):
    """Investments section payload (replaces all non-cash investments)."""

    items: list[InvestmentItem] = Field(default_factory=list)


class FixedDepositItem(BaseSchema):
    """Single fixed deposit record."""

    name: str = Field(default="Fixed Deposit", min_length=1, max_length=255)
    value: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    interest_rate: Decimal | None = Field(default=None, decimal_places=2, max_digits=5, ge=0)
    maturity_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)


class FixedDepositUpdate(BaseSchema):
    """Fixed deposits section payload (replaces all FDs)."""

    items: list[FixedDepositItem] = Field(default_factory=list)


class LoanItem(BaseSchema):
    """Single loan record."""

    liability_type: str = Field(..., max_length=100)
    name: str = Field(default="Loan", min_length=1, max_length=255)
    outstanding_amount: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    monthly_emi: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    interest_rate: Decimal | None = Field(default=None, decimal_places=2, max_digits=5, ge=0)
    remaining_months: int | None = Field(default=None, ge=0)
    start_date: date | None = None


class LoanUpdate(BaseSchema):
    """Loans section payload (replaces all non-credit-card liabilities)."""

    items: list[LoanItem] = Field(default_factory=list)


class CreditCardUpdate(BaseSchema):
    """Credit card section payload."""

    current_outstanding: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    typical_monthly_payment: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    credit_limit: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    monthly_spend: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)


class GoalItem(BaseSchema):
    """Single goal record for onboarding."""

    goal_name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., decimal_places=2, max_digits=15, gt=0)
    current_amount: Decimal = Field(default=Decimal("0"), decimal_places=2, max_digits=15, ge=0)
    target_date: date | None = None
    priority: str = Field(default="Medium", max_length=50)


class GoalUpdate(BaseSchema):
    """Goals section payload (replaces all goals)."""

    items: list[GoalItem] = Field(default_factory=list)


class InsuranceItem(BaseSchema):
    """Single insurance policy record."""

    insurance_type: str = Field(..., max_length=50)
    coverage_amount: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    annual_premium: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)


class InsuranceUpdate(BaseSchema):
    """Insurance section payload (replaces all insurance records)."""

    items: list[InsuranceItem] = Field(default_factory=list)


class TaxProfileUpdate(BaseSchema):
    """Tax profile section payload."""

    annual_income: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    tax_regime: str | None = Field(default=None, max_length=10)
    deduction_80c: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    deduction_80d: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    home_loan_interest: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    nps_deduction: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)
    other_deductions: Decimal | None = Field(default=None, decimal_places=2, max_digits=15, ge=0)


class SectionStatus(BaseSchema):
    """Per-section completion status."""

    section: str
    complete: bool
    weight: int


class ProfileCompletionResponse(BaseSchema):
    """Backend-calculated profile completion."""

    completion_percentage: int
    core_ready: bool
    missing_sections: list[str]
    last_incomplete_section: str | None
    section_status: list[SectionStatus]


class FinancialProfileSectionResponse(BaseSchema):
    """One domain in the full profile summary."""

    profile: dict | None = None
    income: dict | None = None
    expenses: dict | None = None
    savings: dict | None = None
    investments: list[dict] | None = None
    fixed_deposits: list[dict] | None = None
    loans: list[dict] | None = None
    credit_cards: list[dict] | None = None
    goals: list[dict] | None = None
    insurance: list[dict] | None = None
    tax_profile: dict | None = None
    completion: ProfileCompletionResponse | None = None
