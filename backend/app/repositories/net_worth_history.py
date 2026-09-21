from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.net_worth_history import NetWorthHistory
from app.repositories.base import BaseRepository


class NetWorthHistoryRepository(BaseRepository[NetWorthHistory]):
    """Repository for persisted net worth snapshots."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, NetWorthHistory)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        limit: int = 24,
    ) -> list[NetWorthHistory]:
        """Return the user's snapshots, newest first."""
        query = (
            select(NetWorthHistory)
            .where(
                NetWorthHistory.user_id == user_id,
                NetWorthHistory.deleted_at.is_(None),
            )
            .order_by(NetWorthHistory.snapshot_date.desc())
            .limit(limit)
        )
        return list((await self._session.execute(query)).scalars().all())

    async def upsert_snapshot(
        self,
        user_id: uuid.UUID,
        snapshot_date: date,
        net_worth: Decimal,
        total_assets: Decimal,
        total_liabilities: Decimal,
    ) -> NetWorthHistory:
        """Record a snapshot — one row per (user, date); refreshes in place."""
        query = select(NetWorthHistory).where(
            NetWorthHistory.user_id == user_id,
            NetWorthHistory.snapshot_date == snapshot_date,
            NetWorthHistory.deleted_at.is_(None),
        )
        existing = (await self._session.execute(query)).scalar_one_or_none()
        if existing is not None:
            existing.net_worth = net_worth
            existing.total_assets = total_assets
            existing.total_liabilities = total_liabilities
            await self._session.flush()
            return existing
        row = NetWorthHistory(
            user_id=user_id,
            snapshot_date=snapshot_date,
            net_worth=net_worth,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
        )
        return await self.create(row)
