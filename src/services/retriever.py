import logging
from typing import Any

from qdrant_client import AsyncQdrantClient

from src.config import settings
from src.services.sparse_tokenizer import tokenize, compute_tf, detect_phrase

logger = logging.getLogger(__name__)


class RetrieverService:
    def __init__(self):
        self.client: AsyncQdrantClient | None = None

    async def connect(self) -> None:
        logger.info(f"Connecting to Qdrant at {settings.QDRANT_URL}")
        self.client = AsyncQdrantClient(url=settings.QDRANT_URL)
        logger.info("Successfully connected to Qdrant")

    async def close(self) -> None:
        if self.client:
            await self.client.close()
            self.client = None
            logger.info("Closed Qdrant connection")

    async def search(self, query_vector: list[float], k: int | None = None) -> list[dict[str, Any]]:
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
            if "doesn't exist" in str(e) or "Not found" in str(e):
                logger.warning(
                    f"Collection {settings.QDRANT_COLLECTION} not found, returning empty results"
                )
                return []
            raise

    async def hybrid_search(
        self, query_text: str, dense_vector: list[float], k: int | None = None
    ) -> list[dict[str, Any]]:
        if not self.client:
            raise RuntimeError("RetrieverService not connected. Call connect() first.")

        if not settings.HYBRID_ENABLED:
            return await self.search(dense_vector, k)

        if len(query_text) <= 2:
            logger.info("Short query detected, using vector-only search")
            return await self.search(dense_vector, k)

        k = k or settings.RETRIEVAL_K

        query_tokens = tokenize(query_text)
        query_tf = compute_tf(query_tokens)

        try:
            vector_results = await self.client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=dense_vector,
                limit=k * 2,
                with_payload=True,
            )

            vector_weight = settings.HYBRID_VECTOR_WEIGHT
            bm25_weight = settings.HYBRID_BM25_WEIGHT
            phrase_bonus_weight = settings.HYBRID_PHRASE_BONUS

            if vector_weight >= 1.0:
                logger.info("Pure vector mode (HYBRID_VECTOR_WEIGHT=1.0)")
                return [
                    {"id": str(p.id), "score": p.score, "payload": p.payload or {}}
                    for p in vector_results.points[:k]
                ]

            scored_results: list[tuple[float, dict[str, Any]]] = []

            for point in vector_results.points:
                payload = point.payload or {}
                text = payload.get("text", "")
                if not text:
                    text = payload.get("content", "")

                bm25_score = 0.0
                phrase_bonus = 0.0
                if text:
                    doc_tokens = tokenize(text)
                    doc_tf = compute_tf(doc_tokens)
                    matches = sum(
                        min(query_tf.get(t, 0), doc_tf.get(t, 0)) for t in query_tf if t in doc_tf
                    )
                    bm25_score = matches / max(len(doc_tokens), 1)
                    if phrase_bonus_weight > 0:
                        phrase_bonus = detect_phrase(query_text, text) * phrase_bonus_weight

                combined_score = (
                    vector_weight * point.score + bm25_weight * bm25_score + phrase_bonus
                )

                scored_results.append(
                    (
                        combined_score,
                        {
                            "id": str(point.id),
                            "score": combined_score,
                            "vector_score": point.score,
                            "bm25_score": bm25_score,
                            "payload": payload,
                        },
                    )
                )

            scored_results.sort(key=lambda x: x[0], reverse=True)
            final_results = [r[1] for r in scored_results[:k]]

            logger.info(f"Hybrid search returned {len(final_results)} results")
            return final_results

        except Exception as e:
            logger.warning(f"Hybrid search failed, falling back to vector: {e}")
            return await self.search(dense_vector, k)

    async def get_profile_chunk(self) -> dict[str, Any] | None:
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
        if not self.client:
            return False
        try:
            await self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False


retriever = RetrieverService()
