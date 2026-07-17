from __future__ import annotations

import uuid

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class WeeklyReport(Base):
    """Generated weekly financial report for a user."""

    __tablename__ = "weekly_reports"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    report_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        default=datetime.utcnow,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_weekly_reports_user_generated", "user_id", "generated_at"),
    )
