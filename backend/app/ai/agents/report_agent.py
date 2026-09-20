"""Report specialist agent — summarises weekly/monthly reports."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_report


class ReportAgent(BaseSpecialistAgent):
    """Generates a summary of the user's financial report.

    Uses the read-only report engine — the copilot chat path must never
    persist rows, so this does not call ``ReportService``.
    """

    @property
    def agent_name(self) -> str:
        return "ReportAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        report_data = await get_report(self._session, user_id, period="weekly")

        return AgentResult(
            agent_name=self.agent_name,
            data=report_data,
            summary="Weekly financial report generated.",
            confidence=1.0,
        )
