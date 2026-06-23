"""Application configuration using Pydantic Settings."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Environment
    env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/finarivu"

    # JWT Auth
    jwt_secret_key: str = "super-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 168

    # AI Providers (multi-fallback)
    groq_api_key: str = ""
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Rate Limiting
    rate_limit_rpm: int = 100

    @property
    def cors_origin_list(self) -> List[str]:
        """Parse CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.env.lower() == "production"


settings = Settings()
