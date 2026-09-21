"""Copilot bridge for Money Radar.

A deterministic fast-path: when the user explicitly asks what needs
attention / what's unusual / what changed, the copilot runs the canonical
``MoneyRadarService.scan`` and returns a compact ``money_radar_card``
artifact. The LLM is never asked whether an insight exists — detection is
fully deterministic.
"""

from __future__ import annotations

import re
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.artifacts.schemas import Artifact, ArtifactType
from app.money_radar.service import MoneyRadarService
from app.money_radar.radar_types import InsightSeverity

# Conservative keyword matcher — fires only on explicit radar-style asks.
_RADAR_PATTERNS = [
    r"\bmoney\s*radar\b",
    r"\bfinancial\s+radar\b",
    r"\bradar\b",
    r"what\s+should\s+i\s+(be\s+)?worried",
    r"what\s+(needs|requires)\s+(my\s+)?attention",
    r"anything\s+(unusual|strange|off|wrong)",
    r"any\s+(unusual|suspicious)\s+(spending|activity|charges?)",
    r"(financial|money)\s+(risks?|alerts?|warnings?)",
    r"what\s+changed\s+(financially|in my finances|with my money)",
    r"(scan|check|analyse|analyze|review)\s+my\s+(finances|spending|money)",
    r"(spending|expense)\s+(spikes?|anomal|surges?)",
    r"(did|has)\s+my\s+(spending|savings|finances)\s+(get|gotten)\s+worse",
    r"where\s+am\s+i\s+(overspending|losing money)",
    r"\binsights?\b",
    r"what\s+am\s+i\s+missing",
]
_RADAR_RE = re.compile("|".join(_RADAR_PATTERNS), re.IGNORECASE)


def is_radar_request(message: str) -> bool:
    """True when the message explicitly asks for a radar-style scan."""
    return bool(_RADAR_RE.search(message or ""))


async def run_radar(
    session: AsyncSession, user_id: uuid.UUID
) -> tuple[str, dict]:
    """Run the scan and build (text, payload) for the copilot response."""
    service = MoneyRadarService(session)
    summary = await service.scan(user_id)

    artifact = Artifact(
        type=ArtifactType.MONEY_RADAR_CARD.value,
        title="Money Radar",
        content=summary.model_dump(mode="json"),
    )
    suggested_actions = [
        {
            "id": "open_money_radar",
            "label": "Open Money Radar",
            "type": "NAVIGATE",
            "route": "money_radar",
            "payload": {},
        }
    ]

    if summary.attention_count:
        text = (
            f"Money Radar found {summary.attention_count} thing(s) needing "
            f"attention and {summary.opportunity_count} opportunit"
            f"{'y' if summary.opportunity_count == 1 else 'ies'} — "
            "top items are on the card below."
        )
    elif summary.active_count:
        text = (
            f"Money Radar found {summary.active_count} insight(s) — mostly "
            "informational. Details are on the card below."
        )
    else:
        text = (
            "Money Radar found nothing that needs attention right now. "
            "Coverage details are on the card below."
        )

    return text, {
        "moneyRadar": summary.model_dump(mode="json"),
        "artifacts": [artifact.model_dump(mode="json", by_alias=True)],
        "suggestedActions": suggested_actions,
    }
