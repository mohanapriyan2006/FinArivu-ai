from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class HealthScoreResult:
    """Result of the financial health score calculation."""

    overall_score: Decimal
    savings_score: Decimal
    emergency_score: Decimal
    debt_score: Decimal
    goal_score: Decimal
    budget_score: Decimal
    breakdown: dict[str, Any]
    recommendations: list[str]


def _savings_rate_score(savings_rate: Decimal) -> tuple[Decimal, str]:
    if savings_rate >= Decimal("0.30"):
        return Decimal("30"), "Great savings rate. Keep it up."
    if savings_rate >= Decimal("0.20"):
        return Decimal("25"), "Good savings rate. Aim for 30%+."
    if savings_rate >= Decimal("0.10"):
        return Decimal("15"), "Your savings rate is moderate; try to increase it."
    return Decimal("5"), "Your savings rate is low. Track expenses and build a budget."


def _emergency_fund_score(months: Decimal) -> tuple[Decimal, str]:
    if months >= Decimal("6"):
        return Decimal("20"), "You have a strong emergency fund."
    if months >= Decimal("3"):
        return Decimal("15"), "Your emergency fund covers a few months; target 6 months."
    if months >= Decimal("1"):
        return Decimal("10"), "Emergency fund is low; prioritize building it."
    return Decimal("5"), "You need an emergency fund urgently."


def _debt_ratio_score(ratio: Decimal) -> tuple[Decimal, str]:
    if ratio < Decimal("0.20"):
        return Decimal("20"), "Your debt level is healthy."
    if ratio < Decimal("0.50"):
        return Decimal("15"), "Debt is moderate; monitor it."
    if ratio <= Decimal("1.00"):
        return Decimal("10"), "Debt is high; focus on repayment."
    return Decimal("5"), "Debt exceeds annual income; create a repayment plan."


def _goal_progress_score(progress: Decimal) -> tuple[Decimal, str]:
    if progress >= Decimal("0.75"):
        return Decimal("15"), "You are close to achieving your goals."
    if progress >= Decimal("0.50"):
        return Decimal("10"), "You are halfway to your goals."
    if progress >= Decimal("0.25"):
        return Decimal("5"), "Goals are in early stages; stay consistent."
    return Decimal("2"), "Goal progress is low; set small milestones."


def _budget_discipline_score(utilization: Decimal) -> tuple[Decimal, str]:
    if utilization < Decimal("0.90"):
        return Decimal("15"), "You are spending within your budget."
    if utilization <= Decimal("1.00"):
        return Decimal("10"), "Budget usage is on target."
    if utilization <= Decimal("1.10"):
        return Decimal("5"), "You are slightly over budget."
    return Decimal("2"), "You are significantly over budget. Review expenses."


def calculate_health_score(
    monthly_income: Decimal,
    monthly_expenses: Decimal,
    emergency_assets: Decimal,
    total_debt: Decimal,
    annual_income: Decimal,
    average_goal_progress: Decimal,
    average_budget_utilization: Decimal,
) -> HealthScoreResult:
    """Calculate the financial health score and component breakdown."""
    if monthly_income <= 0:
        monthly_income = Decimal("1")
    if annual_income <= 0:
        annual_income = Decimal("1")

    savings = monthly_income - monthly_expenses
    savings_rate = savings / monthly_income

    if monthly_expenses <= 0:
        emergency_months = emergency_assets
    else:
        emergency_months = emergency_assets / monthly_expenses

    debt_ratio = total_debt / annual_income

    savings_score, savings_recommendation = _savings_rate_score(savings_rate)
    emergency_score, emergency_recommendation = _emergency_fund_score(emergency_months)
    debt_score, debt_recommendation = _debt_ratio_score(debt_ratio)
    goal_score, goal_recommendation = _goal_progress_score(average_goal_progress)
    budget_score, budget_recommendation = _budget_discipline_score(average_budget_utilization)

    overall = (
        savings_score + emergency_score + debt_score + goal_score + budget_score
    )

    breakdown = {
        "monthly_income": str(monthly_income),
        "monthly_expenses": str(monthly_expenses),
        "savings_rate": f"{savings_rate:.2%}",
        "emergency_months": float(emergency_months),
        "debt_ratio": f"{debt_ratio:.2%}",
        "goal_progress": f"{average_goal_progress:.2%}",
        "budget_utilization": f"{average_budget_utilization:.2%}",
    }

    recommendations = [
        savings_recommendation,
        emergency_recommendation,
        debt_recommendation,
        goal_recommendation,
        budget_recommendation,
    ]

    return HealthScoreResult(
        overall_score=overall,
        savings_score=savings_score,
        emergency_score=emergency_score,
        debt_score=debt_score,
        goal_score=goal_score,
        budget_score=budget_score,
        breakdown=breakdown,
        recommendations=recommendations,
    )


class FinancialHealthEngine:
    """FastAPI-facing wrapper around the health score calculation."""

    def calculate(self, profile: dict[str, Any]) -> dict[str, Any]:
        """Compute a health score snapshot from an aggregated profile."""
        result = calculate_health_score(
            monthly_income=Decimal(str(profile.get("monthly_income", 1))),
            monthly_expenses=Decimal(str(profile.get("monthly_expenses", 0))),
            emergency_assets=Decimal(str(profile.get("emergency_assets", 0))),
            total_debt=Decimal(str(profile.get("total_debt", 0))),
            annual_income=Decimal(str(profile.get("annual_income", 1))),
            average_goal_progress=Decimal(str(profile.get("average_goal_progress", 0))),
            average_budget_utilization=Decimal(str(profile.get("average_budget_utilization", 0))),
        )
        return {
            "overall_score": float(result.overall_score),
            "savings_score": float(result.savings_score),
            "emergency_score": float(result.emergency_score),
            "debt_score": float(result.debt_score),
            "goal_score": float(result.goal_score),
            "budget_score": float(result.budget_score),
            "breakdown": result.breakdown,
            "recommendations": result.recommendations,
        }
