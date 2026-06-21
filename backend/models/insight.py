"""Insight model."""

import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class Insight(Base, TimestampMixin):
    """Stores generated financial insights."""

    __tablename__ = "insights"

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
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="insights")

    __table_args__ = (
        Index("ix_insights_user_id", "user_id"),
        Index("ix_insights_priority", "priority"),
        Index("ix_insights_is_read", "is_read"),
    )
