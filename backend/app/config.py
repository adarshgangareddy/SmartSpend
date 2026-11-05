import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Locate and load the .env file from the backend directory or project root
base_dir = Path(__file__).resolve().parent.parent
env_path = base_dir / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "SmartSpend API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    # CORS origins: comma-separated list or default to Vite dev server
    _cors_env: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    ALLOWED_ORIGINS: List[str] = [
        origin.strip() for origin in _cors_env.split(",") if origin.strip()
    ]

    def is_supabase_configured(self) -> bool:
        """Check whether Supabase credentials are set and not placeholder values."""
        if not self.SUPABASE_URL or not self.SUPABASE_KEY:
            return False
        if "your-project-id" in self.SUPABASE_URL or "your-supabase" in self.SUPABASE_KEY:
            return False
        return True

    def is_supabase_admin_configured(self) -> bool:
        """Return whether the backend-only Supabase service role key is available."""
        return bool(
            self.SUPABASE_URL
            and self.SUPABASE_SERVICE_ROLE_KEY
            and "your-project-id" not in self.SUPABASE_URL
            and "your-supabase" not in self.SUPABASE_SERVICE_ROLE_KEY
        )


settings = Settings()

