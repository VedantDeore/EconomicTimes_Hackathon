from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Resolve .env from project root (two levels up from this file: app/config.py -> et-backend -> ET)
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ET Finance Mentor API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # MongoDB
    MONGODB_URI: str = "mongodb+srv://<user>:<password>@cluster.mongodb.net/"
    MONGODB_DB_NAME: str = "et_finance"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    AI_PROVIDER: str = "gemini"  # "gemini" | "openai"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
