# Research: Review JORM Filler and RAG System

## Research Summary

This is a code review task. Key findings from prior exploration:

### Decision: Qdrant as Single Source of Truth

**Rationale**: User explicitly requires Qdrant-only data source
- No alternative data sources should provide answers
- Missing fields → "no data available" (NONE confidence)
- No hardcoded fallback responses

**Alternatives considered**:
- Static/default values → REJECTED (untraceable)
- LLM generation without context → REJECTED (Constitution III violation)

### Decision: Hybrid Search Implementation

**Rationale**: Current implementation combines BM25 + vector search
- Already implements configurable weights (HYBRID_VECTOR_WEIGHT, HYBRID_BM25_WEIGHT)
- Proper fallback on error: vector-only when hybrid fails

**Alternatives considered**:
- Pure vector → REJECTED (misses exact technical terms)
- Pure BM25 → REJECTED (misses semantic similarity)

### Identified Fallback Pattern (Review Item)

**Location**: `src/services/retriever.py:137-138`
```python
except Exception as e:
    logger.warning(f"Hybrid search failed, falling back to vector: {e}")
    return await self.search(dense_vector, k)
```

**Decision**: This is a MEDIUM concern - should be reviewed to determine if strict Qdrant-only requires removing this error fallback (propagate error instead).

### Reference Patterns Integrated

From "Stop the Hallucinations: Hybrid Retrieval" (Rick Hightower, May 2025):

| Technique | Status | Notes |
|----------|--------|-------|
| Hybrid BM25 + Vector | Implemented | Configurable weights |
| HyDE | Deferred | Future enhancement |
| Embedding Rerank | Deferred | Future enhancement |
| LLM Rubric Rerank | Deferred | Future enhancement |
| Query Expansion | Not implemented | Low priority |
| MMR | Not implemented | Low priority |

## Technology Context

**Existing stack** (no new tech needed):
- Python 3.11+ / FastAPI
- qdrant-client (async)
- Mistral API (OpenAI-compatible)
- asyncpg / redis

**No new dependencies required** - this is a code review task.