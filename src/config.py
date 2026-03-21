"""Application configuration via pydantic-settings.

Manages all environment variables for the RAG Backend API.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Qdrant Configuration
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_COLLECTION: str = "resume"

    # Mistral Embedding Configuration
    MISTRAL_API_KEY: str  # Required for embeddings
    MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
    MISTRAL_EMBEDDING_MODEL: str = "mistral-embed"
    EMBEDDING_DIMENSION: int = 1024  # mistral-embed uses 1024 dimensions

    # Retrieval Configuration (Constitution II compliance)
    RETRIEVAL_K: int = 5

    # Retry Configuration
    MAX_RETRIES: int = 4
    RETRY_BASE_DELAY: float = 1.0

    # PostgreSQL Configuration
    DATABASE_URL: str = (
        "postgresql://postgres:zuiCh6ohw4oofee9zei+woo@postgres:5432/n8n"
    )
    DATABASE_POOL_SIZE: int = 10

    # Redis Configuration (for caching and pip cachecontrol)
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_ENABLED: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
