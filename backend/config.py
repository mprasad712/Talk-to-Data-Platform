from typing import List
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    UPLOAD_DIR: str = str(Path(__file__).parent / "uploads")
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    MAX_RETRIES: int = 2

    # Multi-provider LLM support
    ACTIVE_LLM_PROVIDER: str = "groq"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_MODEL: str = "gpt-4o"
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-06-01"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
