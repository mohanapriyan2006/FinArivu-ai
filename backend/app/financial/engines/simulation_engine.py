from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.financial.schemas import ScenarioInput, SimulationResult


class SimulationEngine:
    """Deterministic what-if scenario engine."""

    @staticmethod
    def run(scenario: ScenarioInput, context: dict[str, Any]) -> SimulationResult:
        current = {
            "monthly_income": float(context.get("monthly_income", 0)),
            "monthly_expenses": float(context.get("monthly_expenses", 0)),
            "monthly_savings": float(context.get("monthly_savings", 0)),
            "savings_rate": float(context.get("savings_rate", 0)),
            "retirement_corpus": float(context.get("retirement_corpus", 0)),
        }

        variable = scenario.variable
        delta = scenario.delta
        unit = scenario.unit

        if variable == "monthly_savings" and unit == "amount":
            new_savings = current["monthly_savings"] + delta
        elif variable == "monthly_income" and unit == "percent":
            new_savings = current["monthly_savings"] + (current["monthly_income"] * (delta / 100))
        elif variable == "expenses" and unit == "percent":
            new_savings = current["monthly_savings"] - (current["monthly_expenses"] * (delta / 100))
        elif variable == "retirement_age" and unit == "years":
            new_savings = current["monthly_savings"]
        elif variable == "loan_closure" and unit == "amount":
            new_savings = current["monthly_savings"] + delta
        else:
            new_savings = current["monthly_savings"] + delta

        optimized = {**current, "monthly_savings": new_savings}
        if current["monthly_income"] > 0:
            optimized["savings_rate"] = new_savings / current["monthly_income"]

        years = 10
        annual_rate = 0.08
        corpus_delta = sum(
            new_savings * ((1 + annual_rate / 12) ** (i + 1))
            for i in range(years * 12)
        )
        optimized["retirement_corpus"] = current["retirement_corpus"] + float(Decimal(str(corpus_delta)))

        difference = {
            "monthly_savings_change": new_savings - current["monthly_savings"],
            "savings_rate_change": optimized["savings_rate"] - current["savings_rate"],
            "retirement_corpus_change": optimized["retirement_corpus"] - current["retirement_corpus"],
        }

        recommendations = [
            f"Changing {scenario.variable} by {delta} {scenario.unit} increases monthly savings by ₹{difference['monthly_savings_change']:.0f}.",
            f"Projected retirement corpus improvement: ₹{difference['retirement_corpus_change']:.0f} over {years} years.",
        ]

        return SimulationResult(
            scenario=scenario,
            current=current,
            optimized=optimized,
            difference=difference,
            recommendations=recommendations,
        )
