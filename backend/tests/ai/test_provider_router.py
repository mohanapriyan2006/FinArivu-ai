"""Tests for ProviderRouter task-type classification."""
from __future__ import annotations

from app.ai.providers.provider_router import ProviderRouter, TaskType


class TestTaskClassification:
    def _router(self) -> ProviderRouter:
        return ProviderRouter()

    def test_long_context_detected(self):
        router = self._router()
        long_msg = [{"role": "user", "content": "x" * 3500}]
        assert router._select_task_type(long_msg) == TaskType.LONG_CONTEXT

    def test_reasoning_detected(self):
        router = self._router()
        msg = [{"role": "user", "content": "Explain why I should save more"}]
        assert router._select_task_type(msg) == TaskType.REASONING

    def test_fast_detected(self):
        router = self._router()
        msg = [{"role": "user", "content": "Hi, quick budget check"}]
        assert router._select_task_type(msg) == TaskType.FAST

    def test_default_for_short_non_keyword(self):
        router = self._router()
        msg = [{"role": "user", "content": "Tell me about my finances"}]
        assert router._select_task_type(msg) == TaskType.DEFAULT
