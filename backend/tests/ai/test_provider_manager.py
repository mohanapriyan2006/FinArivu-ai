"""Tests for ProviderManager in-memory usage tracking."""
from __future__ import annotations

from app.ai.providers.provider_manager import ProviderManager


def test_record_and_summary():
    pm = ProviderManager(session=None)
    pm.record("gemini", "gemini-2.5-flash", latency_ms=200, tokens_input=100, tokens_output=50)
    pm.record("groq", "llama-3.3-70b", latency_ms=100, tokens_input=50, tokens_output=30, success=False)
    summary = pm.summary()
    assert summary["total"] == 2
    assert summary["success"] == 1
    assert summary["failures"] == 1
    assert "gemini" in summary["by_provider"]
    assert summary["by_provider"]["gemini"]["requests"] == 1
    assert summary["by_provider"]["gemini"]["tokens_input"] == 100


def test_record_with_fallback():
    pm = ProviderManager(session=None)
    pm.record("gemini", "gemini-2.5-flash", latency_ms=200, fallback=True)
    summary = pm.summary()
    assert summary["fallbacks"] == 1


def test_empty_summary():
    pm = ProviderManager(session=None)
    assert pm.summary() == {}


def test_save_to_db_noop():
    import uuid
    pm = ProviderManager(session=None)
    pm.record("gemini", "gemini-2.5-flash", latency_ms=200)
    # save_to_db is a no-op, should not raise
    import asyncio
    asyncio.run(pm.save_to_db(uuid.uuid4(), "session-1"))
