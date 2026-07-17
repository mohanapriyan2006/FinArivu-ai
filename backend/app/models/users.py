from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import USER_ROLES, UserRole
from app.models.base import Base


class User(Base):
    """Application user mapped from an external identity provider."""

    __tablename__ = "users"

    clerk_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        String(50),
        default=UserRole.USER.value,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    preferences: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        default=dict,
    )

    profile: Mapped["Profile"] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    incomes: Mapped[list["Income"]] = relationship(
        "Income",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    assets: Mapped[list["Asset"]] = relationship(
        "Asset",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    liabilities: Mapped[list["Liability"]] = relationship(
        "Liability",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint(f"role IN {USER_ROLES}", name="chk_user_role"),
    )
