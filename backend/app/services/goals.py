from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.goals import Goal
from app.repositories.goals import GoalRepository
from app.schemas.goals import GoalCreate, GoalUpdate
from app.services.base import BaseService


class GoalService(BaseService[Goal]):
    """Service for managing financial goals."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(GoalRepository(session))
        self._repo: GoalRepository

    async def create_for_user(
        self,
        user_id: uuid.UUID,
        data: GoalCreate,
    ) -> Goal:
        """Create a goal for the authenticated user."""
        payload = data.model_dump(exclude_unset=True)
        payload["user_id"] = user_id
        goal = Goal(**payload)
        return await self._repo.create(goal)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[Goal]:
        """List goals for a user."""
        return await self._repo.list_for_user(user_id, skip, limit, status)

    async def update_for_user(
        self,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        data: GoalUpdate,
    ) -> Goal:
        """Update a goal if owned by the user."""
        goal = await self._repo.get_by_id(goal_id)
        if goal is None or goal.user_id != user_id:
            raise NotFoundError("Goal not found")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(goal_id, update_dict)
        if obj is None:
            raise NotFoundError("Goal not found")
        return obj

    async def delete_for_user(self, user_id: uuid.UUID, goal_id: uuid.UUID) -> None:
        """Soft-delete a goal if owned by the user."""
        goal = await self._repo.get_by_id(goal_id)
        if goal is None or goal.user_id != user_id:
            raise NotFoundError("Goal not found")
        await self._repo.delete(goal_id, soft=True)
