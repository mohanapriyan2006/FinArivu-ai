from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class NetWorthHistory(Base):
    """Historical net worth snapshot per user."""

    __tablename__ = "net_worth_history"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    net_worth: Mapped[float] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    snapshot_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    total_assets: Mapped[float] = mapped_column(
        Numeric(18, 2),
        nullable=True,
    )
    total_liabilities: Mapped[float] = mapped_column(
        Numeric(18, 2),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint("user_id", "snapshot_date", name="uq_net_worth_history_user_date"),
        Index("ix_net_worth_history_user_date", "user_id", "snapshot_date"),
    )
