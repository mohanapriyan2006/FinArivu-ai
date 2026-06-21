"""Profile model."""

import uuid

from decimal import Decimal
from sqlalchemy import String, Integer, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    """User profile with personal and financial details."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str] = mapped_column(String(100), nullable=True)
    monthly_income: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    retirement_age: Mapped[int] = mapped_column(Integer, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")

    __table_args__ = (
        Index("ix_profiles_user_id", "user_id"),
    )
