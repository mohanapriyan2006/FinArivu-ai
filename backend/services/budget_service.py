"""Budget service layer."""

import uuid
from datetime import date

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from engines.budget_engine import BudgetEngine, BudgetItemInput
from models.budget import Budget
from models.expense import Expense
from repositories.budget_repository import budget_repository
from schemas.budget import BudgetCreate, BudgetUpdate
from utils.exceptions import ResourceNotFoundError, DatabaseError, ValidationError


class BudgetService:
    """Service for budget operations."""

    async def get_user_budgets(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Budget]:
        """Get all budget records for a user."""
        return await budget_repository.get_by_user_id(session, user_id, skip, limit)

    async def create_budget(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: BudgetCreate,
    ) -> Budget:
        """Create a new budget record."""
        try:
            existing = await budget_repository.get_by_user_and_category(
                session, user_id, data.category_id
            )
            if existing:
                raise ValidationError(
                    "Budget already exists for this category. Use update instead."
                )

            item = await budget_repository.create(
                session,
                {
                    "user_id": user_id,
                    "category_id": data.category_id,
                    "monthly_limit": data.monthly_limit,
                },
            )
            await session.commit()
            logger.info(
                "Budget created",
                extra={"user_id": str(user_id), "category_id": str(data.category_id)},
            )
            return item
        except ValidationError:
            raise
        except Exception as exc:
            logger.error("Failed to create budget", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to create budget") from exc

    async def update_budget(
        self,
        session: AsyncSession,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
        data: BudgetUpdate,
    ) -> Budget:
        """Update an existing budget record."""
        try:
            item = await budget_repository.get_by_id_with_owner(session, budget_id, user_id)
            if item is None:
                raise ResourceNotFoundError("Budget not found")

            update_data = data.model_dump(exclude_unset=True)

            # If changing category, ensure no duplicate
            new_category_id = update_data.get("category_id")
            if new_category_id and new_category_id != item.category_id:
                existing = await budget_repository.get_by_user_and_category(
                    session, user_id, new_category_id
                )
                if existing:
                    raise ValidationError(
                        "Budget already exists for the target category."
                    )

            item = await budget_repository.update(session, item, update_data)
            await session.commit()
            logger.info(
                "Budget updated",
                extra={"budget_id": str(budget_id), "user_id": str(user_id)},
            )
            return item
        except (ResourceNotFoundError, ValidationError):
            raise
        except Exception as exc:
            logger.error(
                "Failed to update budget",
                extra={"budget_id": str(budget_id), "user_id": str(user_id)},
            )
            raise DatabaseError("Failed to update budget") from exc

    async def delete_budget(
        self,
        session: AsyncSession,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Delete a budget record."""
        try:
            item = await budget_repository.get_by_id_with_owner(session, budget_id, user_id)
            if item is None:
                raise ResourceNotFoundError("Budget not found")

            await budget_repository.delete(session, item)
            await session.commit()
            logger.info(
                "Budget deleted",
                extra={"budget_id": str(budget_id), "user_id": str(user_id)},
            )
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error(
                "Failed to delete budget",
                extra={"budget_id": str(budget_id), "user_id": str(user_id)},
            )
            raise DatabaseError("Failed to delete budget") from exc

    async def get_budget_analysis(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        """Get budget analysis with spending vs limits.

        Args:
            session: Async database session.
            user_id: UUID of the user.

        Returns:
            Dict with category analysis and summary.
        """
        try:
            # Get all budgets for user
            budgets = await budget_repository.get_by_user_id(session, user_id)

            if not budgets:
                return {
                    "categories": [],
                    "summary": {
                        "total_budget": 0,
                        "total_spent": 0,
                        "total_remaining": 0,
                        "overall_usage": 0.0,
                    },
                }

            # Get current month expenses grouped by category
            today = date.today()
            month = today.month
            year = today.year

            result = await session.execute(
                select(
                    Expense.category_id,
                    func.sum(Expense.amount).label("total_spent"),
                )
                .where(
                    Expense.user_id == user_id,
                    extract("month", Expense.expense_date) == month,
                    extract("year", Expense.expense_date) == year,
                )
                .group_by(Expense.category_id)
            )
            spending_map = {row[0]: row[1] for row in result.all()}

            # Build engine inputs
            items: list[BudgetItemInput] = []
            for budget in budgets:
                spent = spending_map.get(budget.category_id, 0)
                items.append(
                    BudgetItemInput(
                        category_id=budget.category_id,
                        category_name=budget.category.name,
                        monthly_limit=budget.monthly_limit,
                        spent=spent,
                    )
                )

            # Run analysis
            analysis_results = BudgetEngine.analyze(items)
            summary = BudgetEngine.summarize(analysis_results)

            # Convert results to dicts for response
            categories = [
                {
                    "category": r.category,
                    "budget": r.budget,
                    "spent": r.spent,
                    "remaining": r.remaining,
                    "usage": r.usage,
                    "status": r.status,
                    "recommendation": r.recommendation,
                }
                for r in analysis_results
            ]

            return {
                "categories": categories,
                "summary": summary,
            }
        except Exception as exc:
            logger.error("Failed to get budget analysis", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to get budget analysis") from exc


budget_service = BudgetService()
