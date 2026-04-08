# Data Model: RAG System Hybrid Retrieval Enhancements

**Feature**: 1008-rag-hybrid-upgrades  
**Date**: 2026-04-08

---

## New Entities

### 1. RetrievalConfig

Stores configuration for hybrid retrieval enhancements.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hyde_enabled` | bool | Yes | Enable/disable HyDE |
| `hyde_cache_ttl` | int | Yes | Cache TTL for HyDE drafts (seconds) |
| `embedding_rerank_enabled` | bool | Yes | Enable/disable cross-encoder reranking |
| `embedding_rerank_top_k` | int | Yes | Number of candidates to rerank |
| `llm_rerank_enabled` | bool | Yes | Enable/disable LLM rubric reranking |
| `llm_rerank_top_k` | int | Yes | Number of candidates for LLM reranking |
| `mmr_enabled` | bool | Yes | Enable/disable MMR diversification |
| `mmr_lambda` | float | Yes | MMR balance parameter (0-1) |
| `vector_weight` | float | Yes | Weight for vector similarity |
| `bm25_weight` | float | Yes | Weight for BM25 scores |
| `rerank_weight` | float | Yes | Weight for reranking scores |

**Configuration Source**: Environment variables with defaults in `src/config.py`

---

### 2. HyDEGenerator

Creates hypothetical answer drafts from user queries.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | LLM model for generation (default: mistral-small-latest) |
| `max_tokens` | int | Yes | Max tokens in hypothetical doc (default: 200) |
| `temperature` | float | Yes | Generation temperature (default: 0.7) |

**Key Methods**:
- `generate(query: str) -> str`: Generate hypothetical answer
- `generate_with_fallback(query: str) -> str`: Fall back to query if generation fails

---

### 3. RerankerPool

Manages both embedding-based and LLM-based reranking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cross_encoder_model` | string | Yes | Cross-encoder model name |
| `llm_model` | string | Yes | LLM model for rubric reranking |
| `rubric_prompt` | string | Yes | Rubric prompt template |

**Key Methods**:
- `embedding_rerank(query: str, candidates: list[dict]) -> list[dict]`: Cross-encoder reranking
- `llm_rerank(query: str, candidates: list[dict]) -> list[dict]`: LLM rubric reranking
- `combined_rerank(query: str, candidates: list[dict]) -> list[dict]`: Both stages

---

### 4. QueryCache

Caches processed queries, HyDE drafts, and reranking results.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hyde_cache` | dict | Yes | Cache for HyDE drafts |
| `rerank_cache` | dict | Yes | Cache for reranking results |
| `max_size` | int | Yes | Maximum cache entries |
| `ttl` | int | Yes | Default TTL for cache entries |

**Key Methods**:
- `get_hyde(query_hash: str) -> str | None`: Get cached HyDE draft
- `set_hyde(query_hash: str, draft: str)`: Cache HyDE draft
- `get_rerank(query_hash: str, doc_id: str) -> float | None`: Get cached rerank score
- `set_rerank(query_hash: str, doc_id: str, score: float)`: Cache rerank score

---

## Validation Rules

1. **RetrievalConfig**:
   - All weight fields must be between 0.0 and 1.0
   - `_top_k` fields must be positive integers
   - `mmr_lambda` must be between 0.0 and 1.0

2. **HyDEGenerator**:
   - `max_tokens` must be between 50 and 500
   - `temperature` must be between 0.0 and 1.0

3. **QueryCache**:
   - `max_size` must be positive
   - `ttl` must be positive

---

## State Transitions

### Retrieval Pipeline State Machine

```
IDLE → EMBEDDING → HYDE_GENERATING → HYDE_EMBEDDING → VECTOR_SEARCH → BM25 → 
EMBEDDING_RERANK → LLM_RERANK → MMR → RETURN_RESULTS
```

Each state can transition to `ERROR` on failure, which triggers fallback to previous stage.

---

## Data Volume & Scale

- **Queries**: Single-user (form filling), ~100-1000 queries/day
- **Cache**: Max 1000 entries (configurable)
- **HyDE drafts**: ~200 chars average
- **Reranking**: Top 50 candidates → Top 10 → Top 5 final

---

## Existing Entities (for reference)

| Entity | Source | Notes |
|--------|--------|-------|
| JobOffer | job_offers.py | PostgreSQL - not modified |
| Profile | Qdrant payload | Not modified |
| Chunk | Qdrant payload | Not modified |