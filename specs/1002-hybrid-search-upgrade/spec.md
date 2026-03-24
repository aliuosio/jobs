# Feature Specification: Hybrid Search Upgrade for Retriever Service

**Feature Branch**: `1002-hybrid-search-upgrade`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Add hybrid search (70% vector + 30% BM25 with phrase bonus) to the retriever-service to improve search quality for domain-specific terms and internal abbreviations that pure vector search fails to match."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Domain-specific term matching (Priority: P1)

A user searches for internal company terms or abbreviations (e.g., "BV-KI", "TechStack-2024") that don't have meaningful vector representations. Pure vector search returns irrelevant results because the embedding model doesn't understand these domain-specific terms. Hybrid search combines vector similarity with BM25 exact matching to find relevant documents.

**Why this priority**: This is the core problem described in the article. Pure vector search fails on domain-specific terminology that lacks semantic meaning in general embedding models.

**Independent Test**: Can be tested by querying with domain-specific abbreviations and verifying BM25 component finds exact matches while vector component provides semantic context.

**Acceptance Scenarios**:

1. **Given** resume contains "BV-KI project experience", **When** API receives query "BV-KI", **Then** hybrid search returns the relevant chunk with higher score than pure vector search
2. **Given** resume contains company-specific tech stack names, **When** API receives query with exact tech name, **Then** BM25 component boosts exact matches in results
3. **Given** query contains mixed known/unknown terms, **When** hybrid search executes, **Then** results combine semantic relevance (vector) with exact matches (BM25)

---

### User Story 2 - Phrase bonus for multi-word queries (Priority: P2)

Users often search with multi-word phrases like "project management experience" or "React development". BM25 with phrase bonus gives higher scores when words appear together in the same order, improving result quality.

**Why this priority**: Phrase matching significantly improves search quality for common multi-word queries in job applications.

**Independent Test**: Can be tested with multi-word queries and verifying phrase proximity affects scoring.

**Acceptance Scenarios**:

1. **Given** resume contains "5 years project management experience", **When** API receives query "project management", **Then** phrase bonus boosts chunks where words appear together
2. **Given** resume has "management" and "project" in separate sections, **When** API receives query "project management", **Then** phrase bonus prefers contiguous matches over scattered occurrences

---

### User Story 3 - Configurable hybrid weights (Priority: P3)

Different use cases may require different vector/BM25 ratios. The system should support configurable weighting (e.g., 70/30, 50/50, 80/20) via environment variables.

**Why this priority**: Allows tuning for different domains without code changes.

**Independent Test**: Can be tested by changing configuration and verifying different result rankings.

**Acceptance Scenarios**:

1. **Given** HYBRID_VECTOR_WEIGHT=0.7 and HYBRID_BM25_WEIGHT=0.3, **When** search executes, **Then** final score = 0.7 * vector_score + 0.3 * bm25_score
2. **Given** HYBRID_VECTOR_WEIGHT=1.0, **When** search executes, **Then** system behaves like pure vector search (backward compatible)

---

### Edge Cases

- What happens when sparse vector is empty (no BM25 tokens)? → Fall back to pure vector search
- How to handle very short queries (1-2 characters)? → Skip BM25, use vector only
- What if Qdrant doesn't support sparse vectors (old version)? → Log warning, fall back to pure vector
- How to handle Unicode/special characters in queries? → BM25 tokenizer handles Unicode; test with German umlauts

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The retriever-service MUST support hybrid search combining dense vectors with sparse (BM25) vectors
- **FR-002**: The system MUST use Qdrant's native hybrid query API (v1.10+) for sparse-dense fusion
- **FR-003**: The system MUST support configurable hybrid weights via environment variables (HYBRID_VECTOR_WEIGHT, HYBRID_BM25_WEIGHT)
- **FR-004**: Default weights MUST be 0.7 vector / 0.3 BM25 (as per article recommendation)
- **FR-005**: The system MUST implement phrase bonus for multi-word queries in BM25 scoring
- **FR-006**: The backend MUST generate sparse vectors at profile ingestion time and store them alongside dense vectors in Qdrant
- **FR-007**: The system MUST fall back to pure vector search if sparse vectors unavailable
- **FR-008**: Response time MUST remain under 5 seconds for hybrid queries
- **FR-009**: The API MUST log combined_score and any warnings/errors for debugging (minimal logging - no score breakdown exposed)
- **FR-010**: The system MUST maintain backward compatibility with existing collection (pure vector search)

### Key Entities *(include if feature involves data)*

- **SparseVector**: Qdrant sparse vector containing token indices and BM25-weighted values
- **HybridSearchResult**: Search result with separate vector_score, bm25_score, and combined_score
- **HybridWeights**: Configuration for vector/BM25 weight ratio (default 0.7/0.3)
- **TokenizedQuery**: Query text tokenized for BM25 matching with phrase positions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Domain-specific term queries (abbreviations, internal names) return relevant results with 80%+ precision
- **SC-002**: Hybrid search latency is within 10% of pure vector search (<500ms overhead) measured with warm cache (Qdrant already running)
- **SC-003**: Phrase queries show 20%+ improvement in result relevance vs pure vector
- **SC-004**: Zero breaking changes to existing API response schema
- **SC-005**: All existing tests pass with hybrid search enabled

---

### Assumptions

- Qdrant version supports sparse vectors (v1.10+) - currently using latest image
- Mistral embeddings remain the dense vector provider (1024 dimensions)
- Sparse vectors will be generated using a tokenizer compatible with BM25 (e.g., SPLADE or simple tokenization)
- Existing resume collection will need re-ingestion with sparse vectors
- Firefox extension requires no changes (API contract unchanged)

---

## Clarifications

### Session 2026-03-24

- Q: Sparse vector generation method? → A: Use Qdrant's built-in sparse embedding or implement BM25 tokenization in n8n import workflow
- Q: Re-ingest all data? → A: Yes, sparse vectors must be stored at ingestion time; plan for migration
- Q: Backward compatibility? → A: API response unchanged; existing pure vector search available as fallback
- Q: Phrase bonus implementation? → A: Use Qdrant's sparse query with phrase matching or implement custom scoring
- Q: Expected data scale? → A: Small (<1K documents) - simplifies collection design, no sharding needed
- Q: Sparse vector generation approach? → A: Custom BM25 tokenizer - full control over phrase bonus and scoring logic
- Q: n8n integration approach? → A: Backend-only generation - sparse vectors generated in FastAPI backend at ingestion time
- Q: Observability level? → A: Minimal logging - log combined_score and warnings/errors only; no exposed scores in API