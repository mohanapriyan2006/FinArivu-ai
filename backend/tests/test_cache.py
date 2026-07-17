import asyncio

import pytest

from app.core.cache import InMemoryCache, cache


async def test_cache_set_get():
    c = InMemoryCache()
    await c.set("key", "value")
    assert await c.get("key") == "value"


async def test_cache_missing_returns_none():
    c = InMemoryCache()
    assert await c.get("missing") is None


async def test_cache_ttl_expiry():
    c = InMemoryCache(default_ttl=0.05)
    await c.set("key", "value")
    assert await c.get("key") == "value"
    await asyncio.sleep(0.1)
    assert await c.get("key") is None


async def test_cache_delete_and_clear():
    c = InMemoryCache()
    await c.set("a", 1)
    await c.set("b", 2)
    await c.delete("a")
    assert await c.get("a") is None
    assert await c.get("b") == 2

    await c.clear()
    assert await c.get("b") is None


async def test_cache_get_or_set():
    c = InMemoryCache()
    value = await c.get_or_set("key", lambda: "computed")
    assert value == "computed"
    assert await c.get_or_set("key", lambda: "other") == "computed"


async def test_global_cache_instance():
    await cache.set("g", 42)
    assert await cache.get("g") == 42
    await cache.clear()
    assert await cache.get("g") is None
