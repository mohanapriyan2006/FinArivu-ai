"""Income repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from models.income import Income
from repositories.base import BaseRepository


class IncomeRepository(BaseRepository[Income]):
    """Repository for income operations."""

    def __init__(self) -> None:
        super().__init__(Income)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Income]:
        """Get all income records for a user."""
        result = await session.execute(
            select(Income)
            .where(Income.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


income_repository = IncomeRepository()
