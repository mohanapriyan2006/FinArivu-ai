"""Financial Health Score service layer."""

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from engines.budget_engine import BudgetEngine
from engines.financial_health_engine import FinancialHealthEngine, FinancialHealthInput
from models.financial_health_score import FinancialHealthScore
from repositories.budget_repository import budget_repository
from repositories.financial_health_repository import financial_health_repository
from utils.exceptions import DatabaseError


class FinancialHealthService:
    """Service for financial health score operations."""

    async def get_current_score(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        """Get or calculate the current financial health score.

        Fetches latest data from all modules and runs through the engine.
        """
        try:
            # Get budgets for budget discipline
            budgets = await budget_repository.get_by_user_id(session, user_id)
            from engines.budget_engine import BudgetItemInput
            budget_items = []
            for budget in budgets:
                budget_items.append(
                    BudgetItemInput(
                        category_id=budget.category_id,
                        category_name=budget.category.name,
                        monthly_limit=budget.monthly_limit,
                        spent=Decimal("0"),
                    )
                )
            budget_results = BudgetEngine.analyze(budget_items)
            budget_summary = BudgetEngine.summarize(budget_results)
            budget_usage = budget_summary.get("overall_usage", 0.0)

            # Get latest stored score or compute new one
            latest = await financial_health_repository.get_latest_by_user(session, user_id)
            if latest:
                return {
                    "score": latest.score,
                    "grade": latest.grade,
                    "savings_score": latest.savings_score,
                    "emergency_score": latest.emergency_score,
                    "debt_score": latest.debt_score,
                    "goal_score": latest.goal_score,
                    "budget_score": latest.budget_score,
                    "insights": latest.insights,
                }

            # If no stored score, compute with default/empty data
            # (In a real app, this would fetch income, expenses, assets, liabilities)
            data = FinancialHealthInput(
                monthly_income=Decimal("0"),
                monthly_expenses=Decimal("0"),
                emergency_assets=Decimal("0"),
                total_debt=Decimal("0"),
                annual_income=Decimal("0"),
                goals=[],
                budget_overall_usage=budget_usage,
            )
            result = FinancialHealthEngine.calculate(data)

            return {
                "score": result.score,
                "grade": result.grade,
                "savings_score": result.savings_score,
                "emergency_score": result.emergency_score,
                "debt_score": result.debt_score,
                "goal_score": result.goal_score,
                "budget_score": result.budget_score,
                "insights": result.insights,
            }
        except Exception as exc:
            logger.error("Failed to get current score", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to get financial health score") from exc

    async def get_score_history(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[FinancialHealthScore]:
        """Get historical financial health scores."""
        return await financial_health_repository.get_by_user_id(
            session, user_id, skip, limit
        )

    async def recalculate_and_save(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: FinancialHealthInput,
    ) -> FinancialHealthScore:
        """Recalculate score from fresh data and save to history."""
        try:
            result = FinancialHealthEngine.calculate(data)

            score_record = await financial_health_repository.create(
                session,
                {
                    "user_id": user_id,
                    "score": result.score,
                    "grade": result.grade,
                    "savings_score": result.savings_score,
                    "emergency_score": result.emergency_score,
                    "debt_score": result.debt_score,
                    "goal_score": result.goal_score,
                    "budget_score": result.budget_score,
                    "component_scores": {
                        "savings": result.savings_score,
                        "emergency": result.emergency_score,
                        "debt": result.debt_score,
                        "goal": result.goal_score,
                        "budget": result.budget_score,
                    },
                    "insights": result.insights,
                },
            )
            await session.commit()
            logger.info(
                "Financial health score recalculated",
                extra={"user_id": str(user_id), "score": result.score},
            )
            return score_record
        except Exception as exc:
            logger.error("Failed to recalculate score", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to recalculate financial health score") from exc


financial_health_service = FinancialHealthService()
