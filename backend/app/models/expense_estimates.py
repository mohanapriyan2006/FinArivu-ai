from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class MonthlyExpenseEstimate(Base):
    """Manual or estimated monthly expense total/breakdown for a user."""

    __tablename__ = "monthly_expense_estimates"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("expense_categories.id", ondelete="RESTRICT"),
        index=True,
        nullable=True,
    )
    amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        default="manual_estimate",
        nullable=False,
    )
    estimate_month: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")
    category: Mapped["ExpenseCategory"] = relationship("ExpenseCategory")

    __table_args__ = (
        CheckConstraint("amount >= 0", name="chk_expense_estimate_amount_non_negative"),
        CheckConstraint(
            "source IN ('manual_estimate', 'imported', 'api', 'calculated')",
            name="chk_expense_estimate_source",
        ),
        Index("ix_monthly_expense_estimates_user_month", "user_id", "estimate_month"),
    )
