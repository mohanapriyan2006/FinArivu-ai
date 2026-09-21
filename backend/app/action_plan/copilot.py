"""Copilot bridge for the Financial Action Plan.

Deterministic fast-path: when the user asks what to focus on / what to do
this week, the copilot generates (or refreshes) the canonical plan and
returns a compact ``financial_action_plan_card`` artifact. The LLM never
picks priorities — the plan comes straight from ``FinancialActionPlanService``.
"""

from __future__ import annotations

import re
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.artifacts.schemas import Artifact, ArtifactType
from app.action_plan.service import FinancialActionPlanService

# Conservative matcher — explicit "what should I do / focus on" asks.
_PLAN_PATTERNS = [
    r"\b(action|financial)\s+plan\b",
    r"what\s+should\s+i\s+(focus|work|do|prioritise|prioritize)",
    r"what\s+(are|is)\s+my\s+(top\s+)?(financial\s+)?(priorit|focus)",
    r"(show|open|give)\s+me\s+my\s+(financial\s+)?plan\b",
    r"what\s+do\s+i\s+need\s+to\s+(take care of|do|handle)",
    r"what\s+needs?\s+(to be )?done\b",
    r"my\s+(financial\s+)?priorities\b",
    r"what'?s\s+on\s+my\s+plate",
    r"next\s+steps?\s+(for|on)\s+my\s+(finances|money)",
]
_PLAN_RE = re.compile("|".join(_PLAN_PATTERNS), re.IGNORECASE)


def is_plan_request(message: str) -> bool:
    """True when the message explicitly asks for the action plan."""
    return bool(_PLAN_RE.search(message or ""))


async def run_plan(
    session: AsyncSession, user_id: uuid.UUID
) -> tuple[str, dict]:
    """Generate/reconcile the plan and build (text, payload)."""
    service = FinancialActionPlanService(session)
    plan = await service.get_or_generate_current(user_id, force_rescan=True)

    artifact = Artifact(
        type=ArtifactType.FINANCIAL_ACTION_PLAN_CARD.value,
        title="My Financial Plan",
        content=plan.model_dump(mode="json"),
    )
    suggested_actions = [
        {
            "id": "open_action_plan",
            "label": "Open Financial Plan",
            "type": "NAVIGATE",
            "route": "action_plan",
            "payload": {},
        }
    ]

    active = [
        i
        for i in plan.items
        if i.status.value in ("PENDING", "IN_PROGRESS")
    ]
    if not active:
        text = (
            "You're on track — no high-priority financial actions right now. "
            "Check Money Radar for new signals."
        )
    else:
        lines = [
            f"{i + 1}. {item.title} ({item.priority.value.lower()} priority)"
            for i, item in enumerate(active[:3])
        ]
        text = (
            f"You have {len(active)} active priorit"
            f"{'y' if len(active) == 1 else 'ies'} this week:\n"
            + "\n".join(lines)
        )

    return text, {
        "actionPlan": plan.model_dump(mode="json"),
        "artifacts": [artifact.model_dump(mode="json", by_alias=True)],
        "suggestedActions": suggested_actions,
    }
