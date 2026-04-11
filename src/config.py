from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # -------------------------
    # Core Config
    # -------------------------
    model_config = SettingsConfigDict(
        env_file=".env",        # used for local dev; ignored if env already set
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # -------------------------
    # Qdrant
    # -------------------------
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_COLLECTION: str = "resume"

    # -------------------------
    # PostgreSQL
    # -------------------------
    POSTGRES_HOST: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432

    DATABASE_URL: str | None = None
    DATABASE_POOL_SIZE: int = 10

    # -------------------------
    # Redis
    # -------------------------
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_ENABLED: bool = True

    # -------------------------
    # Mistral
    # -------------------------
    MISTRAL_API_KEY: str
    MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
    MISTRAL_EMBEDDING_MODEL: str = "mistral-embed"
    EMBEDDING_DIMENSION: int = 1024

    # -------------------------
    # Retrieval Core
    # -------------------------
    RETRIEVAL_K: int = 5

    # Retry
    MAX_RETRIES: int = 4
    RETRY_BASE_DELAY: float = 1.0

    # -------------------------
    # Hybrid Retrieval
    # -------------------------
    HYBRID_ENABLED: bool = True
    HYBRID_VECTOR_WEIGHT: float = 0.7
    HYBRID_BM25_WEIGHT: float = 0.3
    HYBRID_PHRASE_BONUS: float = 0.1

    # -------------------------
    # HyDE
    # -------------------------
    HYDE_ENABLED: bool = True
    HYDE_MODEL: str = "mistral-small-latest"
    HYDE_CACHE_TTL: int = 3600
    HYDE_MAX_TOKENS: int = 200
    HYDE_TEMPERATURE: float = 0.7

    # -------------------------
    # Embedding Rerank
    # -------------------------
    EMBEDDING_RERANK_ENABLED: bool = False
    EMBEDDING_RERANK_TOP_K: int = 50
    CROSS_ENCODER_MODEL: str = "ms-marco-MiniLM-L-6-v2"

    # -------------------------
    # LLM Rerank
    # -------------------------
    LLM_RERANK_ENABLED: bool = False
    LLM_RERANK_TOP_K: int = 10

    # -------------------------
    # MMR
    # -------------------------
    MMR_ENABLED: bool = False
    MMR_K: int = 10
    MMR_LAMBDA: float = 0.5

    # -------------------------
    # Retrieval Weighting
    # -------------------------
    RETRIEVAL_VECTOR_WEIGHT: float = 0.5
    RETRIEVAL_BM25_WEIGHT: float = 0.3
    RETRIEVAL_RERANK_WEIGHT: float = 0.2

    # -------------------------
    # Derived Fields
    # -------------------------
    def model_post_init(self, __context):
        """Compute derived values after initialization."""
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql://{self.POSTGRES_USER}:"
                f"{self.POSTGRES_PASSWORD}@"
                f"{self.POSTGRES_HOST}:"
                f"{self.POSTGRES_PORT}/"
                f"{self.POSTGRES_DB}"
            )

    # -------------------------
    # Validators
    # -------------------------
    @model_validator(mode="after")
    def validate_weights(self):
        # Hybrid weights must sum to 1
        if self.HYBRID_ENABLED:
            total = self.HYBRID_VECTOR_WEIGHT + self.HYBRID_BM25_WEIGHT
            if abs(total - 1.0) > 0.001:
                raise ValueError(
                    f"HYBRID weights must sum to 1.0, got {total}"
                )

        # Retrieval weights must sum to 1
        total_retrieval = (
            self.RETRIEVAL_VECTOR_WEIGHT
            + self.RETRIEVAL_BM25_WEIGHT
            + self.RETRIEVAL_RERANK_WEIGHT
        )
        if abs(total_retrieval - 1.0) > 0.001:
            raise ValueError(
                f"Retrieval weights must sum to 1.0, got {total_retrieval}"
            )

        # HyDE constraints
        if not 50 <= self.HYDE_MAX_TOKENS <= 500:
            raise ValueError("HYDE_MAX_TOKENS must be between 50 and 500")

        if not 0.0 <= self.HYDE_TEMPERATURE <= 1.0:
            raise ValueError("HYDE_TEMPERATURE must be between 0 and 1")

        # MMR lambda constraint
        if not 0.0 <= self.MMR_LAMBDA <= 1.0:
            raise ValueError("MMR_LAMBDA must be between 0 and 1")

        return self


settings = Settings()