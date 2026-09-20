from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_net_worth


class NetWorthAgent(BaseSpecialistAgent):
    """Calculates net worth using the deterministic NetWorthEngine."""

    @property
    def agent_name(self) -> str:
        return "NetWorthAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_net_worth(self._session, user_id)

        total_assets = float(data.get("totalAssets", 0))
        total_liabilities = float(data.get("totalLiabilities", 0))
        net_worth = float(data.get("netWorth", 0))

        summary = (
            f"Total assets: ₹{total_assets:,.0f}; "
            f"Total liabilities: ₹{total_liabilities:,.0f}; "
            f"Net worth: ₹{net_worth:,.0f}"
        )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=summary,
            confidence=1.0,
        )
