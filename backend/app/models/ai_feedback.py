"""SQLAlchemy model for user feedback on AI copilot responses."""

from __future__ import annotations

import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AIFeedback(Base):
    """User feedback (rating + optional comment) for a copilot message."""

    __tablename__ = "ai_feedback"

    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    message: Mapped["AIMessage"] = relationship("AIMessage")
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_ai_feedback_rating"),
        Index("ix_ai_feedback_user_message", "user_id", "message_id"),
    )
