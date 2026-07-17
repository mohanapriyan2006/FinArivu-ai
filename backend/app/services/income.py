from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.income import Income
from app.repositories.income import IncomeRepository
from app.schemas.income import IncomeCreate, IncomeUpdate
from app.services.base import BaseService


class IncomeService(BaseService[Income]):
    """Service for managing income records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(IncomeRepository(session))
        self._repo: IncomeRepository

    async def create_for_user(
        self,
        user_id: uuid.UUID,
        data: IncomeCreate,
    ) -> Income:
        """Create an income record owned by the authenticated user."""
        payload = data.model_dump(exclude_unset=True)
        payload["user_id"] = user_id
        income = Income(**payload)
        return await self._repo.create(income)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        start_date: date | None = None,
        end_date: date | None = None,
        source: str | None = None,
        is_recurring: bool | None = None,
    ) -> list[Income]:
        """List income records for a user."""
        return list(
            await self._repo.list_for_user(
                user_id,
                skip,
                limit,
                start_date,
                end_date,
                source,
                is_recurring,
            )
        )

    async def update_for_user(
        self,
        user_id: uuid.UUID,
        income_id: uuid.UUID,
        data: IncomeUpdate,
    ) -> Income:
        """Update an income record if owned by the user."""
        income = await self._repo.get_by_id(income_id)
        if income is None or income.user_id != user_id:
            raise NotFoundError("Income record not found")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(income_id, update_dict)
        if obj is None:
            raise NotFoundError("Income record not found")
        return obj

    async def delete_for_user(self, user_id: uuid.UUID, income_id: uuid.UUID) -> None:
        """Soft-delete an income record if owned by the user."""
        income = await self._repo.get_by_id(income_id)
        if income is None or income.user_id != user_id:
            raise NotFoundError("Income record not found")
        await self._repo.delete(income_id, soft=True)

    async def total_income_for_period(
        self,
        user_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> float:
        """Return total income for a date range."""
        return await self._repo.sum_for_period(user_id, start_date, end_date)
