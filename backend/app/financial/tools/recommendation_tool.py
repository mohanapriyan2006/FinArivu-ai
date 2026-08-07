from __future__ import annotations

from typing import Any

from app.financial.engines.recommendation_engine import RecommendationEngine


async def get_recommendations(engine_outputs: dict[str, Any]) -> dict:
    """Return a serialisable recommendation set from engine outputs."""
    result = RecommendationEngine.generate(engine_outputs)
    return result.model_dump()
