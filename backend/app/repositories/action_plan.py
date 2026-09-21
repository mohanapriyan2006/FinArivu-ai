from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.action_plan import FinancialActionPlan, FinancialPlanItem
from app.repositories.base import BaseRepository


class FinancialActionPlanRepository(BaseRepository[FinancialActionPlan]):
    """User-scoped persistence for financial action plans."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, FinancialActionPlan)

    async def get_for_user(
        self, user_id: uuid.UUID, plan_id: uuid.UUID
    ) -> FinancialActionPlan | None:
        query = select(FinancialActionPlan).where(
            FinancialActionPlan.id == plan_id,
            FinancialActionPlan.user_id == user_id,
            FinancialActionPlan.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def get_current_for_user(
        self, user_id: uuid.UUID, period_key: str
    ) -> FinancialActionPlan | None:
        """The ACTIVE plan for the current period — at most one exists."""
        query = select(FinancialActionPlan).where(
            FinancialActionPlan.user_id == user_id,
            FinancialActionPlan.period_key == period_key,
            FinancialActionPlan.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_history_for_user(
        self,
        user_id: uuid.UUID,
        *,
        exclude_period_key: str | None = None,
        skip: int = 0,
        limit: int = 12,
    ) -> tuple[list[FinancialActionPlan], int]:
        """Past plans, newest period first."""
        query = select(FinancialActionPlan).where(
            FinancialActionPlan.user_id == user_id,
            FinancialActionPlan.deleted_at.is_(None),
        )
        if exclude_period_key:
            query = query.where(
                FinancialActionPlan.period_key != exclude_period_key
            )
        count_q = select(func.count()).select_from(query.subquery())
        total = (await self._session.execute(count_q)).scalar() or 0
        rows = (
            await self._session.execute(
                query.order_by(FinancialActionPlan.period_start.desc())
                .offset(skip)
                .limit(limit)
            )
        ).scalars().all()
        return list(rows), total


class FinancialPlanItemRepository(BaseRepository[FinancialPlanItem]):
    """User-scoped persistence for plan items."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, FinancialPlanItem)

    async def get_for_user(
        self, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> FinancialPlanItem | None:
        query = select(FinancialPlanItem).where(
            FinancialPlanItem.id == item_id,
            FinancialPlanItem.user_id == user_id,
            FinancialPlanItem.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def get_by_fingerprint(
        self, user_id: uuid.UUID, fingerprint: str
    ) -> FinancialPlanItem | None:
        query = select(FinancialPlanItem).where(
            FinancialPlanItem.user_id == user_id,
            FinancialPlanItem.fingerprint == fingerprint,
            FinancialPlanItem.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_for_plan(
        self,
        plan_id: uuid.UUID,
        statuses: list[str] | None = None,
    ) -> list[FinancialPlanItem]:
        query = select(FinancialPlanItem).where(
            FinancialPlanItem.plan_id == plan_id,
            FinancialPlanItem.deleted_at.is_(None),
        )
        if statuses:
            query = query.where(FinancialPlanItem.status.in_(statuses))
        return list((await self._session.execute(query)).scalars().all())

    async def list_open_for_user(
        self, user_id: uuid.UUID
    ) -> list[FinancialPlanItem]:
        """PENDING/IN_PROGRESS/SNOOZED items across the current plan."""
        query = select(FinancialPlanItem).where(
            FinancialPlanItem.user_id == user_id,
            FinancialPlanItem.deleted_at.is_(None),
            FinancialPlanItem.status.in_(
                ["PENDING", "IN_PROGRESS", "SNOOZED"]
            ),
        )
        return list((await self._session.execute(query)).scalars().all())

    async def find_dismissed_by_signature(
        self, user_id: uuid.UUID, signature: str
    ) -> list[FinancialPlanItem]:
        """Dismissed items sharing a state signature — dismissal memory."""
        query = select(FinancialPlanItem).where(
            FinancialPlanItem.user_id == user_id,
            FinancialPlanItem.status == "DISMISSED",
            FinancialPlanItem.deleted_at.is_(None),
        )
        rows = (await self._session.execute(query)).scalars().all()
        return [r for r in rows if r.state_signature == signature]
