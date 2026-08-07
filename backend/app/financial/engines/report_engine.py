from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.budget_engine import BudgetEngine
from app.financial.engines.cashflow_engine import CashFlowEngine
from app.financial.engines.goal_engine import GoalEngine
from app.financial.engines.health_engine import HealthEngine
from app.financial.engines.networth_engine import NetWorthEngine
from app.financial.engines.recommendation_engine import RecommendationEngine
from app.financial.engines.retirement_engine import RetirementEngine
from app.financial.engines.tax_engine import TaxEngine
from app.financial.schemas import Recommendation, ReportResult, ReportSection


class ReportEngine:
    """Deterministic financial report generator."""

    @staticmethod
    async def generate(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        period: str = "monthly",
    ) -> ReportResult:
        budget = await BudgetEngine.analyze(session, user_id)
        health = await HealthEngine.calculate(session, user_id)
        goal = await GoalEngine.analyze(session, user_id)
        networth = await NetWorthEngine.calculate(session, user_id)
        cashflow = await CashFlowEngine.analyze(session, user_id)
        tax = await TaxEngine.analyze(session, user_id)
        retirement = await RetirementEngine.project(session, user_id)

        engine_outputs: dict[str, Any] = {
            "BudgetAgent": budget.model_dump(),
            "HealthAgent": health.model_dump(),
            "GoalAgent": goal.model_dump(),
            "NetWorthAgent": networth.model_dump(),
            "CashFlowAgent": cashflow.model_dump(),
            "TaxAgent": tax.model_dump(),
            "RetirementAgent": retirement.model_dump(),
        }

        recs = RecommendationEngine.generate(engine_outputs)

        sections = [
            ReportSection(title="Budget Summary", type="budget_card", data=budget.model_dump()),
            ReportSection(title="Health Score", type="health_card", data=health.model_dump()),
            ReportSection(title="Goal Progress", type="goal_card", data=goal.model_dump()),
            ReportSection(title="Net Worth", type="networth_card", data=networth.model_dump()),
            ReportSection(title="Cash Flow", type="cashflow_card", data=cashflow.model_dump()),
            ReportSection(title="Tax Snapshot", type="tax_card", data=tax.model_dump()),
            ReportSection(title="Retirement Projection", type="retirement_card", data=retirement.model_dump()),
        ]

        achievements: list[str] = []
        if health.overall_score >= 70:
            achievements.append("Good overall financial health score")
        if budget.total_remaining > 0:
            achievements.append("Budget underspend this period")
        if cashflow.savings_rate >= 0.2:
            achievements.append("Healthy savings rate above 20%")

        improvement: list[str] = []
        if health.overall_score < 70:
            improvement.append("Improve financial health score")
        if budget.overspending_categories:
            improvement.append("Reduce overspending categories")
        if cashflow.savings_rate < 0.2:
            improvement.append("Increase savings rate")

        return ReportResult(
            period=period,
            generated_at=datetime.now().isoformat(),
            summary=f"Financial report for user generated at {datetime.now().strftime('%Y-%m-%d')}.",
            health_score=health.overall_score,
            budget_summary=budget.model_dump(),
            goal_progress=goal.model_dump(),
            net_worth=networth.model_dump(),
            cash_flow=cashflow.model_dump(),
            recommendations=[Recommendation(**r.model_dump()) for r in recs.recommendations],
            achievements=achievements,
            improvement_areas=improvement,
            sections=sections,
        )
