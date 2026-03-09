"""Embedder service for generating query embeddings.

Generates 1536-dimensional embeddings using OpenAI-compatible API.
"""

import logging

from openai import AsyncOpenAI

from src.config import settings

logger = logging.getLogger(__name__)


class EmbedderService:
    """Service for generating text embeddings.

    Uses OpenAI-compatible API to generate 1536-dimensional embeddings
    (Constitution I compliance).
    """

    def __init__(self):
        """Initialize embedder with OpenAI-compatible client."""
        self.client = AsyncOpenAI(
            api_key=settings.ZAI_API_KEY,
            base_url=settings.ZAI_BASE_URL,
        )

    async def embed(self, text: str) -> list[float]:
        """Generate embedding vector for text.

        Args:
            text: Text to embed.

        Returns:
            1536-dimensional embedding vector (Constitution I).

        Raises:
            APIError: If embedding generation fails.
        """
        logger.info(f"Generating embedding for text: {text[:50]}...")

        response = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            dimensions=settings.EMBEDDING_DIMENSION,
        )

        embedding = response.data[0].embedding
        logger.info(f"Generated embedding with {len(embedding)} dimensions")
        return embedding


# Global embedder instance
embedder = EmbedderService()
