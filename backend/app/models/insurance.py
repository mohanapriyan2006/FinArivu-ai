from __future__ import annotations

import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Insurance(Base):
    """User insurance policy summary."""

    __tablename__ = "insurance"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    insurance_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    coverage_amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    annual_premium: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint(
            "insurance_type IN ('health', 'life', 'other')",
            name="chk_insurance_type",
        ),
        CheckConstraint(
            "coverage_amount IS NULL OR coverage_amount >= 0",
            name="chk_insurance_coverage_non_negative",
        ),
        CheckConstraint(
            "annual_premium IS NULL OR annual_premium >= 0",
            name="chk_insurance_premium_non_negative",
        ),
        Index("ix_insurance_user_id", "user_id"),
    )
