from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError
from app.models.budgets import Budget
from app.repositories.budgets import BudgetRepository
from app.repositories.categories import ExpenseCategoryRepository
from app.schemas.budgets import BudgetCreate, BudgetUpdate
from app.services.base import BaseService


class BudgetService(BaseService[Budget]):
    """Service for managing user budgets."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(BudgetRepository(session))
        self._repo: BudgetRepository
        self._category_repo = ExpenseCategoryRepository(session)

    async def create_for_user(
        self,
        user_id: uuid.UUID,
        data: BudgetCreate,
    ) -> Budget:
        """Create a budget for a user and category."""
        category = await self._category_repo.get_by_id(data.category_id)
        if category is None:
            raise NotFoundError("Expense category not found")

        existing = await self._repo.get_by_user_and_category(user_id, data.category_id)
        if existing is not None:
            raise ConflictError("Budget already exists for this category")

        payload = data.model_dump(exclude_unset=True)
        payload["user_id"] = user_id
        budget = Budget(**payload)
        return await self._repo.create(budget)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Budget]:
        """List budgets for a user."""
        return await self._repo.list_for_user(user_id, skip, limit)

    async def update_for_user(
        self,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
        data: BudgetUpdate,
    ) -> Budget:
        """Update a budget if owned by the user."""
        budget = await self._repo.get_by_id(budget_id)
        if budget is None or budget.user_id != user_id:
            raise NotFoundError("Budget not found")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(budget_id, update_dict)
        if obj is None:
            raise NotFoundError("Budget not found")
        return obj

    async def delete_for_user(self, user_id: uuid.UUID, budget_id: uuid.UUID) -> None:
        """Soft-delete a budget if owned by the user."""
        budget = await self._repo.get_by_id(budget_id)
        if budget is None or budget.user_id != user_id:
            raise NotFoundError("Budget not found")
        await self._repo.delete(budget_id, soft=True)
