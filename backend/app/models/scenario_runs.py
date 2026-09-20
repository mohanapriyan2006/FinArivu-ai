from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ScenarioRun(Base):
    """A saved Scenario Lab simulation.

    Stores inputs, assumptions, and the result snapshot at run time — enough
    to inspect or re-run the scenario, never secrets or full financial
    context. ``engine_version`` keeps historical results interpretable if
    the deterministic engine evolves.
    """

    __tablename__ = "scenario_runs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    scenario_type: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    status: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="COMPUTED",
    )
    headline: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default="",
    )
    input_payload: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    assumptions: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    baseline_snapshot: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    result_snapshot: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    affected_domains: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    engine_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="scenario_engine_v1",
    )
    simulated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        Index("ix_scenario_runs_user_created", "user_id", "created_at"),
        Index("ix_scenario_runs_user_type", "user_id", "scenario_type"),
    )
