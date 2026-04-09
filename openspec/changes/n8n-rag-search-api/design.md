## Context

The RAG backend currently exposes only `/fill-form` which is designed for direct form field filling. The retrieval pipeline (`RetrieverService`) supports multiple enhancement stages (hybrid search, HyDE, reranking) but these are not accessible via a general-purpose search API.

n8n AI agents using the LangChain integration have access to QdrantVectorStore directly, but this bypasses the BM25 and reranking enhancements. A dedicated search endpoint allows AI agents to query resume data with configurable retrieval strategies.

**Current state:**
- FastAPI backend at `http://localhost:8000`
- `/fill-form` - form-focused endpoint with early extraction for known fields
- Qdrant collection `resume` with 1024-dim Mistral embeddings

**Stakeholders:**
- n8n AI agent workflows (this change)
- Firefox extension (existing `/fill-form` user, unchanged)

## Goals / Non-Goals

**Goals:**
- Expose full retrieval pipeline via HTTP endpoint
- Support toggling HyDE, reranking, and BM25 per-request
- Return score breakdowns for agent trust calibration
- Maintain compatibility with existing `/fill-form` behavior

**Non-Goals:**
- Modifying the existing `/fill-form` endpoint
- Adding authentication (existing FastAPI CORS config applies)
- Supporting multi-collection search
- Real-time indexing (ingestion remains via `scripts/ingest_profile.py`)

## Decisions

### 1. New `/search` endpoint vs extending `/fill-form`

**Decision:** Create separate `POST /api/v1/search` endpoint

**Rationale:**
- `/fill-form` has specific behavior (direct field extraction, early return)
- Search endpoint needs different response format (results array vs answer)
- Avoids polluting form-filling logic with search-specific parameters

**Alternatives considered:**
- Extend `/fill-form` with `return_raw=true` parameter → Rejected, conflates two use cases
- Create `/api/v1/retrieve` → Equivalent but `/search` is more REST-idiomatic for AI agents

### 2. Response format

**Decision:** Return `results[]` with score breakdown

```json
{
  "results": [
    {
      "content": "5 years Python, Django, FastAPI...",
      "score": 0.82,
      "source": "resume",
      "scores": {
        "vector_score": 0.85,
        "bm25_score": 0.72,
        "rerank_score": 0.91
      }
    }
  ],
  "query": "Python experience",
  "total_retrieved": 5
}
```

**Rationale:**
- Agents need content + confidence to trust/use results
- Score breakdown enables threshold filtering (e.g., only use results with `score > 0.7`)
- `source` field distinguishes profile data from resume chunks

### 3. Toggle flags vs single `mode` parameter

**Decision:** Individual boolean flags per enhancement

```python
use_hyde: bool = True
use_reranking: bool = True
```

**Rationale:**
- More granular control for different agent use cases
- Easier to test individual components
- Defaults to full pipeline (best quality)

**Alternative:** `mode: "fast" | "balanced" | "quality"` → Rejected, less flexible

### 4. Reuse existing services

**Decision:** Call existing `RetrieverService.search_with_reranking()` and `hybrid_search()`

**Rationale:**
- No duplication of retrieval logic
- Settings-based defaults still apply (can override per-request)
- Maintains consistency between `/fill-form` and `/search`

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Agent over-reliance on search (no LLM generation) | Document that `/search` returns raw chunks, `/fill-form` returns generated answers |
| Score threshold calibration needed | Provide example responses with different confidence levels |
| Latency with all enhancements enabled | HyDE adds 1 LLM call; allow `use_hyde=false` for fast lookups |

## Open Questions

1. Should `/search` support filtering by document type (`source: profile | resume | skills`)?
2. Should we add caching for repeated queries (similar to existing HyDE cache)?
3. Do we need a streaming variant for large result sets?
