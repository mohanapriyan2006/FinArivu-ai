from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: Literal["development", "test", "staging", "production"] = Field(
        default="development",
        alias="ENVIRONMENT",
    )
    debug: bool = Field(default=False, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Database
    database_url: SecretStr = Field(alias="DATABASE_URL")

    # Security
    secret_key: SecretStr = Field(alias="SECRET_KEY")
    aes_key: SecretStr = Field(alias="AES_KEY")
    aes_key_salt: SecretStr = Field(alias="AES_KEY_SALT")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # AI chatbot
    openai_api_key: SecretStr | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")

    # AI Providers (Multi-fallback)
    groq_api_key: SecretStr | None = Field(default=None, alias="GROQ_API_KEY")
    gemini_api_key: SecretStr | None = Field(default=None, alias="GEMINI_API_KEY")
    openrouter_api_key: SecretStr | None = Field(default=None, alias="OPENROUTER_API_KEY")

    # CORS
    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")

    # Rate limiting
    rate_limit_rpm: int = Field(default=100, alias="RATE_LIMIT_RPM")

    # Cache (in-memory until Redis is added)
    cache_ttl_seconds: int = Field(default=600, alias="CACHE_TTL_SECONDS")

    # AI Copilot
    ai_copilot_provider: str = Field(default="gemini", alias="AI_COPILOT_PROVIDER")
    ai_copilot_temperature: float = Field(default=0.3, alias="AI_COPILOT_TEMPERATURE")
    ai_copilot_max_tokens: int = Field(default=2048, alias="AI_COPILOT_MAX_TOKENS")
    ai_copilot_timeout: int = Field(default=30, alias="AI_COPILOT_TIMEOUT")
    ai_retry_count: int = Field(default=3, alias="AI_RETRY_COUNT")
    ai_streaming_enabled: bool = Field(default=True, alias="AI_STREAMING_ENABLED")

    # Local Phi-4 Controller/Validator
    local_llm_enabled: bool = Field(default=False, alias="LOCAL_LLM_ENABLED")
    local_llm_model_path: str = Field(default="", alias="LOCAL_LLM_MODEL_PATH")
    local_llm_n_gpu_layers: int = Field(default=-1, alias="LOCAL_LLM_N_GPU_LAYERS")
    local_llm_n_ctx: int = Field(default=4096, alias="LOCAL_LLM_N_CTX")
    local_llm_n_batch: int = Field(default=512, alias="LOCAL_LLM_N_BATCH")
    local_llm_threads: int = Field(default=6, alias="LOCAL_LLM_THREADS")
    local_llm_timeout_seconds: int = Field(default=120, alias="LOCAL_LLM_TIMEOUT_SECONDS")
    local_llm_flash_attn: bool = Field(default=True, alias="LOCAL_LLM_FLASH_ATTN")
    local_llm_offload_kqv: bool = Field(default=True, alias="LOCAL_LLM_OFFLOAD_KQV")

    # AI pipeline timeouts
    ai_controller_timeout_seconds: int = Field(default=90, alias="AI_CONTROLLER_TIMEOUT_SECONDS")
    ai_agent_timeout_seconds: int = Field(default=30, alias="AI_AGENT_TIMEOUT_SECONDS")
    ai_response_timeout_seconds: int = Field(default=60, alias="AI_RESPONSE_TIMEOUT_SECONDS")
    ai_validator_timeout_seconds: int = Field(default=120, alias="AI_VALIDATOR_TIMEOUT_SECONDS")
    ai_verifier_timeout_seconds: int = Field(default=60, alias="AI_VERIFIER_TIMEOUT_SECONDS")
    ai_max_repair_attempts: int = Field(default=2, alias="AI_MAX_REPAIR_ATTEMPTS")
    ai_enable_api_verifier: bool = Field(default=True, alias="AI_ENABLE_API_VERIFIER")

    # Provider routing per task type
    ai_provider_fast: str = Field(default="groq", alias="AI_PROVIDER_FAST")
    ai_provider_reasoning: str = Field(default="gemini", alias="AI_PROVIDER_REASONING")
    ai_provider_long_context: str = Field(default="openrouter", alias="AI_PROVIDER_LONG_CONTEXT")

    @property
    def is_development(self) -> bool:
        return self.environment in ("development", "test")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def database_url_str(self) -> str:
        return self.database_url.get_secret_value()

    @property
    def secret_key_str(self) -> str:
        return self.secret_key.get_secret_value()

    @property
    def aes_key_str(self) -> str:
        return self.aes_key.get_secret_value()

    @property
    def aes_key_salt_str(self) -> str:
        return self.aes_key_salt.get_secret_value()


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
