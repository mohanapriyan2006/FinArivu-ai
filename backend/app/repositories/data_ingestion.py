"""User-scoped persistence for import batches and candidates."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_ingestion import ImportBatch, ImportCandidate
from app.repositories.base import BaseRepository


class ImportBatchRepository(BaseRepository[ImportBatch]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ImportBatch)

    async def get_for_user(
        self, user_id: uuid.UUID, batch_id: uuid.UUID
    ) -> ImportBatch | None:
        query = select(ImportBatch).where(
            ImportBatch.id == batch_id,
            ImportBatch.user_id == user_id,
            ImportBatch.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def get_by_hash(
        self, user_id: uuid.UUID, content_hash: str
    ) -> ImportBatch | None:
        """Active batch for identical content — duplicate-import guard."""
        query = (
            select(ImportBatch)
            .where(
                ImportBatch.user_id == user_id,
                ImportBatch.content_hash == content_hash,
                ImportBatch.deleted_at.is_(None),
                ImportBatch.status.notin_(["CANCELLED", "FAILED"]),
            )
            .order_by(ImportBatch.created_at.desc())
        )
        return (await self._session.execute(query)).scalars().first()

    async def list_for_user(
        self, user_id: uuid.UUID, *, skip: int = 0, limit: int = 50
    ) -> tuple[list[ImportBatch], int]:
        base = select(ImportBatch).where(
            ImportBatch.user_id == user_id,
            ImportBatch.deleted_at.is_(None),
        )
        total = (
            await self._session.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar() or 0
        rows = (
            await self._session.execute(
                base.order_by(ImportBatch.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
        ).scalars().all()
        return list(rows), total


class ImportCandidateRepository(BaseRepository[ImportCandidate]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ImportCandidate)

    async def get_for_user(
        self, user_id: uuid.UUID, candidate_id: uuid.UUID
    ) -> ImportCandidate | None:
        query = select(ImportCandidate).where(
            ImportCandidate.id == candidate_id,
            ImportCandidate.user_id == user_id,
            ImportCandidate.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_for_batch(
        self, batch_id: uuid.UUID
    ) -> list[ImportCandidate]:
        query = (
            select(ImportCandidate)
            .where(
                ImportCandidate.batch_id == batch_id,
                ImportCandidate.deleted_at.is_(None),
            )
            .order_by(ImportCandidate.seq)
        )
        return list((await self._session.execute(query)).scalars().all())

    async def find_by_fingerprints(
        self, user_id: uuid.UUID, fingerprints: list[str]
    ) -> list[ImportCandidate]:
        """Previously-imported candidates sharing fingerprints — used for
        cross-batch duplicate detection."""
        if not fingerprints:
            return []
        query = select(ImportCandidate).where(
            ImportCandidate.user_id == user_id,
            ImportCandidate.fingerprint.in_(fingerprints),
            ImportCandidate.deleted_at.is_(None),
        )
        return list((await self._session.execute(query)).scalars().all())
