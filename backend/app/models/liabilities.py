from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import LIABILITY_TYPES
from app.models.base import Base


class Liability(Base):
    """User liability (loan, credit card debt, etc.)."""

    __tablename__ = "liabilities"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    liability_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )
    interest_rate: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    emi: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    remaining_tenure_months: Mapped[int | None] = mapped_column(
        nullable=True,
    )
    start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    credit_limit: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    monthly_spend: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        default="manual",
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="liabilities")

    __table_args__ = (
        CheckConstraint(f"liability_type IN {LIABILITY_TYPES}", name="chk_liability_type"),
        CheckConstraint("amount >= 0", name="chk_liability_amount_non_negative"),
        CheckConstraint(
            "interest_rate IS NULL OR interest_rate >= 0",
            name="chk_liability_interest_non_negative",
        ),
        CheckConstraint("emi IS NULL OR emi >= 0", name="chk_liability_emi_non_negative"),
        CheckConstraint(
            "remaining_tenure_months IS NULL OR remaining_tenure_months >= 0",
            name="chk_liability_tenure_non_negative",
        ),
        CheckConstraint(
            "credit_limit IS NULL OR credit_limit >= 0",
            name="chk_liability_credit_limit_non_negative",
        ),
        CheckConstraint(
            "monthly_spend IS NULL OR monthly_spend >= 0",
            name="chk_liability_monthly_spend_non_negative",
        ),
        CheckConstraint(
            "source IN ('manual', 'imported', 'api', 'calculated', 'estimate')",
            name="chk_liability_source",
        ),
        Index("ix_liabilities_user_type", "user_id", "liability_type"),
    )
