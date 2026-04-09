# RAG Search API Specification

## ADDED Requirements

### Requirement: Search endpoint accepts natural language queries

The system SHALL provide a `POST /api/v1/search` endpoint that accepts natural language search queries and returns ranked resume content chunks with relevance scores.

#### Scenario: Basic semantic search
- **WHEN** user sends `POST /api/v1/search` with `{"query": "Python experience"}`
- **THEN** system returns up to 5 resume chunks ranked by relevance, each containing `content`, `score`, and `source`

#### Scenario: Search with top_k parameter
- **WHEN** user sends `POST /api/v1/search` with `{"query": "skills", "top_k": 3}`
- **THEN** system returns exactly 3 results

### Requirement: Search supports configurable retrieval enhancements

The system SHALL allow toggling retrieval enhancements per-request via boolean flags.

#### Scenario: Search with HyDE enabled (default)
- **WHEN** user sends `POST /api/v1/search` with `{"query": "fastapi", "use_hyde": true}`
- **THEN** system generates hypothetical document, embeds it, and searches with both query and draft

#### Scenario: Search with HyDE disabled
- **WHEN** user sends `POST /api/v1/search` with `{"query": "django", "use_hyde": false}`
- **THEN** system searches only with the original query (faster, no LLM call)

#### Scenario: Search with reranking enabled (default)
- **WHEN** user sends `POST /api/v1/search` with `{"query": "experience", "use_reranking": true}`
- **THEN** system applies cross-encoder and/or LLM rubric reranking after initial retrieval

#### Scenario: Search with reranking disabled
- **WHEN** user sends `POST /api/v1/search` with `{"query": "education", "use_reranking": false}`
- **THEN** system returns raw hybrid search results without reranking

### Requirement: Search returns score breakdowns

The system SHALL return detailed score breakdowns in the `scores` object when `include_scores: true`.

#### Scenario: Score breakdown included
- **WHEN** user sends `POST /api/v1/search` with `{"query": "AWS", "include_scores": true}`
- **THEN** each result includes `scores` object with `vector_score`, `bm25_score`, and optionally `rerank_score`

#### Scenario: Score breakdown excluded
- **WHEN** user sends `POST /api/v1/search` with `{"query": "docker", "include_scores": false}`
- **THEN** each result does NOT include `scores` object (reduced response size)

### Requirement: Search response structure

The system SHALL return a consistent response structure with results array and metadata.

#### Scenario: Successful search response
- **WHEN** user sends valid search request
- **THEN** response contains:
  - `results`: array of result objects
  - `query`: echo of the original query
  - `total_retrieved`: count of results returned

### Requirement: Search error handling

The system SHALL handle errors gracefully with appropriate HTTP status codes and error messages.

#### Scenario: Empty query rejected
- **WHEN** user sends `POST /api/v1/search` with `{"query": ""}`
- **THEN** system returns HTTP 422 with validation error

#### Scenario: Query too long rejected
- **WHEN** user sends `POST /api/v1/search` with `{"query": "..."}` where length > 500 characters
- **THEN** system returns HTTP 422 with validation error

#### Scenario: Qdrant unavailable
- **WHEN** Qdrant service is unreachable during search
- **THEN** system returns HTTP 503 with "Service temporarily unavailable"

### Requirement: Search integrates with existing retrieval pipeline

The system SHALL reuse existing `RetrieverService` methods without duplicating logic.

#### Scenario: Hybrid search used when reranking disabled
- **WHEN** user sends `{"use_reranking": false}`
- **THEN** system calls `retriever.hybrid_search()` which combines vector + BM25

#### Scenario: Enhanced search used when reranking enabled
- **WHEN** user sends `{"use_reranking": true}`
- **THEN** system calls `retriever.search_with_reranking()` which applies full pipeline
