import os
from pathlib import Path

from dotenv import load_dotenv

_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_REPO_ROOT = _BACKEND_DIR.parent

load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_BACKEND_DIR / ".env", override=True)


def _csv(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [part.strip() for part in raw.split(",") if part.strip()]


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://bioalign:bioalign@localhost:5432/bioalign",
        )
        self.postgres_user = os.getenv("POSTGRES_USER", "bioalign")
        self.postgres_password = os.getenv("POSTGRES_PASSWORD", "bioalign")
        self.postgres_db = os.getenv("POSTGRES_DB", "bioalign")
        self.postgres_host = os.getenv("POSTGRES_HOST", "localhost")
        self.postgres_port = int(os.getenv("POSTGRES_PORT", "5432"))
        self.api_host = os.getenv("API_HOST", "0.0.0.0")
        self.api_port = int(os.getenv("API_PORT", "8000"))
        self.api_reload = os.getenv("API_RELOAD", "true").lower() in {"1", "true", "yes"}
        self.cors_origins = _csv("CORS_ORIGINS", "http://localhost:3000")
        self.device = os.getenv("DEVICE", "cpu")


settings = Settings()
