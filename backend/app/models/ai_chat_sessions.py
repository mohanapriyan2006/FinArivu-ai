"""SQLAlchemy model for copilot chat sessions.

Each session represents one saved copilot conversation. It is created
lazily on the first persisted message for a (user_id, session_id) pair.
Soft-deleted sessions remain in the table for audit purposes but are
filtered from the active history list.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AIChatSession(Base):
    """A saved copilot chat session."""

    __tablename__ = "ai_chat_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    session_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_ai_chat_sessions_user_session", "user_id", "session_id"),
        Index("ix_ai_chat_sessions_is_deleted", "is_deleted"),
    )

    def soft_delete(self) -> None:
        """Mark the session as soft-deleted and set the deleted flag."""
        super().soft_delete()
        self.is_deleted = True
