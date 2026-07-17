from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import PAYMENT_METHODS
from app.models.base import Base


class Expense(Base):
    """Expense record for a user."""

    __tablename__ = "expenses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("expense_categories.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    expense_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    payment_method: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    is_recurring: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="expenses")
    category: Mapped["ExpenseCategory"] = relationship(
        "ExpenseCategory",
        back_populates="expenses",
    )

    __table_args__ = (
        CheckConstraint(
            "payment_method IS NULL OR payment_method IN " + str(PAYMENT_METHODS),
            name="chk_expense_payment_method",
        ),
        Index("ix_expenses_user_date", "user_id", "expense_date"),
        Index("ix_expenses_category", "category_id"),
    )
