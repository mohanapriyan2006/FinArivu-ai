from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.constants import AssetType
from app.schemas.base import AuditedSchema, BaseSchema, PaginatedResponse


class AssetBase(BaseSchema):
    """Base asset fields."""

    asset_type: AssetType
    name: str = Field(..., min_length=1, max_length=255)
    value: Decimal = Field(..., decimal_places=2, max_digits=15, ge=0)
    currency: str = Field(default="INR", min_length=1, max_length=10)
    as_of_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)
    is_emergency_fund: bool = False
    savings_bucket: str | None = Field(default=None, max_length=50)
    interest_rate: Decimal | None = Field(default=None, ge=0)
    maturity_date: date | None = None
    source: str = Field(default="manual", max_length=50)


class AssetCreate(AssetBase):
    """Create an asset."""

    pass


class AssetUpdate(BaseSchema):
    """Update an asset."""

    asset_type: AssetType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    value: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=10)
    as_of_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)
    is_emergency_fund: bool | None = None
    savings_bucket: str | None = Field(default=None, max_length=50)
    interest_rate: Decimal | None = Field(default=None, ge=0)
    maturity_date: date | None = None
    source: str | None = Field(default=None, max_length=50)


class AssetResponse(AuditedSchema, AssetBase):
    """Asset response DTO."""

    user_id: UUID


class AssetListResponse(PaginatedResponse[AssetResponse]):
    """Paginated list of assets."""

    pass
