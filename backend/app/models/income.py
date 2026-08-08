from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import INCOME_SOURCES
from app.models.base import Base


class Income(Base):
    """Income record for a user."""

    __tablename__ = "income"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    income_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    frequency: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User", back_populates="incomes")

    __table_args__ = (
        CheckConstraint(f"source IN {INCOME_SOURCES}", name="chk_income_source"),
        Index("ix_income_user_date", "user_id", "income_date"),
    )
