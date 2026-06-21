"""Base repository with common CRUD operations."""

import uuid
from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic repository with basic CRUD."""

    def __init__(self, model: type[ModelType]) -> None:
        self.model = model

    async def get_by_id(
        self,
        session: AsyncSession,
        obj_id: uuid.UUID,
    ) -> ModelType | None:
        """Get a single record by ID."""
        result = await session.execute(
            select(self.model).where(self.model.id == obj_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        """Get all records with pagination."""
        result = await session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(
        self,
        session: AsyncSession,
        obj_in: dict,
    ) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        session.add(db_obj)
        await session.flush()
        await session.refresh(db_obj)
        return db_obj

    async def update(
        self,
        session: AsyncSession,
        db_obj: ModelType,
        obj_in: dict,
    ) -> ModelType:
        """Update an existing record."""
        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)
        session.add(db_obj)
        await session.flush()
        await session.refresh(db_obj)
        return db_obj

    async def delete(
        self,
        session: AsyncSession,
        db_obj: ModelType,
    ) -> None:
        """Delete a record."""
        await session.delete(db_obj)
        await session.flush()
