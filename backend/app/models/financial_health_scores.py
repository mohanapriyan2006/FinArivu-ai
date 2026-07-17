from __future__ import annotations

import uuid

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FinancialHealthScore(Base):
    """Computed financial health score and component breakdown."""

    __tablename__ = "financial_health_scores"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )
    savings_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
    )
    emergency_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
    )
    debt_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
    )
    goal_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
    )
    budget_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        default=datetime.utcnow,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 100", name="chk_fhs_score_range"),
        CheckConstraint("savings_score >= 0 AND savings_score <= 30", name="chk_fhs_savings_range"),
        CheckConstraint("emergency_score >= 0 AND emergency_score <= 20", name="chk_fhs_emergency_range"),
        CheckConstraint("debt_score >= 0 AND debt_score <= 20", name="chk_fhs_debt_range"),
        CheckConstraint("goal_score >= 0 AND goal_score <= 15", name="chk_fhs_goal_range"),
        CheckConstraint("budget_score >= 0 AND budget_score <= 15", name="chk_fhs_budget_range"),
        Index("ix_financial_health_scores_user_calculated", "user_id", "calculated_at"),
    )
