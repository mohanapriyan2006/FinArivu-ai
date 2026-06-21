"""Budget model."""

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class Budget(Base, TimestampMixin):
    """Category-wise monthly budget model."""

    __tablename__ = "budgets"

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
        ForeignKey("expense_categories.id", ondelete="CASCADE"),
        nullable=False,
    )
    monthly_limit: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="budgets")
    category: Mapped["ExpenseCategory"] = relationship(
        "ExpenseCategory",
        back_populates="budgets",
    )

    __table_args__ = (
        Index("ix_budgets_user_id", "user_id"),
        Index("ix_budgets_category_id", "category_id"),
        UniqueConstraint("user_id", "category_id", name="uq_budget_user_category"),
    )
