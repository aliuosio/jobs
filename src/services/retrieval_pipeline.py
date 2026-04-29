import logging
from typing import Any

from src.api.schemas import ConfidenceLevel, SearchRequest, SearchResponse, SearchResult, SearchScores
from src.services.embedder import embedder
from src.services.field_classifier import classify_field_type, form_filling_service
from src.services.generator import generator
from src.services.retriever import retriever

logger = logging.getLogger(__name__)


class RetrievalPipeline:
    async def search(self, search_req: SearchRequest) -> SearchResponse:
        logger.info(
            f"[pipeline] query={search_req.query!r} use_hyde={search_req.use_hyde} use_reranking={search_req.use_reranking}"
        )

        query_vector = await embedder.embed(search_req.query)

        if search_req.use_reranking:
            chunks = await retriever.search_with_reranking(
                search_req.query, query_vector, k=search_req.top_k
            )
        else:
            chunks = await retriever.hybrid_search(
                search_req.query, query_vector, k=search_req.top_k
            )

        results = self._build_results(chunks, search_req.include_scores)
        logger.info(f"[pipeline] returned {len(results)} results")

        generated_answer = None
        confidence = None
        field_type = None

        if search_req.generate:
            generated_answer, confidence, field_type = await self._generate_answer(
                search_req, chunks
            )

        return SearchResponse(
            results=results,
            query=search_req.query,
            total_retrieved=len(results),
            generated_answer=generated_answer,
            confidence=confidence,
            field_type=field_type,
        )

    def _build_results(self, chunks: list[dict], include_scores: bool) -> list[SearchResult]:
        results = []
        for chunk in chunks:
            payload = chunk.get("payload", {})
            content = payload.get("text", "") or payload.get("content", "")

            scores = None
            if include_scores:
                scores = SearchScores(
                    vector_score=chunk.get("vector_score") or chunk.get("score"),
                    bm25_score=chunk.get("bm25_score"),
                    rerank_score=chunk.get("rerank_score") or chunk.get("llm_score"),
                )

            result = SearchResult(
                content=content,
                score=chunk.get("score", 0),
                source=payload.get("t", "resume"),
                scores=scores,
            )
            results.append(result)
        return results

    async def _generate_answer(
        self, search_req: SearchRequest, chunks: list[dict]
    ) -> tuple[str | None, ConfidenceLevel | None, str | None]:
        try:
            profile_chunk = await retriever.get_profile_chunk()
            if profile_chunk:
                chunks.insert(0, profile_chunk)
        except Exception as e:
            logger.warning(f"[pipeline] profile_chunk_fetch_failed: {e}")

        if search_req.signals and any(search_req.signals.values()):
            field_type_detected = classify_field_type(search_req.signals)
            if field_type_detected:
                field_value = form_filling_service.extract_direct_field_value(
                    chunks, field_type_detected
                )
                if field_value:
                    logger.info(
                        f"[pipeline] direct_extraction field_type={field_type_detected.value} "
                        f"field_value={field_value[:20]}..."
                    )
                    return field_value, ConfidenceLevel.HIGH, field_type_detected.value

        if not chunks:
            return None, None, None

        avg_score = sum(c.get("score", 0) for c in chunks) / len(chunks)
        retrieval_confidence = form_filling_service.calculate_confidence(avg_score, len(chunks))
        context = form_filling_service.assemble_context(chunks)

        classification = await generator.classify_and_extract(
            context=context,
            label=search_req.query,
            signals=search_req.signals,
        )

        llm_conf_str = classification.confidence.lower()
        if llm_conf_str == "high":
            llm_conf = ConfidenceLevel.HIGH
        elif llm_conf_str == "medium":
            llm_conf = ConfidenceLevel.MEDIUM
        elif llm_conf_str == "low":
            llm_conf = ConfidenceLevel.LOW
        else:
            llm_conf = ConfidenceLevel.NONE

        confidence = form_filling_service.combine_confidence(
            retrieval_confidence, llm_conf, classification.field_value
        )
        generated_answer = classification.answer
        field_type = classification.field_type

        logger.info(
            f"[pipeline] generated answer: {generated_answer[:50]}... conf={confidence.value}"
        )

        return generated_answer, confidence, field_type


pipeline = RetrievalPipeline()