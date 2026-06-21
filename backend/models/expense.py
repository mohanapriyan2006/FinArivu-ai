"""Expense model."""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import String, Date, ForeignKey, Numeric, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class Expense(Base, TimestampMixin):
    """Expense tracking model."""

    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expense_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=True)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="expenses")
    category: Mapped["ExpenseCategory"] = relationship(
        "ExpenseCategory",
        back_populates="expenses",
    )

    __table_args__ = (
        Index("ix_expenses_user_id", "user_id"),
        Index("ix_expenses_expense_date", "expense_date"),
    )
