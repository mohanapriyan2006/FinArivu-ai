"""Tax specialist agent — regime comparison and deduction analysis."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_tax_comparison


class TaxAgent(BaseSpecialistAgent):
    """Compares old vs new tax regimes using the deterministic TaxEngine."""

    @property
    def agent_name(self) -> str:
        return "TaxAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_tax_comparison(self._session, user_id)

        better = data.get("better_regime", "new")
        savings = data.get("savings", 0)

        summary = (
            f"The {better} tax regime results in lower tax. "
            f"Potential savings: ₹{float(savings):,.0f}."
        )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=summary,
            confidence=1.0,
        )
