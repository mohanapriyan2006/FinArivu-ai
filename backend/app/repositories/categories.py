from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.categories import ExpenseCategory
from app.repositories.base import BaseRepository


class ExpenseCategoryRepository(BaseRepository[ExpenseCategory]):
    """Repository for expense category master data."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ExpenseCategory)

    async def get_by_name(self, name: str) -> ExpenseCategory | None:
        """Fetch a category by its exact name."""
        query = select(ExpenseCategory).where(
            ExpenseCategory.name == name,
            ExpenseCategory.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_system_categories(self) -> list[ExpenseCategory]:
        """Return all system-seeded categories in display order."""
        query = select(ExpenseCategory).where(
            ExpenseCategory.is_system.is_(True),
            ExpenseCategory.deleted_at.is_(None),
        ).order_by(ExpenseCategory.display_order, ExpenseCategory.name)
        return list((await self._session.execute(query)).scalars().all())
