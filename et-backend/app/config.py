from pydantic import BaseModel
from functools import lru_cache
from pathlib import Path
import os
from dotenv import load_dotenv

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_ENV_FILE)


class Settings(BaseModel):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", os.getenv("AI_PORT", "http://127.0.0.1:8000"))
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
