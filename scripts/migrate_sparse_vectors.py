"""Migration script to verify data integrity for hybrid search.

Verifies that documents have text payloads for BM25 scoring.
"""

import asyncio
import logging
from qdrant_client import AsyncQdrantClient
from src.config import settings
from src.services.sparse_tokenizer import tokenize

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_data_integrity():
    client = AsyncQdrantClient(url=settings.QDRANT_URL)

    try:
        result = await client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            limit=100,
            with_payload=True,
        )

        points, _ = result
        total = len(points)
        with_text = 0
        sample_tokens = []

        for point in points:
            payload = point.payload or {}
            text = payload.get("text", "") or payload.get("content", "")
            if text:
                with_text += 1
                tokens = tokenize(text)
                if len(tokens) > 5:
                    sample_tokens.append((str(point.id), tokens[:5]))

        logger.info(f"Data integrity check:")
        logger.info(f"  Total points: {total}")
        logger.info(f"  With text payload: {with_text}")
        logger.info(f"  Coverage: {with_text / total * 100:.1f}%")
        logger.info(f"  Sample tokens: {sample_tokens[:3]}")

        if with_text == 0:
            logger.warning("No text payloads found - BM25 scoring will not work")
            return False

        return True

    finally:
        await client.close()


if __name__ == "__main__":
    result = asyncio.run(verify_data_integrity())
    exit(0 if result else 1)
