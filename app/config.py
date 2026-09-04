from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Resume Analyzer"
    app_version: str = "1.1.0"

    gemini_api_key:str
    gemini_model: str = "gemini-3.5-flash-lite"

    max_file_size_mb:int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

@lru_cache
def get_settings()->Settings:
    return Settings()