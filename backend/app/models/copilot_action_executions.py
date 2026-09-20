from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CopilotActionExecution(Base):
    """Persistent state for a copilot-initiated financial action.

    One row per preview/execution — confirmation, staleness protection,
    idempotency, audit trail and safe undo all read from this record.
    Stores only what is needed; never full financial context, prompts,
    tokens or secrets.
    """

    __tablename__ = "copilot_action_executions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    operation: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="AWAITING_CONFIRMATION",
        index=True,
    )
    source: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="COPILOT",
    )
    entity_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    entity_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    reason: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
        default="",
    )
    request_payload: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    validated_payload: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    before_state: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    after_state: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    impact: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    affected_areas: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    state_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )
    undo_supported: Mapped[bool] = mapped_column(
        nullable=False,
        default=True,
    )
    requires_confirmation: Mapped[bool] = mapped_column(
        nullable=False,
        default=True,
    )
    error_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    undone_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        Index("ix_copilot_actions_user_created", "user_id", "created_at"),
        Index("ix_copilot_actions_user_status", "user_id", "status"),
    )
