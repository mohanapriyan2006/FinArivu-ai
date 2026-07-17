from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import GOAL_PRIORITIES, GOAL_STATUSES
from app.models.base import Base


class Goal(Base):
    """Financial goal for a user."""

    __tablename__ = "goals"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    goal_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    target_amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    current_amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        default=0,
        nullable=False,
    )
    target_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    priority: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="Medium",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="goals")

    __table_args__ = (
        CheckConstraint(f"priority IS NULL OR priority IN {GOAL_PRIORITIES}", name="chk_goal_priority"),
        CheckConstraint(f"status IN {GOAL_STATUSES}", name="chk_goal_status"),
        CheckConstraint("target_amount > 0", name="chk_goal_target_positive"),
        CheckConstraint("current_amount >= 0", name="chk_goal_current_non_negative"),
        Index("ix_goals_user_id", "user_id"),
        Index("ix_goals_status", "status"),
    )
