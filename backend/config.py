"""Configuration module for the backend."""
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    whisper_model: str = "tiny"
    max_upload_size_mb: int = 10
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5500"]
    rate_limit_per_min: int = 10

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"

config = Settings()
