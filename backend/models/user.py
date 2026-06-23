"""User model."""

import uuid

from sqlalchemy import String, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class User(Base, TimestampMixin):
    """User model with custom JWT authentication."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    clerk_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Relationships
    profile: Mapped["Profile"] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    incomes: Mapped[list["Income"]] = relationship(
        "Income",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    health_scores: Mapped[list["FinancialHealthScore"]] = relationship(
        "FinancialHealthScore",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    insights: Mapped[list["Insight"]] = relationship(
        "Insight",
        back_populates="user",
        cascade="all, delete-orphan",
    )
