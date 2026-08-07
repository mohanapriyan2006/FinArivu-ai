from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.engines.networth_engine import calculate_net_worth


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
        financial_context = context.get("financial_context", {})
        assets = financial_context.get("assets", []) if isinstance(financial_context, dict) else []
        liabilities = financial_context.get("liabilities", []) if isinstance(financial_context, dict) else []

        result = calculate_net_worth(assets, liabilities)

        summary = (
            f"Total assets: ₹{float(result.total_assets):,.0f}; "
            f"Total liabilities: ₹{float(result.total_liabilities):,.0f}; "
            f"Net worth: ₹{float(result.net_worth):,.0f}"
        )

        return AgentResult(
            agent_name=self.agent_name,
            data={
                "total_assets": float(result.total_assets),
                "total_liabilities": float(result.total_liabilities),
                "net_worth": float(result.net_worth),
                "asset_breakdown": {
                    k: float(v) for k, v in result.asset_breakdown.items()
                },
                "liability_breakdown": {
                    k: float(v) for k, v in result.liability_breakdown.items()
                },
                "asset_count": result.asset_count,
                "liability_count": result.liability_count,
            },
            summary=summary,
            confidence=1.0,
        )
