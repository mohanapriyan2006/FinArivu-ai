"""Base class for all specialist agents.

Every agent follows the same lifecycle:
1. Receive the ``AgentState`` context.
2. Call the appropriate financial tool / engine.
3. Return an ``AgentResult`` with structured data and a short summary.
"""

from __future__ import annotations

import abc
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.schemas import AgentResult
from app.core.logger import logger
from app.exceptions import InsufficientDataError


class BaseSpecialistAgent(abc.ABC):
    """Abstract base for specialist copilot agents."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @property
    @abc.abstractmethod
    def agent_name(self) -> str:
        """Unique identifier for this agent (e.g. ``'BudgetAgent'``)."""

    @abc.abstractmethod
    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        """Run the agent's logic and return a structured result."""

    def _missing_data_result(self, exc: InsufficientDataError) -> AgentResult:
        """Convert an InsufficientDataError into an explicit missing-data result."""
        return AgentResult(
            agent_name=self.agent_name,
            data={
                "dataMissing": True,
                "missingFields": exc.missing_fields,
            },
            summary=exc.message,
            confidence=1.0,
        )

    async def safe_execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        """Execute with error handling — never raises."""
        try:
            return await self.execute(user_id, context)
        except InsufficientDataError as exc:
            return self._missing_data_result(exc)
        except Exception as exc:
            logger.error(
                "Agent %s failed for user %s: %s",
                self.agent_name,
                user_id,
                exc,
                exc_info=True,
            )
            return AgentResult(
                agent_name=self.agent_name,
                data={},
                summary=f"{self.agent_name} encountered an error.",
                confidence=0.0,
                error=str(exc),
            )
