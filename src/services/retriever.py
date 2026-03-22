"""Retriever service for Qdrant vector database operations.

Implements async vector search with connection lifecycle management.
"""

import logging
from typing import Any

from qdrant_client import AsyncQdrantClient

from src.config import settings

logger = logging.getLogger(__name__)


class RetrieverService:
    """Service for retrieving context from Qdrant vector store.

    Manages async connection to Qdrant and provides search functionality
    with k=5 retrieval (Constitution II compliance).
    """

    def __init__(self):
        """Initialize retriever with disconnected client."""
        self.client: AsyncQdrantClient | None = None

    async def connect(self) -> None:
        """Establish connection to Qdrant vector database.

        Raises:
            ConnectionError: If connection fails after retries.
        """
        logger.info(f"Connecting to Qdrant at {settings.QDRANT_URL}")
        self.client = AsyncQdrantClient(url=settings.QDRANT_URL)
        logger.info("Successfully connected to Qdrant")

    async def close(self) -> None:
        """Close connection to Qdrant vector database."""
        if self.client:
            await self.client.close()
            self.client = None
            logger.info("Closed Qdrant connection")

    async def search(self, query_vector: list[float], k: int | None = None) -> list[dict[str, Any]]:
        """Search for top-k similar vectors in the collection.

        Args:
            query_vector: 1024-dimensional embedding vector.
            k: Number of results to retrieve. Defaults to RETRIEVAL_K.

        Returns:
            List of search results with id, score, and payload.

        Raises:
            RuntimeError: If client is not connected.
        """
        if not self.client:
            raise RuntimeError("RetrieverService not connected. Call connect() first.")

        k = k or settings.RETRIEVAL_K
        logger.info(f"Searching for top {k} results in collection {settings.QDRANT_COLLECTION}")

        try:
            response = await self.client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=query_vector,
                limit=k,
                with_payload=True,
            )

            search_results = [
                {"id": str(p.id), "score": p.score, "payload": p.payload or {}}
                for p in response.points
            ]
            logger.info(f"Retrieved {len(search_results)} chunks")
            return search_results
        except Exception as e:
            # Handle missing collection gracefully - return empty results
            if "doesn't exist" in str(e) or "Not found" in str(e):
                logger.warning(
                    f"Collection {settings.QDRANT_COLLECTION} not found, returning empty results"
                )
                return []
            raise

    async def get_profile_chunk(self) -> dict[str, Any] | None:
        """Fetch the personal profile chunk from the collection.

        Returns:
            Profile chunk with payload, or None if not found.
        """
        if not self.client:
            raise RuntimeError("RetrieverService not connected. Call connect() first.")

        logger.info(f"Fetching profile chunk from collection {settings.QDRANT_COLLECTION}")

        try:
            result = await self.client.scroll(
                collection_name=settings.QDRANT_COLLECTION,
                scroll_filter={"must": [{"key": "t", "match": {"value": "p"}}]},
                limit=1,
                with_payload=True,
            )

            points, _ = result
            if points:
                point = points[0]
                logger.info("Found profile chunk")
                return {
                    "id": str(point.id),
                    "score": 1.0,
                    "payload": point.payload or {},
                }

            logger.info("No profile chunk found")
            return None
        except Exception as e:
            logger.error(f"Error fetching profile chunk: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Qdrant connection is healthy.

        Returns:
            True if connection is healthy, False otherwise.
        """
        if not self.client:
            return False
        try:
            await self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False


# Global retriever instance for lifespan management
retriever = RetrieverService()
