"""SQLAlchemy model for individual AI copilot messages.

Stores every user ↔ assistant exchange with provider metadata, token counts,
latency, and the agent chain that contributed to the response.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AIMessage(Base):
    """Individual message within a copilot conversation."""

    __tablename__ = "ai_messages"

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
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    intent: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    tokens_input: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    tokens_output: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    latency_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    agent_chain: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    blocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    block_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_ai_messages_user_session", "user_id", "session_id"),
        Index("ix_ai_messages_created_at", "created_at"),
        Index("ix_ai_messages_intent", "intent"),
    )
