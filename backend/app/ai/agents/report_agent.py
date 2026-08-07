"""Report specialist agent — summarises weekly/monthly reports."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.services.reports import ReportService


class ReportAgent(BaseSpecialistAgent):
    """Generates a summary of the user's latest financial report."""

    @property
    def agent_name(self) -> str:
        return "ReportAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        report_service = ReportService(self._session)
        report = await report_service.generate_weekly_report(user_id)
        report_data = report.model_dump() if hasattr(report, "model_dump") else {}

        return AgentResult(
            agent_name=self.agent_name,
            data=report_data,
            summary="Weekly financial report generated.",
            confidence=1.0,
        )
