from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.schemas.orchestration import FinancialContext
from app.repositories.assets import AssetRepository
from app.repositories.budgets import BudgetRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.goals import GoalRepository
from app.repositories.income import IncomeRepository
from app.repositories.liabilities import LiabilityRepository
from app.repositories.profiles import ProfileRepository


class ContextBuilder:
    """Loads all required user data once and builds a FinancialContext.

    Agents must not query the database; they receive the FinancialContext
    built by this class.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profile_repo = ProfileRepository(session)
        self._income_repo = IncomeRepository(session)
        self._expense_repo = ExpenseRepository(session)
        self._budget_repo = BudgetRepository(session)
        self._goal_repo = GoalRepository(session)
        self._asset_repo = AssetRepository(session)
        self._liability_repo = LiabilityRepository(session)
        self._memory = ConversationMemory(session)

    async def build(self, user_id: uuid.UUID, session_id: str) -> FinancialContext:
        """Load the full financial context for a user and session."""
        profile = await self._load_profile(user_id)
        income = await self._income_repo.list_for_user(user_id, limit=100)
        expenses = await self._expense_repo.list_for_user(user_id, limit=100)
        budgets = await self._budget_repo.list_for_user(user_id, limit=100)
        goals = await self._goal_repo.list_for_user(user_id, limit=100)
        assets = await self._asset_repo.list_for_user(user_id, limit=100)
        liabilities = await self._liability_repo.list_for_user(user_id, limit=100)

        summary = await self._build_conversation_summary(user_id, session_id)

        return FinancialContext(
            profile=profile,
            income=[self._as_dict(i) for i in income],
            expenses=[self._as_dict(e) for e in expenses],
            budgets=[self._as_dict(b) for b in budgets],
            goals=[self._as_dict(g) for g in goals],
            assets=[self._as_dict(a) for a in assets],
            liabilities=[self._as_dict(l) for l in liabilities],
            health_score=await self._health_score(user_id),
            tax_regime=profile.get("tax_regime"),
            conversation_summary=summary,
            preferences=profile.get("preferences", {}),
        )

    async def _load_profile(self, user_id: uuid.UUID) -> dict[str, Any]:
        profile = await self._profile_repo.get_by_user_id(user_id)
        if not profile:
            return {"available": False}
        return {
            "available": True,
            "monthly_income": float(getattr(profile, "monthly_income", 0) or 0),
            "age": int(profile.age) if getattr(profile, "age", None) else None,
            "city": getattr(profile, "city", None),
            "tax_regime": getattr(profile, "tax_regime", None),
            "preferences": getattr(profile, "preferences", {}) or {},
        }

    async def _health_score(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Return latest health score snapshot if available."""
        from app.engines.health_score import FinancialHealthEngine

        # The engine expects an aggregated financial profile; we use an empty
        # calculation context for now. Specialist agents perform their own
        # precise calculations when needed.
        engine = FinancialHealthEngine()
        return engine.calculate({})

    async def _build_conversation_summary(self, user_id: uuid.UUID, session_id: str) -> str:
        """Generate a compact summary from recent messages."""
        messages = await self._memory.get_session_messages(user_id, session_id, limit=8)
        if not messages:
            return "No prior conversation in this session."

        lines = [f"{m.role}: {m.content[:120]}" for m in messages]
        return "\n".join(lines)

    @staticmethod
    def _as_dict(obj: Any) -> dict[str, Any]:
        """Convert an ORM row into a serialisable dict."""
        if obj is None:
            return {}
        if hasattr(obj, "__dict__"):
            data = {}
            for key, value in vars(obj).items():
                if key.startswith("_"):
                    continue
                if isinstance(value, uuid.UUID):
                    value = str(value)
                data[key] = value
            return data
        return dict(obj) if isinstance(obj, dict) else {}
