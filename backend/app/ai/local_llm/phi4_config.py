"""Configuration for the local Phi-4-mini Q4_K_M model."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


@dataclass
class Phi4Config:
    """Runtime configuration for the local Phi-4-mini GGUF model."""

    model_path: str
    n_gpu_layers: int
    n_ctx: int
    n_batch: int
    n_threads: int
    flash_attn: bool
    offload_kqv: bool
    timeout_seconds: int

    @classmethod
    def from_settings(cls) -> Phi4Config:
        """Build a configuration from application settings."""
        return cls(
            model_path=settings.local_llm_model_path,
            n_gpu_layers=settings.local_llm_n_gpu_layers,
            n_ctx=settings.local_llm_n_ctx,
            n_batch=settings.local_llm_n_batch,
            n_threads=settings.local_llm_threads,
            flash_attn=settings.local_llm_flash_attn,
            offload_kqv=settings.local_llm_offload_kqv,
            timeout_seconds=settings.local_llm_timeout_seconds,
        )

    def is_available(self) -> bool:
        """Return True when the local model is enabled and the file exists."""
        if not settings.local_llm_enabled:
            return False
        if not self.model_path:
            return False
        return Path(self.model_path).is_file()
