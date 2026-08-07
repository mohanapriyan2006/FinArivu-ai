"""User context loader for injecting financial profile data into LLM prompts.

Gathers the user's profile, income, and a financial summary so the AI
planner and explanation layer have relevant context.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.profiles import ProfileRepository
from app.repositories.income import IncomeRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.goals import GoalRepository
from app.repositories.assets import AssetRepository
from app.repositories.liabilities import LiabilityRepository


class UserContextLoader:
    """Loads and formats user financial context for LLM consumption."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profile_repo = ProfileRepository(session)
        self._income_repo = IncomeRepository(session)
        self._expense_repo = ExpenseRepository(session)
        self._goal_repo = GoalRepository(session)
        self._asset_repo = AssetRepository(session)
        self._liability_repo = LiabilityRepository(session)

    async def load_profile(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Return basic profile data as a dict."""
        profile = await self._profile_repo.get_by_user_id(user_id)
        if not profile:
            return {"available": False}

        return {
            "available": True,
            "monthly_income": float(profile.monthly_income or 0),
            "age": int(profile.age) if profile.age else None,
            "city": getattr(profile, "city", None),
        }

    async def load_financial_summary(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Return an aggregated financial snapshot for context injection."""
        goals = await self._goal_repo.list_for_user(user_id, limit=100)
        assets = await self._asset_repo.list_for_user(user_id, limit=100)
        liabilities = await self._liability_repo.list_for_user(user_id, limit=100)

        total_assets = sum(float(a.value) for a in assets)
        total_liabilities = sum(float(l.amount) for l in liabilities)
        active_goals = len([g for g in goals if g.target_amount > g.current_amount])

        return {
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth": total_assets - total_liabilities,
            "active_goals": active_goals,
            "total_goals": len(goals),
        }

    async def build_context_prompt(self, user_id: uuid.UUID) -> str:
        """Build a plain-text context block for LLM prompt injection."""
        profile = await self.load_profile(user_id)
        summary = await self.load_financial_summary(user_id)

        if not profile.get("available"):
            return "User profile not yet set up."

        lines = [
            f"Monthly Income: ₹{profile['monthly_income']:,.0f}",
        ]
        if profile.get("age"):
            lines.append(f"Age: {profile['age']}")
        if profile.get("city"):
            lines.append(f"City: {profile['city']}")

        lines.extend([
            f"Net Worth: ₹{summary['net_worth']:,.0f}",
            f"Active Goals: {summary['active_goals']}/{summary['total_goals']}",
        ])

        return "\n".join(lines)
