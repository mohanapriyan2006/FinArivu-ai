from __future__ import annotations

from pydantic import Field

from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class ExpenseCategoryBase(BaseSchema):
    """Base expense category fields."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    icon: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=50)
    display_order: int = Field(default=0, ge=0)


class ExpenseCategoryCreate(ExpenseCategoryBase):
    """Create an expense category (admin only)."""

    is_system: bool = Field(default=False)


class ExpenseCategoryUpdate(BaseSchema):
    """Update an expense category."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    icon: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=50)
    display_order: int | None = Field(default=None, ge=0)
    is_system: bool | None = None


class ExpenseCategoryResponse(AuditedSchema, ExpenseCategoryBase):
    """Expense category response DTO."""

    is_system: bool


class ExpenseCategoryListResponse(PaginatedResponse[ExpenseCategoryResponse]):
    """Paginated list of expense categories."""

    pass
