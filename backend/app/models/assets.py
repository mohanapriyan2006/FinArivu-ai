from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import ASSET_TYPES
from app.models.base import Base


class Asset(Base):
    """User asset (cash, investments, property, etc.)."""

    __tablename__ = "assets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    asset_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    value: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )
    as_of_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_emergency_fund: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    savings_bucket: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    interest_rate: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    maturity_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        default="manual",
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="assets")

    __table_args__ = (
        CheckConstraint(f"asset_type IN {ASSET_TYPES}", name="chk_asset_type"),
        CheckConstraint("value >= 0", name="chk_asset_value_non_negative"),
        CheckConstraint(
            "savings_bucket IS NULL OR savings_bucket IN ('emergency', 'general', 'goal')",
            name="chk_asset_savings_bucket",
        ),
        CheckConstraint(
            "source IN ('manual', 'imported', 'api', 'calculated', 'estimate')",
            name="chk_asset_source",
        ),
        Index("ix_assets_user_type", "user_id", "asset_type"),
        Index("ix_assets_as_of_date", "as_of_date"),
    )
