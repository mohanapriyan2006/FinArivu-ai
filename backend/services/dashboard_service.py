"""Dashboard summary service."""

import uuid

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.income import Income
from models.expense import Expense
from models.expense_category import ExpenseCategory
from utils.exceptions import DatabaseError


class DashboardService:
    """Service for dashboard summary data."""

    async def get_summary(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        """Get dashboard summary for a user."""
        try:
            # Total income
            income_result = await session.execute(
                select(func.coalesce(func.sum(Income.amount), 0)).where(
                    Income.user_id == user_id
                )
            )
            total_income = float(income_result.scalar_one())

            # Total expenses
            expense_result = await session.execute(
                select(func.coalesce(func.sum(Expense.amount), 0)).where(
                    Expense.user_id == user_id
                )
            )
            total_expenses = float(expense_result.scalar_one())

            # Recent income
            recent_income = await session.execute(
                select(Income)
                .where(Income.user_id == user_id)
                .order_by(Income.income_date.desc())
                .limit(5)
            )

            # Recent expenses
            recent_expenses = await session.execute(
                select(Expense)
                .where(Expense.user_id == user_id)
                .order_by(Expense.expense_date.desc())
                .limit(5)
            )

            # Expense breakdown by category
            category_result = await session.execute(
                select(
                    ExpenseCategory.name,
                    func.sum(Expense.amount).label("total"),
                )
                .join(Expense, Expense.category_id == ExpenseCategory.id)
                .where(Expense.user_id == user_id)
                .group_by(ExpenseCategory.name)
            )

            return {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net_cash_flow": total_income - total_expenses,
                "recent_income": [
                    {
                        "id": str(item.id),
                        "source": item.source,
                        "amount": float(item.amount),
                        "income_date": str(item.income_date),
                    }
                    for item in recent_income.scalars().all()
                ],
                "recent_expenses": [
                    {
                        "id": str(item.id),
                        "description": item.description,
                        "amount": float(item.amount),
                        "expense_date": str(item.expense_date),
                    }
                    for item in recent_expenses.scalars().all()
                ],
                "expense_breakdown": [
                    {"category": name, "amount": float(total)}
                    for name, total in category_result.all()
                ],
            }
        except Exception as exc:
            raise DatabaseError("Failed to fetch dashboard summary") from exc


dashboard_service = DashboardService()
