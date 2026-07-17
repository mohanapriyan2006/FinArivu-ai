from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    """Base Pydantic schema with ORM mapping enabled."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class AuditedSchema(BaseSchema):
    """Schema including audit columns."""

    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    created_by: UUID | None = None
    updated_by: UUID | None = None


class PaginationMeta(BaseSchema):
    """Pagination metadata for list responses."""

    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    total: int = Field(default=0, ge=0)
    pages: int = Field(default=0, ge=0)


T = TypeVar("T")


class PaginatedResponse(BaseSchema, Generic[T]):
    """Paginated list wrapper for a single resource type."""

    items: list[T]
    meta: PaginationMeta


class MessageResponse(BaseSchema):
    """Simple message response."""

    message: str
