from __future__ import annotations

import uuid
from datetime import date
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.expenses import Expense
from app.repositories.expenses import ExpenseRepository
from app.schemas.expenses import ExpenseCreate, ExpenseUpdate
from app.services.base import BaseService


class ExpenseService(BaseService[Expense]):
    """Service for managing expense records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ExpenseRepository(session))
        self._repo: ExpenseRepository

    async def create_for_user(
        self,
        user_id: uuid.UUID,
        data: ExpenseCreate,
    ) -> Expense:
        """Create an expense record for the authenticated user."""
        payload = data.model_dump(exclude_unset=True)
        payload["user_id"] = user_id
        expense = Expense(**payload)
        return await self._repo.create(expense)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        start_date: date | None = None,
        end_date: date | None = None,
        category_id: uuid.UUID | None = None,
        payment_method: str | None = None,
        is_recurring: bool | None = None,
    ) -> list[Expense]:
        """List expenses for a user."""
        return list(
            await self._repo.list_for_user(
                user_id,
                skip,
                limit,
                start_date,
                end_date,
                category_id,
                payment_method,
                is_recurring,
            )
        )

    async def update_for_user(
        self,
        user_id: uuid.UUID,
        expense_id: uuid.UUID,
        data: ExpenseUpdate,
    ) -> Expense:
        """Update an expense if owned by the user."""
        expense = await self._repo.get_by_id(expense_id)
        if expense is None or expense.user_id != user_id:
            raise NotFoundError("Expense record not found")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(expense_id, update_dict)
        if obj is None:
            raise NotFoundError("Expense record not found")
        return obj

    async def delete_for_user(self, user_id: uuid.UUID, expense_id: uuid.UUID) -> None:
        """Soft-delete an expense if owned by the user."""
        expense = await self._repo.get_by_id(expense_id)
        if expense is None or expense.user_id != user_id:
            raise NotFoundError("Expense record not found")
        await self._repo.delete(expense_id, soft=True)

    async def total_expenses_for_period(
        self,
        user_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> float:
        """Return total expenses for a date range."""
        return await self._repo.sum_for_period(user_id, start_date, end_date)

    async def expenses_by_category(
        self,
        user_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> Sequence[tuple[uuid.UUID, float]]:
        """Return expenses grouped by category."""
        return await self._repo.sum_by_category(user_id, start_date, end_date)
