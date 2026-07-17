from __future__ import annotations

import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import BUDGET_PERIODS
from app.models.base import Base


class Budget(Base):
    """Budget limit per user and category for a given period."""

    __tablename__ = "budgets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("expense_categories.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    monthly_limit: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    period: Mapped[str] = mapped_column(
        String(50),
        default="monthly",
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="budgets")
    category: Mapped["ExpenseCategory"] = relationship(
        "ExpenseCategory",
        back_populates="budgets",
    )

    __table_args__ = (
        CheckConstraint(f"period IN {BUDGET_PERIODS}", name="chk_budget_period"),
        CheckConstraint("monthly_limit >= 0", name="chk_budget_monthly_limit_positive"),
        UniqueConstraint("user_id", "category_id", name="uq_budgets_user_category"),
        Index("ix_budgets_user_id", "user_id"),
        Index("ix_budgets_category_id", "category_id"),
    )
