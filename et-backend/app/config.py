from pydantic import BaseModel
from functools import lru_cache
from pathlib import Path
import os
from dotenv import load_dotenv

# Load .env from multiple possible locations
_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

for _env_path in [_BACKEND_DIR / ".env", _PROJECT_ROOT / ".env"]:
    if _env_path.exists():
        load_dotenv(_env_path)


class Settings(BaseModel):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", os.getenv("AI_PORT", "http://127.0.0.1:8000"))
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,*").split(",")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
