from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_prefix="ERRATA_", extra="ignore"
    )

    gemini_api_key: str = ""
    model: str = "gemini/gemini-3.5-flash-lite"
    llm_enabled: bool = True

    database_url: str = "sqlite:///./errata.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    pool_target: int = 3
    generation_attempts: int = 3


@lru_cache
def get_settings() -> Settings:
    return Settings()
