from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.copilot_action_executions import CopilotActionExecution
from app.repositories.base import BaseRepository


class CopilotActionExecutionRepository(BaseRepository[CopilotActionExecution]):
    """Repository for copilot action execution state."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, CopilotActionExecution)

    async def get_for_user(
        self,
        user_id: uuid.UUID,
        execution_id: uuid.UUID,
    ) -> CopilotActionExecution | None:
        """Fetch an execution only if it belongs to the user."""
        query = select(CopilotActionExecution).where(
            CopilotActionExecution.id == execution_id,
            CopilotActionExecution.user_id == user_id,
            CopilotActionExecution.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
        statuses: list[str] | None = None,
    ) -> list[CopilotActionExecution]:
        """Return the user's action history, newest first."""
        query = select(CopilotActionExecution).where(
            CopilotActionExecution.user_id == user_id,
            CopilotActionExecution.deleted_at.is_(None),
        )
        if statuses:
            query = query.where(CopilotActionExecution.status.in_(statuses))
        query = query.order_by(
            CopilotActionExecution.created_at.desc()
        ).offset(skip).limit(limit)
        return list((await self._session.execute(query)).scalars().all())
