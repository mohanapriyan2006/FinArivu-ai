from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RadarInsight(Base):
    """A persisted Money Radar insight for one user.

    ``fingerprint`` deduplicates scans: it encodes user + insight type +
    entity + detector version + a quantized state key, so the same
    condition updates the same row while a materially changed condition
    produces a new instance. ``state_signature`` records the dominant
    metric bucket so dismissed insights only resurface on real change.

    Only evidence payloads are stored — never the full financial context.
    """

    __tablename__ = "money_radar_insights"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    insight_type: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="ACTIVE",
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="INFO",
    )
    category: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    entity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    evidence: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    impact: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    explanation: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    actions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    source: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    data_quality: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="AVAILABLE",
    )
    freshness: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    fingerprint: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
    )
    state_signature: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        default="",
    )
    detector_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="money_radar_v1",
    )
    seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    dismissed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint("user_id", "fingerprint", name="uq_radar_insight_user_fp"),
        Index("ix_radar_insights_user_status", "user_id", "status"),
        Index("ix_radar_insights_user_severity", "user_id", "severity"),
        Index("ix_radar_insights_user_created", "user_id", "created_at"),
    )


class RadarScanState(Base):
    """Latest radar scan snapshot per user — powers GET /summary without
    re-running detectors. One row per user, upserted on each scan."""

    __tablename__ = "money_radar_scans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    coverage: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    counts: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    radar_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="money_radar_v1",
    )
