from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class CategoryUsage:
    """Budget usage for a single category."""

    category_id: str
    category_name: str
    budget: Decimal
    spent: Decimal
    usage: Decimal
    overspend: Decimal
    status: str


@dataclass
class BudgetAnalysis:
    """Result of budget analysis."""

    total_budget: Decimal
    total_spent: Decimal
    overall_utilization: Decimal
    remaining_budget: Decimal
    categories: list[CategoryUsage]
    overspending_categories: list[CategoryUsage]
    savings_opportunity: Decimal
    recommendations: list[str]


def _safe_div(numerator: Decimal, denominator: Decimal) -> Decimal:
    if denominator <= 0:
        return Decimal("0")
    return numerator / denominator


def analyze_budget(
    monthly_income: Decimal,
    total_spent: Decimal,
    category_spending: dict[str, Decimal],
    budgets: dict[str, tuple[str, Decimal]],
) -> BudgetAnalysis:
    """Analyze budget utilization and generate educational recommendations."""
    total_budget = sum((b for _, b in budgets.values()), Decimal("0"))
    remaining = total_budget - total_spent
    utilization = _safe_div(total_spent, total_budget)

    categories: list[CategoryUsage] = []
    overspending: list[CategoryUsage] = []

    all_category_ids = set(category_spending.keys()) | set(budgets.keys())
    for cid in all_category_ids:
        name, budget = budgets.get(cid, (cid, Decimal("0")))
        spent = category_spending.get(cid, Decimal("0"))
        usage = _safe_div(spent, budget)

        if budget == 0:
            status = "no_budget"
        elif usage < Decimal("0.90"):
            status = "under_budget"
        elif usage <= Decimal("1.00"):
            status = "on_budget"
        elif usage <= Decimal("1.10"):
            status = "slightly_over"
        else:
            status = "over_budget"

        overspend = spent - budget if spent > budget else Decimal("0")
        usage_obj = CategoryUsage(
            category_id=cid,
            category_name=name,
            budget=budget,
            spent=spent,
            usage=usage,
            overspend=overspend,
            status=status,
        )
        categories.append(usage_obj)
        if overspend > 0:
            overspending.append(usage_obj)

    savings_opportunity = monthly_income - total_spent
    if savings_opportunity < 0:
        savings_opportunity = Decimal("0")

    recommendations: list[str] = []
    if utilization > Decimal("1.00"):
        recommendations.append(
            "Your total spending exceeds your planned budget. Review recurring expenses and non-essential categories."
        )
    elif utilization < Decimal("0.90"):
        recommendations.append(
            "You are spending within your overall budget. Consider directing the surplus into savings or goals."
        )

    for cat in sorted(overspending, key=lambda x: x.overspend, reverse=True)[:3]:
        recommendations.append(
            f"{cat.category_name} exceeded its budget by ₹{cat.overspend:,.2f}. Consider reviewing expenses in this category."
        )

    if savings_opportunity > 0:
        recommendations.append(
            f"You have a potential savings opportunity of ₹{savings_opportunity:,.2f} this month."
        )

    return BudgetAnalysis(
        total_budget=total_budget,
        total_spent=total_spent,
        overall_utilization=utilization,
        remaining_budget=remaining,
        categories=categories,
        overspending_categories=overspending,
        savings_opportunity=savings_opportunity,
        recommendations=recommendations,
    )
