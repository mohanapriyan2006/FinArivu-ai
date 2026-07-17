from __future__ import annotations

import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import NOTIFICATION_CHANNELS, NOTIFICATION_FREQUENCIES
from app.models.base import Base


class NotificationPreference(Base):
    """User notification channel preferences."""

    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    channel: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    frequency: Mapped[str] = mapped_column(
        String(50),
        default="realtime",
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint(f"channel IN {NOTIFICATION_CHANNELS}", name="chk_notification_channel"),
        CheckConstraint(f"frequency IN {NOTIFICATION_FREQUENCIES}", name="chk_notification_frequency"),
        UniqueConstraint("user_id", "channel", name="uq_notification_preferences_user_channel"),
        Index("ix_notification_preferences_user_id", "user_id"),
    )
