from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class RetirementProjection:
    """Retirement planning projection result."""

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


def project_retirement(
    current_age: int,
    retirement_age: int,
    monthly_expenses: Decimal,
    inflation_rate: Decimal = Decimal("0.06"),
    safe_withdrawal_rate: Decimal = Decimal("0.04"),
) -> RetirementProjection:
    """Project retirement expenses and required corpus."""
    if retirement_age <= current_age:
        years = 0
    else:
        years = retirement_age - current_age

    # Future value of monthly expenses adjusted for inflation.
    future_monthly = monthly_expenses * ((Decimal("1") + inflation_rate) ** years)
    future_annual = future_monthly * Decimal("12")

    # Corpus required based on the 4% rule or provided safe withdrawal rate.
    if safe_withdrawal_rate <= 0:
        safe_withdrawal_rate = Decimal("0.04")
    corpus = future_annual / safe_withdrawal_rate

    notes = [
        "Future expenses are adjusted for inflation only; investment returns are not modeled here.",
        f"A retirement corpus of ₹{corpus:,.2f} can support an annual withdrawal of {safe_withdrawal_rate:.2%}.",
        "Increase retirement savings if this corpus appears unaffordable today.",
    ]

    return RetirementProjection(
        current_age=current_age,
        retirement_age=retirement_age,
        years_to_retirement=years,
        current_monthly_expenses=monthly_expenses,
        inflation_rate=inflation_rate,
        future_monthly_expenses=future_monthly,
        future_annual_expenses=future_annual,
        retirement_corpus=corpus,
        safe_withdrawal_rate=safe_withdrawal_rate,
        notes=notes,
    )
