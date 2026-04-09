## 1. API Schema Definition

- [x] 1.1 Add `SearchRequest` Pydantic model to `src/api/schemas.py` with fields: `query`, `use_hyde`, `use_reranking`, `top_k`, `include_scores`
- [x] 1.2 Add `SearchResult` Pydantic model with fields: `content`, `score`, `source`, `scores` (optional)
- [x] 1.3 Add `SearchResponse` Pydantic model with fields: `results`, `query`, `total_retrieved`

## 2. Endpoint Implementation

- [x] 2.1 Create `POST /api/v1/search` route handler in `src/api/routes.py`
- [x] 2.2 Implement query embedding using existing `embedder.embed()`
- [x] 2.3 Implement conditional retrieval: call `search_with_reranking()` or `hybrid_search()` based on flags
- [x] 2.4 Format results with score breakdown when `include_scores: true`
- [x] 2.5 Add error handling for validation errors (422), Qdrant unavailable (503)

## 3. Integration

- [x] 3.1 Import new schemas in `src/api/routes.py`
- [x] 3.2 Add router prefix `/api/v1` if not already configured
- [x] 3.3 Verify existing `/fill-form` endpoint still works unchanged

## 4. Testing

- [x] 4.1 Add unit tests for `SearchRequest` validation
- [x] 4.2 Add integration test for basic search: `POST /api/v1/search` with query → returns results
- [x] 4.3 Add integration test for score breakdown: `include_scores: true` → response contains `scores`
- [x] 4.4 Add integration test for validation: empty query → 422 error

## 5. n8n Integration (Documentation)

- [x] 5.1 Document HTTP Request tool configuration for n8n AI agent
- [x] 5.2 Provide example request/response for agent prompt engineering
