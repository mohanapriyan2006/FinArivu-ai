"""Lightweight health checks for the local Phi-4 model."""

from __future__ import annotations

from app.ai.local_llm.phi4_config import Phi4Config


def check_local_llm_health(config: Phi4Config | None = None) -> bool:
    """Return True if the local model file is present and enabled.

    This is a cheap check and does not load the model.  The full
    ``Phi4Provider.health`` method performs a one-token inference test
    when the model has already been loaded.
    """
    cfg = config or Phi4Config.from_settings()
    return cfg.is_available()
