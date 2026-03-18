"""Application configuration via pydantic-settings.

Manages all environment variables for the RAG Backend API.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Qdrant Configuration
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_COLLECTION: str = "resumes"

    # Z.ai API Configuration
    ZAI_API_KEY: str  # Required - no default
    ZAI_BASE_URL: str = "https://api.z.ai/v1"

    # Embedding Configuration (Constitution I compliance)
    EMBEDDING_DIMENSION: int = 1536

    # Retrieval Configuration (Constitution II compliance)
    RETRIEVAL_K: int = 5

    # Retry Configuration
    MAX_RETRIES: int = 4
    RETRY_BASE_DELAY: float = 1.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
