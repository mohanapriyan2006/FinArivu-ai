from __future__ import annotations

import uuid
from datetime import datetime
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.money_radar import RadarInsight, RadarScanState
from app.repositories.base import BaseRepository


class RadarInsightRepository(BaseRepository[RadarInsight]):
    """User-scoped persistence for Money Radar insights."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, RadarInsight)

    async def get_for_user(
        self,
        user_id: uuid.UUID,
        insight_id: uuid.UUID,
    ) -> RadarInsight | None:
        """Fetch an insight only if it belongs to the user."""
        query = select(RadarInsight).where(
            RadarInsight.id == insight_id,
            RadarInsight.user_id == user_id,
            RadarInsight.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def get_by_fingerprint(
        self,
        user_id: uuid.UUID,
        fingerprint: str,
    ) -> RadarInsight | None:
        query = select(RadarInsight).where(
            RadarInsight.user_id == user_id,
            RadarInsight.fingerprint == fingerprint,
            RadarInsight.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        statuses: Sequence[str] | None = None,
        severities: Sequence[str] | None = None,
        insight_types: Sequence[str] | None = None,
        categories: Sequence[str] | None = None,
        entity_type: str | None = None,
        created_after: datetime | None = None,
        created_before: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[RadarInsight], int]:
        """Filtered, paginated insight history — always user-scoped."""
        query = select(RadarInsight).where(
            RadarInsight.user_id == user_id,
            RadarInsight.deleted_at.is_(None),
        )
        if statuses:
            query = query.where(RadarInsight.status.in_(list(statuses)))
        if severities:
            query = query.where(RadarInsight.severity.in_(list(severities)))
        if insight_types:
            query = query.where(RadarInsight.insight_type.in_(list(insight_types)))
        if categories:
            query = query.where(RadarInsight.category.in_(list(categories)))
        if entity_type:
            query = query.where(RadarInsight.entity_type == entity_type)
        if created_after:
            query = query.where(RadarInsight.created_at >= created_after)
        if created_before:
            query = query.where(RadarInsight.created_at <= created_before)

        count_q = select(func.count()).select_from(query.subquery())
        total = (await self._session.execute(count_q)).scalar() or 0

        # Severity ordering: HIGH first, then newest within a severity.
        severity_rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "INFO": 3}
        rows = list(
            (
                await self._session.execute(
                    query.order_by(RadarInsight.created_at.desc())
                    .offset(skip)
                    .limit(limit)
                )
            )
            .scalars()
            .all()
        )
        rows.sort(
            key=lambda r: (
                severity_rank.get(r.severity, 4),
                -r.created_at.timestamp() if r.created_at else 0,
            )
        )
        return rows, total

    async def list_open_for_user(
        self,
        user_id: uuid.UUID,
        insight_type: str | None = None,
    ) -> list[RadarInsight]:
        """Active/seen rows — the set eligible for auto-resolution."""
        query = select(RadarInsight).where(
            RadarInsight.user_id == user_id,
            RadarInsight.deleted_at.is_(None),
            RadarInsight.status.in_(["ACTIVE", "SEEN"]),
        )
        if insight_type is not None:
            query = query.where(RadarInsight.insight_type == insight_type)
        return list((await self._session.execute(query)).scalars().all())

    async def count_resolved_for_user(self, user_id: uuid.UUID) -> int:
        query = select(func.count()).select_from(RadarInsight).where(
            RadarInsight.user_id == user_id,
            RadarInsight.deleted_at.is_(None),
            RadarInsight.status == "RESOLVED",
        )
        return (await self._session.execute(query)).scalar() or 0


class RadarScanRepository(BaseRepository[RadarScanState]):
    """One-row-per-user latest scan snapshot."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, RadarScanState)

    async def get_for_user(self, user_id: uuid.UUID) -> RadarScanState | None:
        query = select(RadarScanState).where(
            RadarScanState.user_id == user_id,
            RadarScanState.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def upsert_for_user(
        self,
        user_id: uuid.UUID,
        *,
        generated_at: datetime,
        coverage: list,
        counts: dict,
        radar_version: str,
    ) -> RadarScanState:
        existing = await self.get_for_user(user_id)
        if existing is not None:
            existing.generated_at = generated_at
            existing.coverage = coverage
            existing.counts = counts
            existing.radar_version = radar_version
            await self._session.flush()
            return existing
        row = RadarScanState(
            user_id=user_id,
            generated_at=generated_at,
            coverage=coverage,
            counts=counts,
            radar_version=radar_version,
        )
        return await self.create(row)
