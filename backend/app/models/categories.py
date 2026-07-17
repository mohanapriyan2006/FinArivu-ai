from __future__ import annotations

from sqlalchemy import Boolean, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ExpenseCategory(Base):
    """Expense category master data, including seeded system values."""

    __tablename__ = "expense_categories"

    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    display_order: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        default=0,
    )

    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="category",
        lazy="selectin",
    )

    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="category",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("name", name="uq_expense_categories_name"),
        Index("ix_expense_categories_name", "name"),
    )
