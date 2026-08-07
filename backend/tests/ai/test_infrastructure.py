import pytest

from app.ai.cache.memory_cache import MemoryCache
from app.ai.memory.session_memory import SessionMemory
from app.ai.prompt.prompt_builder import PromptBuilder
from app.ai.validator.json_validator import JSONValidator
from app.ai.validator.response_validator import ResponseValidator
from app.financial.artifacts.artifact_builder import ArtifactBuilder


def test_json_validator_parses_json():
    valid, data, error = JSONValidator.validate('{"a": 1}')
    assert valid is True
    assert data == {"a": 1}
    assert error == ""


def test_json_validator_rejects_invalid():
    valid, data, error = JSONValidator.validate("not json")
    assert valid is False
    assert data is None
    assert "invalid JSON" in error


def test_json_validator_strips_code_fences():
    valid, data, _ = JSONValidator.validate("```json\\n{\"a\": 1}\\n```")
    assert valid is True
    assert data == {"a": 1}


def test_response_validator_rejects_empty():
    valid, reason = ResponseValidator().validate("")
    assert valid is False
    assert "empty" in reason


def test_response_validator_rejects_unsafe():
    valid, reason = ResponseValidator().validate("Buy this stock now for guaranteed profit!")
    assert valid is False
    assert "unsafe" in reason


def test_memory_cache_ttl():
    cache = MemoryCache(default_ttl=1)
    cache.set("k", "v")
    assert cache.get("k") == "v"
    import time
    time.sleep(1.1)
    assert cache.get("k") is None


def test_session_memory_updates_and_clears():
    sm = SessionMemory()
    sm.update("s1", topic="budget", current_goal="save", follow_ups=["q1"])
    state = sm.get("s1")
    assert state["topic"] == "budget"
    sm.clear("s1")
    state = sm.get("s1")  # cleared state uses defaultdict default
    assert state["topic"] == "general"


def test_prompt_builder_returns_messages():
    messages = PromptBuilder.build(
        agent_name="BudgetAgent",
        user_message="How is my budget?",
        financial_context={"budget": 1000},
    )
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"


def test_artifact_builder_maps_agent_names():
    artifact = ArtifactBuilder.from_agent_data("BudgetAgent", {"total_spent": 100})
    assert artifact.type == "budget_card"
    assert artifact.title == "Budget"
    assert artifact.content["total_spent"] == 100
