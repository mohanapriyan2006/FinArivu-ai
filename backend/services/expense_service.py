"""Expense service layer."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from models.expense import Expense
from repositories.expense_repository import expense_repository
from schemas.expense import ExpenseCreate, ExpenseUpdate
from utils.exceptions import ResourceNotFoundError, DatabaseError


class ExpenseService:
    """Service for expense operations."""

    async def get_user_expenses(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Expense]:
        """Get all expense records for a user."""
        return await expense_repository.get_by_user_id(session, user_id, skip, limit)

    async def create_expense(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: ExpenseCreate,
    ) -> Expense:
        """Create a new expense record."""
        try:
            item = await expense_repository.create(
                session,
                {
                    "user_id": user_id,
                    "category_id": data.category_id,
                    "amount": data.amount,
                    "description": data.description,
                    "expense_date": data.expense_date,
                },
            )
            await session.commit()
            return item
        except Exception as exc:
            logger.error("Failed to create expense", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to create expense") from exc

    async def update_expense(
        self,
        session: AsyncSession,
        expense_id: uuid.UUID,
        user_id: uuid.UUID,
        data: ExpenseUpdate,
    ) -> Expense:
        """Update an existing expense record."""
        try:
            item = await expense_repository.get_by_id(session, expense_id)
            if item is None or item.user_id != user_id:
                raise ResourceNotFoundError("Expense not found")

            update_data = data.model_dump(exclude_unset=True)
            item = await expense_repository.update(session, item, update_data)
            await session.commit()
            return item
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error("Failed to update expense", extra={"expense_id": str(expense_id)})
            raise DatabaseError("Failed to update expense") from exc

    async def delete_expense(
        self,
        session: AsyncSession,
        expense_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Delete an expense record."""
        try:
            item = await expense_repository.get_by_id(session, expense_id)
            if item is None or item.user_id != user_id:
                raise ResourceNotFoundError("Expense not found")

            await expense_repository.delete(session, item)
            await session.commit()
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error("Failed to delete expense", extra={"expense_id": str(expense_id)})
            raise DatabaseError("Failed to delete expense") from exc


expense_service = ExpenseService()
