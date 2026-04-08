# Research: RAG System Hybrid Retrieval Enhancements

**Feature**: 1008-rag-hybrid-upgrades  
**Date**: 2026-04-08  
**Status**: COMPLETE

---

## Summary

This document captures research findings for implementing HyDE, embedding reranking, and LLM rubric reranking in the existing Qdrant-based RAG system.

---

## Current Implementation Analysis

### Retriever Service (`src/services/retriever.py`)

**Key findings:**

1. **Hybrid Search** (lines 56-137):
   - Combines vector similarity (Qdrant) with TF-based BM25
   - Uses configurable weights: `HYBRID_VECTOR_WEIGHT`, `HYBRID_BM25_WEIGHT`, `HYBRID_PHRASE_BONUS`
   - Currently has no fallback pattern (was removed in 1007-review-jorm-rag)
   - Falls back to pure vector when `HYBRID_VECTOR_WEIGHT=1.0` or for short queries (<=2 chars)

2. **Configuration** (from `src/config.py`):
   - `HYBRID_ENABLED`: Enable/disable hybrid mode
   - `HYBRID_VECTOR_WEIGHT`: Default 0.7
   - `HYBRID_BM25_WEIGHT`: Default 0.3
   - `HYBRID_PHRASE_BONUS`: Default 0.1

### Embedder Service (`src/services/embedder.py`)

**Key findings:**

1. **Embedding Model**: Mistral `mistral-embed` (1024-dim)
2. **API**: AsyncOpenAI client with Mistral base URL
3. **Sparse Vector**: Has `generate_sparse_vector()` method using TF-based tokenization
4. **No existing caching**: All embeddings generated on-demand

---

## Technical Decisions

### Decision 1: HyDE Implementation

**Choice**: Add HyDE as optional enhancement layer in retriever service

**Rationale**:
- Can reuse existing `embedder.embed()` for embedding generation
- Can reuse existing `generator` for hypothetical document generation
- Falls back to original query embedding if HyDE fails
- Gracefully aligns with existing graceful degradation pattern

**Implementation approach**:
```python
# New method in retriever.py
async def hyde_search(self, query_text: str, k: int) -> list[dict]:
    # 1. Generate hypothetical answer via LLM
    hyde_doc = await generator.generate_hypothetical(query_text)
    # 2. Embed the hypothetical document
    hyde_vector = await embedder.embed(hyde_doc)
    # 3. Search with hybrid approach
    return await self.hybrid_search(query_text, hyde_vector, k)
```

### Decision 2: Embedding Reranking (Cross-Encoder)

**Choice**: Add cross-encoder as second-stage reranker for top-50 results

**Rationale**:
- Sentence-Transformers provides lightweight models (~80MB)
- Can use `ms-marco-MiniLM-L-6-v2` for fast reranking
- Falls back to first-stage results if reranking fails
- Existing PyTest infrastructure can test this

**Implementation approach**:
```python
# New service: src/services/reranker.py
class RerankerService:
    def __init__(self):
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    
    async def rerank(self, query: str, candidates: list[dict]) -> list[dict]:
        # Re-score with cross-encoder
        # Return top-k reranked results
```

### Decision 3: LLM Rubric Reranking

**Choice**: Apply LLM rubric scoring only to top-10 results from embedding reranker

**Rationale**:
- Cost control: Only 10 LLM calls per query vs 100
- Precision: Final precision layer for top candidates
- Already have LLM (Mistral) integrated
- Can use existing generator service

**Implementation approach**:
```python
# Extend reranker.py
async def llm_rerank(self, query: str, candidates: list[dict]) -> list[dict]:
    # Score each against rubric via LLM
    # Use existing generator with rubric prompt
```

### Decision 4: MMR (Maximal Marginal Relevance)

**Choice**: Implement MMR as optional post-processing step after reranking

**Rationale**:
- Simple to implement with existing cosine similarity
- Can be toggled via config
- Helps avoid duplicate content in results

---

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Replace Qdrant with pgvector | Qdrant works well; not needed per spec assumptions |
| Use full Okapi BM25 | Current TF-based works; Qdrant sparse vectors available later |
| Rerank all candidates with LLM | Too expensive; embedding reranker sufficient for first pass |
| Real-time HyDE generation | Cache HyDE drafts to reduce API calls |

---

## Integration Points

1. **retriever.py**: Add `hyde_search()` method, integrate with existing `hybrid_search()`
2. **embedder.py**: Extend for optional caching
3. **config.py**: Add new settings for reranking weights, MMR, cache TTL
4. **routes.py**: No changes needed (retriever interface unchanged)

---

## Testing Strategy

- Unit tests for each new service
- Integration tests for end-to-end retrieval pipeline
- Measure latency: baseline vs with enhancements
- Validate graceful degradation on failures

---

## References

- HyDE Paper: [Gao et al., 2022](https://arxiv.org/abs/2202.05258)
- Cross-Encoder: [Sentence-Transformers](https://sbert.net)
- LLM Reranking: [RankGPT](https://arxiv.org/abs/2304.09542)