from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class PromptVersion:
    """A single version of a prompt template."""

    name: str
    version: str
    description: str
    content: str
    status: str = "active"  # active, draft, archived
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: dict[str, Any] = field(default_factory=dict)


class PromptVersionRegistry:
    """In-memory prompt version registry with basic CRUD."""

    def __init__(self) -> None:
        self._prompts: dict[str, list[PromptVersion]] = {}

    def register(self, prompt: PromptVersion) -> None:
        """Register a prompt version."""
        self._prompts.setdefault(prompt.name, []).append(prompt)

    def get(self, name: str, version: str | None = None) -> PromptVersion | None:
        """Return a prompt.  If version is omitted, return the active one."""
        versions = self._prompts.get(name, [])
        if not versions:
            return None
        if version:
            for p in versions:
                if p.version == version:
                    return p
            return None
        # Most recent active version, else latest.
        for p in reversed(versions):
            if p.status == "active":
                return p
        return versions[-1]

    def list(self, name: str | None = None) -> list[PromptVersion]:
        """List all registered versions, optionally filtered by name."""
        if name:
            return list(self._prompts.get(name, []))
        return [p for prompts in self._prompts.values() for p in prompts]

    def list_names(self) -> list[str]:
        """Return all prompt names."""
        return list(self._prompts.keys())
