from __future__ import annotations

import uuid
from typing import Any, Generic, TypeVar

from app.exceptions import NotFoundError
from app.repositories.base import BaseRepository

ModelType = TypeVar("ModelType")


class BaseService(Generic[ModelType]):
    """Generic service layer for CRUD operations on a model."""

    def __init__(self, repository: BaseRepository[ModelType]) -> None:
        self._repo = repository

    async def get(self, id: uuid.UUID) -> ModelType:
        obj = await self._repo.get_by_id(id)
        if obj is None:
            raise NotFoundError(f"{self._repo._model.__name__} not found")
        return obj

    async def get_optional(self, id: uuid.UUID) -> ModelType | None:
        return await self._repo.get_by_id(id)

    async def create(self, data: dict[str, Any]) -> ModelType:
        obj = self._repo._model(**data)
        return await self._repo.create(obj)

    async def update(self, id: uuid.UUID, data: dict[str, Any]) -> ModelType:
        obj = await self._repo.update(id, data)
        if obj is None:
            raise NotFoundError(f"{self._repo._model.__name__} not found")
        return obj

    async def delete(self, id: uuid.UUID, soft: bool = True) -> ModelType:
        obj = await self._repo.delete(id, soft=soft)
        if obj is None and soft:
            raise NotFoundError(f"{self._repo._model.__name__} not found")
        # hard delete returns None, return the model from get
        return obj  # type: ignore[return-value]

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: str | None = None,
        descending: bool = True,
        **filters: Any,
    ) -> list[ModelType]:
        return list(await self._repo.list(skip, limit, order_by, descending, **filters))

    async def count(self, **filters: Any) -> int:
        return await self._repo.count(**filters)
