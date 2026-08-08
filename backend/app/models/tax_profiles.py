from __future__ import annotations

import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TaxProfile(Base):
    """User tax profile and deduction information."""

    __tablename__ = "tax_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    annual_income: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    tax_regime: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )
    deduction_80c: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    deduction_80d: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    home_loan_interest: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    nps_deduction: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    other_deductions: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint(
            "tax_regime IS NULL OR tax_regime IN ('old', 'new')",
            name="chk_tax_regime",
        ),
        UniqueConstraint("user_id", name="uq_tax_profiles_user_id"),
        Index("ix_tax_profiles_user_id", "user_id"),
    )
