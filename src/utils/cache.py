"""Query cache for HyDE and reranking results."""

import asyncio
import hashlib
import time
from typing import Any


class QueryCache:
    """Async-safe cache for HyDE drafts and reranking results."""

    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self._hyde_cache: dict[str, tuple[str, float]] = {}
        self._rerank_cache: dict[str, tuple[dict[str, float], float]] = {}
        self.max_size = max_size
        self.ttl = ttl
        self._hyde_lock = asyncio.Lock()
        self._rerank_lock = asyncio.Lock()

    def _hash_query(self, query: str) -> str:
        return hashlib.sha256(query.encode()).hexdigest()[:16]

    async def get_hyde(self, query: str) -> str | None:
        async with self._hyde_lock:
            query_hash = self._hash_query(query)
            if query_hash in self._hyde_cache:
                draft, timestamp = self._hyde_cache[query_hash]
                if time.time() - timestamp < self.ttl:
                    return draft
                del self._hyde_cache[query_hash]
            return None

    async def set_hyde(self, query: str, draft: str) -> None:
        async with self._hyde_lock:
            if len(self._hyde_cache) >= self.max_size:
                oldest = min(self._hyde_cache.items(), key=lambda x: x[1][1])
                del self._hyde_cache[oldest[0]]
            query_hash = self._hash_query(query)
            self._hyde_cache[query_hash] = (draft, time.time())

    async def get_rerank(self, query: str, doc_id: str) -> float | None:
        async with self._rerank_lock:
            cache_key = f"{self._hash_query(query)}:{doc_id}"
            if cache_key in self._rerank_cache:
                scores, timestamp = self._rerank_cache[cache_key]
                if time.time() - timestamp < self.ttl:
                    return scores.get(doc_id)
                del self._rerank_cache[cache_key]
            return None

    async def set_rerank(self, query: str, doc_id: str, score: float) -> None:
        async with self._rerank_lock:
            if len(self._rerank_cache) >= self.max_size:
                oldest = min(self._rerank_cache.items(), key=lambda x: x[1][1])
                del self._rerank_cache[oldest[0]]
            cache_key = f"{self._hash_query(query)}:{doc_id}"
            self._rerank_cache[cache_key] = ({doc_id: score}, time.time())

    def get_hyde_sync(self, query: str) -> str | None:
        query_hash = self._hash_query(query)
        if query_hash in self._hyde_cache:
            draft, timestamp = self._hyde_cache[query_hash]
            if time.time() - timestamp < self.ttl:
                return draft
            del self._hyde_cache[query_hash]
        return None

    def set_hyde_sync(self, query: str, draft: str) -> None:
        if len(self._hyde_cache) >= self.max_size:
            oldest = min(self._hyde_cache.items(), key=lambda x: x[1][1])
            del self._hyde_cache[oldest[0]]
        query_hash = self._hash_query(query)
        self._hyde_cache[query_hash] = (draft, time.time())


query_cache = QueryCache()
