from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import InsufficientDataError
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
    """Deterministic financial report generator.

    Composes the deterministic engines; sections whose inputs are missing are
    omitted rather than filled with invented values.
    """

    @staticmethod
    async def generate(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        period: str = "monthly",
    ) -> ReportResult:
        async def _safe(call, *args):
            try:
                return await call(session, user_id, *args)
            except InsufficientDataError:
                return None

        budget = await _safe(BudgetEngine.analyze)
        health = await _safe(HealthEngine.calculate)
        goal = await _safe(GoalEngine.analyze)
        networth = await _safe(NetWorthEngine.calculate)
        cashflow = await _safe(CashFlowEngine.analyze)
        tax = await _safe(TaxEngine.analyze)
        retirement = await _safe(RetirementEngine.project)

        engine_outputs: dict[str, Any] = {
            name: result.model_dump()
            for name, result in {
                "BudgetAgent": budget,
                "HealthAgent": health,
                "GoalAgent": goal,
                "NetWorthAgent": networth,
                "CashFlowAgent": cashflow,
                "TaxAgent": tax,
                "RetirementAgent": retirement,
            }.items()
            if result is not None
        }

        recs = RecommendationEngine.generate(engine_outputs)

        sections = [
            ReportSection(title=title, type=atype, data=result.model_dump())
            for title, atype, result in [
                ("Budget Summary", "budget_card", budget),
                ("Health Score", "health_card", health),
                ("Goal Progress", "goal_card", goal),
                ("Net Worth", "networth_card", networth),
                ("Cash Flow", "cashflow_card", cashflow),
                ("Tax Snapshot", "tax_card", tax),
                ("Retirement Projection", "retirement_card", retirement),
            ]
            if result is not None
        ]

        achievements: list[str] = []
        if health and health.overall_score >= 70:
            achievements.append("Good overall financial health score")
        if budget and budget.remaining_budget > 0:
            achievements.append("Budget underspend this period")
        if cashflow and cashflow.savings_rate >= 0.2:
            achievements.append("Healthy savings rate above 20%")

        improvement: list[str] = []
        if health and health.overall_score < 70:
            improvement.append("Improve financial health score")
        if budget and budget.overspending_categories:
            improvement.append("Reduce overspending categories")
        if cashflow and cashflow.savings_rate < 0.2:
            improvement.append("Increase savings rate")

        return ReportResult(
            period=period,
            generated_at=datetime.now().isoformat(),
            summary=f"Financial report for user generated at {datetime.now().strftime('%Y-%m-%d')}.",
            health_score=float(health.overall_score) if health else 0,
            budget_summary=budget.model_dump() if budget else {},
            goal_progress=goal.model_dump() if goal else {},
            net_worth=networth.model_dump() if networth else {},
            cash_flow=cashflow.model_dump() if cashflow else {},
            recommendations=[Recommendation(**r.model_dump()) for r in recs.recommendations],
            achievements=achievements,
            improvement_areas=improvement,
            sections=sections,
        )
