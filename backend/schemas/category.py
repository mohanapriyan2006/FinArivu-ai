"""Category schemas."""

import uuid

from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    """Base category schema."""

    name: str


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""

    pass


class CategoryResponse(CategoryBase):
    """Schema for category response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
