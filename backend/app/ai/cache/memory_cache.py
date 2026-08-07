from __future__ import annotations

import time
from collections import OrderedDict
from typing import Any


class MemoryCache:
    """In-memory TTL cache for prompts, responses, and intermediate results.

    No external dependencies.  Stores up to ``max_size`` entries and removes
    expired items on every access.
    """

    def __init__(self, max_size: int = 100, default_ttl: int = 600) -> None:
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()

    def get(self, key: str) -> Any | None:
        """Return a cached value or ``None`` if missing/expired."""
        self._expire()
        if key not in self._store:
            return None
        value, expires_at = self._store[key]
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        self._store.move_to_end(key)
        return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Store a value with an optional TTL."""
        ttl = ttl or self._default_ttl
        expires_at = time.monotonic() + ttl
        if key in self._store:
            del self._store[key]
        self._store[key] = (value, expires_at)
        self._store.move_to_end(key)
        self._enforce_size()

    def delete(self, key: str) -> None:
        """Delete a key if present."""
        self._store.pop(key, None)

    def clear(self) -> None:
        """Clear the cache."""
        self._store.clear()

    def _expire(self) -> None:
        """Remove all expired items."""
        now = time.monotonic()
        expired = [k for k, (_, expires_at) in self._store.items() if now > expires_at]
        for key in expired:
            del self._store[key]

    def _enforce_size(self) -> None:
        """Evict oldest items when the cache is over capacity."""
        while len(self._store) > self._max_size:
            self._store.popitem(last=False)
