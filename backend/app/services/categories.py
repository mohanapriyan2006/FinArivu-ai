from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError
from app.models.categories import ExpenseCategory
from app.repositories.categories import ExpenseCategoryRepository
from app.schemas.categories import ExpenseCategoryCreate, ExpenseCategoryUpdate
from app.services.base import BaseService


class ExpenseCategoryService(BaseService[ExpenseCategory]):
    """Service for managing expense categories."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ExpenseCategoryRepository(session))
        self._repo: ExpenseCategoryRepository

    async def create(self, data: ExpenseCategoryCreate) -> ExpenseCategory:
        """Create a category with duplicate name check."""
        if await self._repo.get_by_name(data.name):
            raise ConflictError("Category name already exists")
        category = ExpenseCategory(**data.model_dump(exclude_unset=True))
        return await self._repo.create(category)

    async def update(self, id: uuid.UUID, data: ExpenseCategoryUpdate) -> ExpenseCategory:
        """Update a category, protecting system categories from rename."""
        existing = await self.get(id)
        if existing.is_system and data.name and data.name != existing.name:
            raise ConflictError("Cannot rename system categories")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(id, update_dict)
        if obj is None:
            raise NotFoundError("Category not found")
        return obj

    async def delete(self, id: uuid.UUID, soft: bool = True) -> ExpenseCategory:
        """Delete a category, protecting system categories."""
        existing = await self.get(id)
        if existing.is_system:
            raise ConflictError("Cannot delete system categories")
        return await super().delete(id, soft=soft)

    async def list_system_categories(self) -> list[ExpenseCategory]:
        """Return system categories in display order."""
        return await self._repo.list_system_categories()
