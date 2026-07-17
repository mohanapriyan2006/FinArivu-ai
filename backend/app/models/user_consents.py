from __future__ import annotations

import uuid

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import CONSENT_TYPES
from app.models.base import Base


class UserConsent(Base):
    """User consent and privacy acceptance records."""

    __tablename__ = "user_consents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    consent_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    accepted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    ip_address: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    user_agent: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint(f"consent_type IN {CONSENT_TYPES}", name="chk_user_consent_type"),
        UniqueConstraint("user_id", "consent_type", name="uq_user_consents_user_type"),
        Index("ix_user_consents_user_id", "user_id"),
    )
