"""Embedder service for generating text embeddings.

Implements async embedding generation using Mistral's mistral-embed model
via OpenAI-compatible API.
"""

import logging

from openai import AsyncOpenAI

from src.config import settings

logger = logging.getLogger(__name__)


class EmbedderService:
    """Service for generating text embeddings using Mistral API.

    Uses OpenAI-compatible client to generate embeddings with the
    mistral-embed model (1024 dimensions).
    """

    def __init__(self):
        """Initialize embedder with Mistral API client."""
        self.client = AsyncOpenAI(
            api_key=settings.MISTRAL_API_KEY,
            base_url=settings.MISTRAL_BASE_URL,
        )

    async def embed(self, text: str) -> list[float]:
        """Generate embedding vector for input text.

        Args:
            text: Input text to embed.

        Returns:
            1024-dimensional embedding vector.

        Raises:
            APIError: If embedding generation fails.
        """
        logger.info(f"Generating embedding for text: {text[:50]}...")

        response = await self.client.embeddings.create(
            model=settings.MISTRAL_EMBEDDING_MODEL,
            input=text,
        )

        vector = response.data[0].embedding
        logger.info(f"Generated {len(vector)}-dimensional embedding")
        return vector


# Global embedder instance
embedder = EmbedderService()
