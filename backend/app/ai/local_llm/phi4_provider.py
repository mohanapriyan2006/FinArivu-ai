"""Local Phi-4-mini Q4_K_M provider using llama-cpp-python."""

from __future__ import annotations

import asyncio
import time
from typing import Any, AsyncIterator

from app.ai.local_llm.exceptions import LocalLLMInferenceError, LocalLLMUnavailableError
from app.ai.local_llm.phi4_config import Phi4Config
from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.core.logger import logger


class Phi4Provider(BaseAIProvider):
    """OpenAI-compatible provider backed by a local llama.cpp GGUF model.

    The model is lazy-loaded on first use and runs in a thread-pool executor
    so that the main async event loop is not blocked during inference.
    """

    def __init__(self, config: Phi4Config | None = None) -> None:
        self._config = config or Phi4Config.from_settings()
        self._llama: Any | None = None
        self._lock = asyncio.Lock()
        if not self._config.is_available():
            logger.warning(
                "Local Phi-4 not available: enabled=%s, path=%s",
                self._config.is_available(),
                self._config.model_path,
            )

    @property
    def name(self) -> str:
        return "local-phi4"

    @property
    def model_name(self) -> str:
        return "Phinance-Phi-4-mini-Q4_K_M"

    def _load_model(self) -> Any:
        """Lazy-load the GGUF model and cache it."""
        if self._llama is not None:
            return self._llama

        try:
            from llama_cpp import Llama
        except ImportError as exc:
            raise LocalLLMUnavailableError("llama-cpp-python is not installed") from exc

        if not self._config.is_available():
            raise LocalLLMUnavailableError(
                f"Local Phi-4 model not found at {self._config.model_path}"
            )

        kwargs: dict[str, Any] = {
            "model_path": self._config.model_path,
            "n_gpu_layers": self._config.n_gpu_layers,
            "n_ctx": self._config.n_ctx,
            "n_batch": self._config.n_batch,
            "n_threads": self._config.n_threads,
            "verbose": False,
        }
        if self._config.flash_attn:
            kwargs["flash_attn"] = True
        if self._config.offload_kqv:
            kwargs["offload_kqv"] = True

        try:
            self._llama = Llama(**kwargs)
        except TypeError:
            # The installed llama-cpp-python may not support every kwarg;
            # fall back to the common subset.
            for key in ("flash_attn", "offload_kqv"):
                if key in kwargs:
                    logger.warning("llama_cpp does not support %s, retrying without it", key)
                    del kwargs[key]
            try:
                self._llama = Llama(**kwargs)
            except Exception as exc:
                raise LocalLLMUnavailableError(f"Failed to load local Phi-4: {exc}") from exc
        except Exception as exc:
            raise LocalLLMUnavailableError(f"Failed to load local Phi-4: {exc}") from exc

        logger.info("Loaded local Phi-4 from %s", self._config.model_path)
        return self._llama

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        """Generate a full chat completion from the local model."""
        start = time.perf_counter()
        loop = asyncio.get_running_loop()

        try:
            async with self._lock:
                llama = await loop.run_in_executor(None, self._load_model)

            def _call() -> Any:
                return llama.create_chat_completion(
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stop=["<|end|>", "<|endoftext|>", "oscopy"],
                )

            async with self._lock:
                raw = await loop.run_in_executor(None, _call)
        except LocalLLMUnavailableError:
            raise
        except Exception as exc:
            logger.exception("Local Phi-4 chat failed")
            raise LocalLLMInferenceError(str(exc)) from exc

        content = ""
        tokens_input = 0
        tokens_output = 0
        if raw and isinstance(raw, dict):
            choice = raw.get("choices", [{}])[0]
            message = choice.get("message", {})
            content = message.get("content", "") or ""
            usage = raw.get("usage") or {}
            tokens_input = usage.get("prompt_tokens", 0) or 0
            tokens_output = usage.get("completion_tokens", 0) or 0

        return AIProviderResponse(
            content=content,
            provider_name=self.name,
            model=self.model_name,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            latency_ms=self._elapsed_ms(start),
            raw=raw if isinstance(raw, dict) else {},
        )

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Stream a pre-generated response in small chunks.

        The local model is not intended for long-form streaming; this method
        exists only to satisfy the provider interface and returns the full
        output in a few chunks.
        """
        response = await self.chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        chunk_size = 4
        for i in range(0, len(response.content), chunk_size):
            yield response.content[i : i + chunk_size]

    async def health(self) -> bool:
        """Return True if the local model can produce a one-token completion."""
        if not self._config.is_available():
            return False
        try:
            await self.chat(
                [{"role": "user", "content": "ping"}],
                max_tokens=1,
            )
            return True
        except Exception:
            logger.warning("Local Phi-4 health check failed", exc_info=True)
            return False
