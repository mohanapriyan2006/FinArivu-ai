"""Financial Health Score model."""

import uuid

from sqlalchemy import ForeignKey, Index, Integer, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class FinancialHealthScore(Base, TimestampMixin):
    """Stores historical financial health scores."""

    __tablename__ = "financial_health_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    grade: Mapped[str] = mapped_column(String(20), nullable=False)
    savings_score: Mapped[int] = mapped_column(Integer, nullable=False)
    emergency_score: Mapped[int] = mapped_column(Integer, nullable=False)
    debt_score: Mapped[int] = mapped_column(Integer, nullable=False)
    goal_score: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_score: Mapped[int] = mapped_column(Integer, nullable=False)
    component_scores: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    insights: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="health_scores")

    __table_args__ = (
        Index("ix_financial_health_scores_user_id", "user_id"),
        Index("ix_financial_health_scores_created_at", "created_at"),
    )
