from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Profile(Base):
    """Extended user profile with demographic and financial information."""

    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pan: Mapped[str | None] = mapped_column(String(50), nullable=True)
    monthly_income: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
        default=None,
    )
    retirement_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_profile: Mapped[str | None] = mapped_column(String(50), nullable=True)
    investment_experience: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_profile_user_id"),
        Index("ix_profiles_user_id", "user_id"),
    )
