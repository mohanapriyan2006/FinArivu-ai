from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any, Generic, Sequence, TypeVar

from sqlalchemy import asc, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async repository for common CRUD operations."""

    def __init__(self, session: AsyncSession, model: type[ModelType]) -> None:
        self._session = session
        self._model = model

    def _base_query(self, include_deleted: bool = False) -> select:
        query = select(self._model)
        if not include_deleted and hasattr(self._model, "deleted_at"):
            query = query.where(self._model.deleted_at.is_(None))
        return query

    async def create(self, obj: ModelType) -> ModelType:
        """Persist a new model instance and return it."""
        self._session.add(obj)
        await self._session.flush()
        await self._session.refresh(obj)
        return obj

    async def get_by_id(
        self,
        id: uuid.UUID,
        include_deleted: bool = False,
    ) -> ModelType | None:
        """Fetch a single record by primary key."""
        query = self._base_query(include_deleted).where(self._model.id == id)
        return (await self._session.execute(query)).scalar_one_or_none()

    async def update(
        self,
        id: uuid.UUID,
        data: dict[str, Any],
    ) -> ModelType | None:
        """Update a record by primary key and return the updated instance."""
        data = {k: v for k, v in data.items() if k != "id" and hasattr(self._model, k)}
        if not data:
            return await self.get_by_id(id)

        if hasattr(self._model, "updated_at") and "updated_at" not in data:
            data["updated_at"] = datetime.now(UTC)

        stmt = (
            update(self._model)
            .where(self._model.id == id)
            .values(**data)
            .returning(self._model)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.scalar_one_or_none()

    async def delete(
        self,
        id: uuid.UUID,
        soft: bool = True,
    ) -> ModelType | None:
        """Delete a record, soft-delete by default."""
        obj = await self.get_by_id(id)
        if obj is None:
            return None

        if soft and hasattr(obj, "soft_delete"):
            obj.soft_delete()
            await self._session.flush()
            return obj

        await self._session.delete(obj)
        await self._session.flush()
        return None

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: str | None = None,
        descending: bool = True,
        **filters: Any,
    ) -> Sequence[ModelType]:
        """List records with optional filters and ordering."""
        query = self._base_query()

        for key, value in filters.items():
            if value is not None and hasattr(self._model, key):
                query = query.where(getattr(self._model, key) == value)

        if order_by and hasattr(self._model, order_by):
            column = getattr(self._model, order_by)
            query = query.order_by(desc(column) if descending else asc(column))
        else:
            query = query.order_by(desc(self._model.created_at))

        query = query.offset(skip).limit(limit)
        result = await self._session.execute(query)
        return result.scalars().all()

    async def search(
        self,
        term: str | None,
        fields: list[str],
        skip: int = 0,
        limit: int = 100,
        **filters: Any,
    ) -> Sequence[ModelType]:
        """Perform an ILIKE search across the provided fields."""
        query = self._base_query()

        for key, value in filters.items():
            if value is not None and hasattr(self._model, key):
                query = query.where(getattr(self._model, key) == value)

        if term and fields:
            from sqlalchemy import or_

            conditions = [
                getattr(self._model, field).ilike(f"%{term}%")
                for field in fields
                if hasattr(self._model, field)
            ]
            if conditions:
                query = query.where(or_(*conditions))

        query = query.order_by(desc(self._model.created_at)).offset(skip).limit(limit)
        result = await self._session.execute(query)
        return result.scalars().all()

    async def count(self, **filters: Any) -> int:
        """Return the number of matching records."""
        query = select(func.count(self._model.id))
        for key, value in filters.items():
            if value is not None and hasattr(self._model, key):
                query = query.where(getattr(self._model, key) == value)

        result = await self._session.execute(query)
        return result.scalar() or 0

    async def exists(self, **filters: Any) -> bool:
        """Check whether any record matches the filters."""
        count = await self.count(**filters)
        return count > 0
