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
    DATABASE_URL: str = "postgresql://postgres:zuiCh6ohw4oofee9zei+woo@postgres:5432/n8n"
    DATABASE_POOL_SIZE: int = 10

    # Redis Configuration (for caching and pip cachecontrol)
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_ENABLED: bool = True

    HYBRID_ENABLED: bool = True
    HYBRID_VECTOR_WEIGHT: float = 0.7
    HYBRID_BM25_WEIGHT: float = 0.3
    HYBRID_PHRASE_BONUS: float = 0.1

    # HyDE (Hypothetical Document Embeddings) Configuration
    HYDE_ENABLED: bool = True
    HYDE_MODEL: str = "mistral-small-latest"
    HYDE_CACHE_TTL: int = 3600  # seconds
    HYDE_MAX_TOKENS: int = 200
    HYDE_TEMPERATURE: float = 0.7

    # Embedding Reranking Configuration (Cross-Encoder)
    EMBEDDING_RERANK_ENABLED: bool = False
    EMBEDDING_RERANK_TOP_K: int = 50
    CROSS_ENCODER_MODEL: str = "ms-marco-MiniLM-L-6-v2"

    # LLM Reranking Configuration (Rubric-based)
    LLM_RERANK_ENABLED: bool = False
    LLM_RERANK_TOP_K: int = 10

    # MMR (Maximal Marginal Relevance) Configuration
    MMR_ENABLED: bool = False
    MMR_K: int = 10
    MMR_LAMBDA: float = 0.5

    # Retrieval Signal Weights (for combining vector, BM25, rerank scores)
    RETRIEVAL_VECTOR_WEIGHT: float = 0.5
    RETRIEVAL_BM25_WEIGHT: float = 0.3
    RETRIEVAL_RERANK_WEIGHT: float = 0.2

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.HYBRID_ENABLED:
            total = self.HYBRID_VECTOR_WEIGHT + self.HYBRID_BM25_WEIGHT
            if abs(total - 1.0) > 0.001:
                raise ValueError(
                    f"HYBRID_VECTOR_WEIGHT ({self.HYBRID_VECTOR_WEIGHT}) + "
                    f"HYBRID_BM25_WEIGHT ({self.HYBRID_BM25_WEIGHT}) must sum to 1.0, got {total}"
                )
        # Validate retrieval weights sum to 1.0
        total_retrieval = (
            self.RETRIEVAL_VECTOR_WEIGHT + self.RETRIEVAL_BM25_WEIGHT + self.RETRIEVAL_RERANK_WEIGHT
        )
        if abs(total_retrieval - 1.0) > 0.001:
            raise ValueError(
                f"RETRIEVAL_VECTOR_WEIGHT ({self.RETRIEVAL_VECTOR_WEIGHT}) + "
                f"RETRIEVAL_BM25_WEIGHT ({self.RETRIEVAL_BM25_WEIGHT}) + "
                f"RETRIEVAL_RERANK_WEIGHT ({self.RETRIEVAL_RERANK_WEIGHT}) must sum to 1.0, got {total_retrieval}"
            )
        # Validate HyDE parameters
        if not 50 <= self.HYDE_MAX_TOKENS <= 500:
            raise ValueError(
                f"HYDE_MAX_TOKENS must be between 50 and 500, got {self.HYDE_MAX_TOKENS}"
            )
        if not 0.0 <= self.HYDE_TEMPERATURE <= 1.0:
            raise ValueError(
                f"HYDE_TEMPERATURE must be between 0.0 and 1.0, got {self.HYDE_TEMPERATURE}"
            )
        # Validate MMR lambda
        if not 0.0 <= self.MMR_LAMBDA <= 1.0:
            raise ValueError(f"MMR_LAMBDA must be between 0.0 and 1.0, got {self.MMR_LAMBDA}")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
