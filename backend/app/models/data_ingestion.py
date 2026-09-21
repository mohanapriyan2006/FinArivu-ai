"""Phase 5 persistence — import batches and review candidates.

``ImportBatch`` owns the document lifecycle; ``ImportCandidate`` owns
each proposed change (field update, new entity, bank transaction).
Extraction never touches financial tables — candidates are the only
write path, and only the commit layer applies them.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Date,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ImportBatch(Base):
    """One uploaded document, end to end.

    ``content_hash`` dedups identical files per user; ``confirm_token``
    rotates on every candidate edit so confirmations always apply to the
    exact version the user reviewed (idempotency + stale-preview guard).
    """

    __tablename__ = "import_batches"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type: Mapped[str] = mapped_column(String(40), nullable=False)
    source_name: Mapped[str] = mapped_column(
        String(60), nullable=False, default="upload"
    )  # upload | copilot
    file_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    content_hash: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(
        String(40), nullable=False, default="UPLOADED", index=True
    )
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    confirm_token: Mapped[str] = mapped_column(
        String(64), nullable=False, default=""
    )
    summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    result: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    error_code: Mapped[str | None] = mapped_column(String(60), nullable=True)
    data_quality: Mapped[str] = mapped_column(
        String(30), nullable=False, default="AVAILABLE"
    )
    ingestion_version: Mapped[str] = mapped_column(
        String(40), nullable=False, default="ingestion_v1"
    )
    extracted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "content_hash", name="uq_import_batch_user_hash"
        ),
        Index("ix_import_batches_user_status", "user_id", "status"),
        Index("ix_import_batches_user_created", "user_id", "created_at"),
    )


class ImportCandidate(Base):
    """One proposed change awaiting user review.

    ``proposed_payload`` is the normalized value(s); ``edited_value`` is
    the user's override (commit prefers it). ``decision`` is the review
    verdict — SKIPPED candidates are never applied.
    """

    __tablename__ = "import_candidates"

    batch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("import_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    target_domain: Mapped[str] = mapped_column(String(40), nullable=False)
    target_entity: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    operation: Mapped[str] = mapped_column(String(20), nullable=False)
    field_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    label: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    current_value: Mapped[dict | list | str | None] = mapped_column(
        JSON, nullable=True
    )
    proposed_value: Mapped[dict | list | str | None] = mapped_column(
        JSON, nullable=True
    )
    proposed_payload: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
    edited_value: Mapped[dict | list | str | None] = mapped_column(
        JSON, nullable=True
    )
    matched_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )  # UPDATE target
    validation_state: Mapped[str] = mapped_column(
        String(30), nullable=False, default="VALID"
    )
    confidence: Mapped[str] = mapped_column(
        String(20), nullable=False, default="MEDIUM"
    )
    decision: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACCEPTED"
    )
    fingerprint: Mapped[str | None] = mapped_column(
        String(80), nullable=True, index=True
    )
    provenance: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    warnings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    seq: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    applied_entity_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_import_candidates_batch_status", "batch_id", "validation_state"),
        Index("ix_import_candidates_user_fp", "user_id", "fingerprint"),
    )
