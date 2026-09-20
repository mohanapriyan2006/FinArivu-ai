from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scenario_runs import ScenarioRun
from app.repositories.base import BaseRepository


class ScenarioRunRepository(BaseRepository[ScenarioRun]):
    """Repository for saved Scenario Lab runs."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ScenarioRun)

    async def get_for_user(
        self,
        user_id: uuid.UUID,
        scenario_id: uuid.UUID,
    ) -> ScenarioRun | None:
        """Fetch a scenario only if it belongs to the user."""
        query = select(ScenarioRun).where(
            ScenarioRun.id == scenario_id,
            ScenarioRun.user_id == user_id,
            ScenarioRun.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[ScenarioRun]:
        """Return the user's saved scenarios, newest first."""
        query = (
            select(ScenarioRun)
            .where(
                ScenarioRun.user_id == user_id,
                ScenarioRun.deleted_at.is_(None),
            )
            .order_by(ScenarioRun.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list((await self._session.execute(query)).scalars().all())
