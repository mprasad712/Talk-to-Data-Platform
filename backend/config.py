from typing import List
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    UPLOAD_DIR: str = str(Path(__file__).parent / "uploads")
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    MAX_RETRIES: int = 2

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
