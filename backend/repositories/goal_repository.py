"""Goal repository."""

import uuid
from datetime import date

from sqlalchemy import asc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.goal import Goal
from repositories.base import BaseRepository


class GoalRepository(BaseRepository[Goal]):
    """Repository for goal operations."""

    def __init__(self) -> None:
        super().__init__(Goal)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Goal]:
        """Get all goals for a user."""
        result = await session.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id_with_owner(
        self,
        session: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Goal | None:
        """Get a goal by ID ensuring it belongs to the user."""
        result = await session.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_upcoming_deadlines(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        days: int = 30,
        limit: int = 5,
    ) -> list[Goal]:
        """Get goals with upcoming deadlines."""
        from datetime import timedelta

        today = date.today()
        future = today + timedelta(days=days)

        result = await session.execute(
            select(Goal)
            .where(
                Goal.user_id == user_id,
                Goal.status == "Active",
                Goal.target_date >= today,
                Goal.target_date <= future,
            )
            .order_by(asc(Goal.target_date))
            .limit(limit)
        )
        return list(result.scalars().all())


goal_repository = GoalRepository()
