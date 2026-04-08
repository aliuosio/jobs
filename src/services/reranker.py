"""Reranker service using Strategy pattern for SOLID compliance."""

import logging
from abc import ABC, abstractmethod
from typing import Any, Protocol

from src.config import settings

logger = logging.getLogger(__name__)


class Reranker(Protocol):
    """Protocol for reranking strategies - ensures consistent interface."""

    async def rerank(self, query: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Rerank candidates based on query context."""
        ...


class EmbeddingReranker:
    """Strategy for cross-encoder embedding-based reranking."""

    def __init__(self):
        self._model = None

    async def initialize(self) -> None:
        """Lazy async initialization of the model."""
        if self._model is not None:
            return
        try:
            from sentence_transformers import CrossEncoder

            self._model = CrossEncoder(settings.CROSS_ENCODER_MODEL)
            logger.info(f"Initialized cross-encoder: {settings.CROSS_ENCODER_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load cross-encoder: {e}")
            self._model = None

    async def rerank(self, query: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Rerank using cross-encoder scores."""
        if not self._model or not candidates:
            return candidates

        try:
            texts = [
                f"Query: {query}\nDocument: {c.get('payload', {}).get('text', '')}"
                for c in candidates
            ]
            scores = self._model.predict(texts)

            for i, candidate in enumerate(candidates):
                candidate["rerank_score"] = float(scores[i])

            return sorted(candidates, key=lambda x: x.get("rerank_score", 0), reverse=True)

        except Exception as e:
            logger.error(f"Embedding rerank failed: {e}")
            return candidates


class LLMReranker:
    """Strategy for LLM rubric-based reranking."""

    def __init__(self):
        self._client = None

    async def initialize(self) -> None:
        """Lazy async initialization of the LLM client."""
        if self._client is not None:
            return
        try:
            from openai import AsyncOpenAI

            self._client = AsyncOpenAI(
                api_key=settings.MISTRAL_API_KEY,
                base_url=settings.MISTRAL_BASE_URL,
            )
            logger.info("Initialized LLM client for reranking")
        except Exception as e:
            logger.error(f"Failed to initialize LLM client: {e}")
            self._client = None

    RUBRIC_PROMPT = """You are a resume relevance scorer. Rate how relevant each resume chunk is to the user's question.

Score each chunk on a scale of 0-10 based on:
1. Keyword matching
2. Semantic relevance
3. Specificity of information
4. Completeness of the answer

Return a JSON array of scores in this format:
[{{"id": "chunk_id", "score": 8.5}}, ...]

Only return the JSON array, nothing else."""

    async def rerank(self, query: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Rerank using LLM rubric scoring."""
        if not self._client or not candidates:
            return candidates

        try:
            import json

            chunks_text = "\n\n".join(
                [
                    f"Chunk {i}: {c.get('payload', {}).get('text', '')}"
                    for i, c in enumerate(candidates)
                ]
            )

            response = await self._client.chat.completions.create(
                model="mistral-small-latest",
                messages=[
                    {"role": "system", "content": self.RUBRIC_PROMPT},
                    {"role": "user", "content": f"Query: {query}\n\n{chunks_text}"},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            scores = json.loads(response.choices[0].message.content or "[]")

            score_map = {s["id"]: s["score"] for s in scores}
            for candidate in candidates:
                idx = candidates.index(candidate)
                candidate["llm_score"] = score_map.get(str(idx), 5.0)

            return sorted(candidates, key=lambda x: x.get("llm_score", 5.0), reverse=True)

        except Exception as e:
            logger.error(f"LLM rerank failed: {e}")
            return candidates


class MMRDiversifier:
    """Strategy for Maximal Marginal Relevance diversification."""

    def __init__(self):
        self._model = None

    async def initialize(self) -> None:
        """Lazy async initialization of the model."""
        if self._model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Initialized SentenceTransformer for MMR")
        except Exception as e:
            logger.error(f"Failed to load MMR model: {e}")
            self._model = None

    async def rerank(self, query: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Apply MMR diversification."""
        if not self._model or not candidates or settings.MMR_LAMBDA == 0:
            return candidates

        try:
            query_embedding = self._model.encode(query)

            selected = []
            remaining = list(candidates)

            while len(selected) < settings.MMR_K and remaining:
                best_idx = None
                best_score = -float("inf")

                for i, candidate in enumerate(remaining):
                    text = candidate.get("payload", {}).get("text", "")
                    doc_embedding = self._model.encode(text)

                    relevance = candidate.get("rerank_score", candidate.get("score", 0))

                    selected_texts = [s.get("payload", {}).get("text", "") for s in selected]
                    if selected_texts:
                        selected_embeddings = self._model.encode(selected_texts)
                        max_similarity = max(
                            float(query_embedding @ emb.T) for emb in selected_embeddings
                        )
                    else:
                        max_similarity = 0

                    mmr_score = (
                        settings.MMR_LAMBDA * relevance - (1 - settings.MMR_LAMBDA) * max_similarity
                    )

                    if mmr_score > best_score:
                        best_score = mmr_score
                        best_idx = i

                if best_idx is not None:
                    selected.append(remaining.pop(best_idx))

            return selected

        except Exception as e:
            logger.error(f"MMR diversification failed: {e}")
            return candidates[: settings.MMR_K]


class RerankerPool:
    """Facade for reranking strategies - delegates to appropriate handlers."""

    def __init__(self):
        self._embedding_reranker: EmbeddingReranker | None = None
        self._llm_reranker: LLMReranker | None = None
        self._mmr_diversifier: MMRDiversifier | None = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize all strategies lazily."""
        if self._initialized:
            return

        self._embedding_reranker = EmbeddingReranker()
        self._llm_reranker = LLMReranker()
        self._mmr_diversifier = MMRDiversifier()

        if settings.EMBEDDING_RERANK_ENABLED:
            await self._embedding_reranker.initialize()

        if settings.LLM_RERANK_ENABLED:
            await self._llm_reranker.initialize()

        if settings.MMR_ENABLED:
            await self._mmr_diversifier.initialize()

        self._initialized = True
        logger.info("RerankerPool initialized with all strategies")

    async def embedding_rerank(
        self, query: str, candidates: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Delegate to embedding reranker strategy."""
        if not self._initialized:
            await self.initialize()
        if self._embedding_reranker:
            return await self._embedding_reranker.rerank(query, candidates)
        return candidates

    async def llm_rerank(
        self, query: str, candidates: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Delegate to LLM reranker strategy."""
        if not self._initialized:
            await self.initialize()
        if self._llm_reranker:
            return await self._llm_reranker.rerank(query, candidates)
        return candidates

    async def combined_rerank(
        self, query: str, candidates: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Apply all enabled strategies in sequence."""
        if not self._initialized:
            await self.initialize()

        if settings.EMBEDDING_RERANK_ENABLED and len(candidates) <= settings.EMBEDDING_RERANK_TOP_K:
            if self._embedding_reranker:
                candidates = await self._embedding_reranker.rerank(query, candidates)

        if settings.LLM_RERANK_ENABLED and len(candidates) <= settings.LLM_RERANK_TOP_K:
            if self._llm_reranker:
                candidates = await self._llm_reranker.rerank(query, candidates)

        if settings.MMR_ENABLED:
            if self._mmr_diversifier:
                candidates = await self._mmr_diversifier.rerank(query, candidates)

        return candidates[: settings.RETRIEVAL_K]


# Global instance - lazy initialization
reranker = RerankerPool()
