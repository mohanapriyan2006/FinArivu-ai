from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class FinancialActionPlan(Base):
    """One active financial plan per user per period.

    The plan is a deterministic organisation of Money Radar signals — a
    container, not a computation. Regeneration reuses the same row for the
    current period (``period_key`` unique per user) and reconciles items
    rather than rebuilding the plan.
    """

    __tablename__ = "financial_action_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # "YYYY-Www" ISO week key — one active plan per user per period.
    period_key: Mapped[str] = mapped_column(String(10), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE"
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    generation_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    counts: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    plan_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="action_plan_v1"
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "period_key", name="uq_plan_user_period"
        ),
        Index("ix_plans_user_status", "user_id", "status"),
        Index("ix_plans_user_period_start", "user_id", "period_start"),
    )


class FinancialPlanItem(Base):
    """A single recommended action inside a FinancialActionPlan.

    ``fingerprint`` = user + source + category + entity + state signature —
    regeneration dedups onto the same row. ``dismissed_signature`` records
    what the user dismissed so anti-noise policy can suppress identical
    re-suggestions without mutating the source Radar insight.
    """

    __tablename__ = "financial_action_plan_items"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("financial_action_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fingerprint: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="LOW"
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING"
    )
    score: Mapped[float] = mapped_column(nullable=False, default=0.0)

    source_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SYSTEM"
    )
    source_insight_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("money_radar_insights.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_insight_type: Mapped[str | None] = mapped_column(
        String(60), nullable=True
    )
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_name: Mapped[str] = mapped_column(
        String(255), nullable=False, default=""
    )

    evidence: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    impact: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    why: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    actions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    route: Mapped[str | None] = mapped_column(String(60), nullable=True)
    scenario_preset: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    action_preset: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    due_window: Mapped[str | None] = mapped_column(String(20), nullable=True)
    data_quality: Mapped[str] = mapped_column(
        String(30), nullable=False, default="AVAILABLE"
    )
    freshness: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    state_signature: Mapped[str] = mapped_column(
        String(80), nullable=False, default=""
    )

    completion_source: Mapped[str | None] = mapped_column(
        String(40), nullable=True
    )
    linked_action_execution_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )
    linked_scenario_run_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )
    dismissed_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    snoozed_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    dismissed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "fingerprint", name="uq_plan_item_user_fp"
        ),
        Index("ix_plan_items_plan_status", "plan_id", "status"),
        Index("ix_plan_items_user_status", "user_id", "status"),
        Index("ix_plan_items_snooze", "status", "snoozed_until"),
        Index(
            "ix_plan_items_source", "user_id", "source_insight_id"
        ),
    )
