from __future__ import annotations

import asyncio
import time
from typing import Any

from app.core.config import settings


class InMemoryCache:
    """Simple async in-memory key/value cache with TTL support."""

    def __init__(self, default_ttl: int = settings.cache_ttl_seconds) -> None:
        self._store: dict[str, tuple[Any, float | None]] = {}
        self._default_ttl = default_ttl
        self._lock = asyncio.Lock()

    def _is_expired(self, key: str) -> bool:
        value, expire_at = self._store.get(key, (None, None))
        if expire_at is not None and time.monotonic() > expire_at:
            del self._store[key]
            return True
        return False

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            if key not in self._store:
                return None
            if self._is_expired(key):
                return None
            return self._store[key][0]

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        expire_at = time.monotonic() + (ttl if ttl is not None else self._default_ttl)
        async with self._lock:
            self._store[key] = (value, expire_at)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()

    async def get_or_set(self, key: str, factory: Any, ttl: int | None = None) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached
        value = await factory() if asyncio.iscoroutine(factory) else factory()
        await self.set(key, value, ttl)
        return value


# Global cache instance. This will be replaced with Redis in a future phase.
cache: InMemoryCache = InMemoryCache()
