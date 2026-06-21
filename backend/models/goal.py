"""Goal model."""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Numeric, String, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class Goal(Base, TimestampMixin):
    """Goal planning model."""

    __tablename__ = "goals"

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
    goal_name: Mapped[str] = mapped_column(String(100), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    current_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0"),
    )
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Active")

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="goals")

    __table_args__ = (
        Index("ix_goals_user_id", "user_id"),
        Index("ix_goals_status", "status"),
        Index("ix_goals_target_date", "target_date"),
    )
