"""Deterministic fingerprints for dedup — files and transactions.

Two levels:

* ``content_hash`` — sha256 of file bytes: identical uploads are caught
  before any processing (DUPLICATE_IMPORT).
* ``transaction_fingerprint`` — per-row sha256 over the strongest
  available identifiers (reference → normalized description), so the
  same statement row can never be inserted twice.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from typing import Any


def content_hash(content: bytes) -> str:
    """SHA-256 of raw file bytes — duplicate-import detection."""
    return hashlib.sha256(content).hexdigest()


def text_hash(text: str) -> str:
    """SHA-256 of normalized text — used for copilot/text-path imports."""
    normalized = " ".join(text.split()).strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def normalize_description(description: str) -> str:
    """Aggressive normalization for description matching."""
    text = unicodedata.normalize("NFKD", description or "")
    text = text.lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    # Drop volatile tokens — utr/ref numbers and dates vary between exports.
    text = re.sub(r"\b\d{4,}\b", " ", text)
    return " ".join(text.split())


def transaction_fingerprint(user_id: Any, payload: dict[str, Any]) -> str:
    """Strongest-identifier-first fingerprint for one transaction."""
    reference = (payload.get("reference") or "").strip()
    key_parts = [
        str(user_id),
        str(payload.get("date", "")),
        str(payload.get("direction", "")),
        str(payload.get("amount", "")),
    ]
    if reference:
        key_parts.append(f"ref:{reference}")
    else:
        key_parts.append(f"desc:{normalize_description(payload.get('description', ''))}")
    return hashlib.sha256("|".join(key_parts).encode()).hexdigest()[:40]


def description_similarity(a: str, b: str) -> float:
    """Cheap token-overlap similarity (0–1) for POSSIBLE_DUPLICATE hints."""
    ta = set(normalize_description(a).split())
    tb = set(normalize_description(b).split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)
