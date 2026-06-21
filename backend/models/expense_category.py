"""Expense Category model."""

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class ExpenseCategory(Base):
    """Expense category lookup table."""

    __tablename__ = "expense_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="category",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="category",
    )
