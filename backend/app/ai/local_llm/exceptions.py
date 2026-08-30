"""Typed errors for the local Phi-4 provider."""

from __future__ import annotations


class LocalLLMUnavailableError(Exception):
    """Raised when the local model is not enabled, missing, or fails to load."""


class LocalLLMInferenceError(Exception):
    """Raised when the local model fails during chat or streaming."""
