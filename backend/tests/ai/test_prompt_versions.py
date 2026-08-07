"""Tests for PromptVersionRegistry prompt versioning."""
from __future__ import annotations

from app.ai.prompt.prompt_versions import PromptVersion, PromptVersionRegistry


def test_register_and_get():
    registry = PromptVersionRegistry()
    v1 = PromptVersion(name="copilot", version="1.0", description="v1", content="Hello")
    registry.register(v1)
    fetched = registry.get("copilot")
    assert fetched is not None
    assert fetched.version == "1.0"
    assert fetched.content == "Hello"


def test_get_specific_version():
    registry = PromptVersionRegistry()
    v1 = PromptVersion(name="copilot", version="1.0", description="v1", content="Hello")
    v2 = PromptVersion(name="copilot", version="2.0", description="v2", content="Hi there")
    registry.register(v1)
    registry.register(v2)
    fetched = registry.get("copilot", version="1.0")
    assert fetched is not None
    assert fetched.content == "Hello"


def test_get_returns_active_version():
    registry = PromptVersionRegistry()
    v1 = PromptVersion(name="copilot", version="1.0", description="v1", content="Hello", status="archived")
    v2 = PromptVersion(name="copilot", version="2.0", description="v2", content="Hi there", status="active")
    registry.register(v1)
    registry.register(v2)
    fetched = registry.get("copilot")
    assert fetched is not None
    assert fetched.version == "2.0"


def test_list_all():
    registry = PromptVersionRegistry()
    registry.register(PromptVersion(name="a", version="1", description="", content="A"))
    registry.register(PromptVersion(name="b", version="1", description="", content="B"))
    all_prompts = registry.list()
    assert len(all_prompts) == 2


def test_list_by_name():
    registry = PromptVersionRegistry()
    registry.register(PromptVersion(name="a", version="1", description="", content="A1"))
    registry.register(PromptVersion(name="a", version="2", description="", content="A2"))
    registry.register(PromptVersion(name="b", version="1", description="", content="B"))
    a_prompts = registry.list("a")
    assert len(a_prompts) == 2


def test_list_names():
    registry = PromptVersionRegistry()
    registry.register(PromptVersion(name="a", version="1", description="", content="A"))
    registry.register(PromptVersion(name="b", version="1", description="", content="B"))
    names = registry.list_names()
    assert "a" in names
    assert "b" in names


def test_get_nonexistent_returns_none():
    registry = PromptVersionRegistry()
    assert registry.get("nonexistent") is None
