"""Simple financial calculators for agent use.

These are lightweight pure-Python math utilities that agents can call
without going through the full engine pipeline.
"""

from __future__ import annotations

from decimal import Decimal


def calculate_sip_future_value(
    monthly_amount: Decimal,
    annual_return_rate: Decimal,
    years: int,
) -> dict[str, float]:
    """Project future value of a Systematic Investment Plan.

    Uses the standard SIP formula:
        FV = P × [((1 + r)^n − 1) / r] × (1 + r)
    where P = monthly amount, r = monthly rate, n = total months.
    """
    if annual_return_rate <= 0 or years <= 0 or monthly_amount <= 0:
        return {
            "future_value": float(monthly_amount * years * 12),
            "total_invested": float(monthly_amount * years * 12),
            "estimated_returns": 0.0,
        }

    monthly_rate = annual_return_rate / Decimal("12")
    months = years * 12
    factor = (Decimal("1") + monthly_rate) ** months
    fv = monthly_amount * ((factor - 1) / monthly_rate) * (Decimal("1") + monthly_rate)
    total_invested = monthly_amount * months

    return {
        "future_value": round(float(fv), 2),
        "total_invested": round(float(total_invested), 2),
        "estimated_returns": round(float(fv - total_invested), 2),
    }


def calculate_emi(
    principal: Decimal,
    annual_interest_rate: Decimal,
    tenure_months: int,
) -> dict[str, float]:
    """Calculate Equated Monthly Instalment.

    Uses the standard EMI formula:
        EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
    """
    if annual_interest_rate <= 0 or tenure_months <= 0:
        return {
            "emi": round(float(principal / max(tenure_months, 1)), 2),
            "total_payable": round(float(principal), 2),
            "total_interest": 0.0,
        }

    monthly_rate = annual_interest_rate / Decimal("12")
    factor = (Decimal("1") + monthly_rate) ** tenure_months
    emi = principal * monthly_rate * factor / (factor - Decimal("1"))
    total_payable = emi * tenure_months
    total_interest = total_payable - principal

    return {
        "emi": round(float(emi), 2),
        "total_payable": round(float(total_payable), 2),
        "total_interest": round(float(total_interest), 2),
    }


def calculate_compound_interest(
    principal: Decimal,
    annual_rate: Decimal,
    years: int,
    *,
    compounding_frequency: int = 1,
) -> dict[str, float]:
    """Calculate compound interest.

    A = P × (1 + r/n)^(n×t)
    """
    if annual_rate <= 0 or years <= 0:
        return {
            "final_amount": round(float(principal), 2),
            "interest_earned": 0.0,
        }

    n = Decimal(compounding_frequency)
    rate_per_period = annual_rate / n
    periods = n * years
    amount = principal * (Decimal("1") + rate_per_period) ** periods
    interest = amount - principal

    return {
        "final_amount": round(float(amount), 2),
        "interest_earned": round(float(interest), 2),
    }
