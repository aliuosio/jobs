# Feature Specification: RAG System Hybrid Retrieval Enhancements

**Feature Branch**: `1008-rag-hybrid-upgrades`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "read this article to find ways to improve our RAG system. use ulw. use skills for opencode. use @specs/1007-review-jorm-rag/findings.md to see the current implementation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduce LLM Hallucinations (Priority: P1)

As a user filling job application forms, I want the RAG system to provide accurate, grounded answers so that I don't get fabricated information that could hurt my application.

**Why this priority**: Hallucinations directly impact the reliability of the form-filling system. If the system provides wrong information, users could submit incorrect applications.

**Independent Test**: Can be fully tested by submitting various form field queries and verifying the answers are directly traceable to the source documents with high confidence.

**Acceptance Scenarios**:

1. **Given** the system has no relevant context for a query, **When** a user requests a field answer, **Then** the system returns "I don't have information about that" with NONE confidence level (no hallucination)
2. **Given** the user queries contain exact phrases from resume, **When** hybrid search is used, **Then** the system prioritizes exact keyword matches over semantic similarity
3. **Given** the retrieved context has conflicting information, **When** LLM rubric reranking is applied, **Then** the most relevant passage is prioritized based on explicit relevance criteria

---

### User Story 2 - Improve Retrieval Relevance (Priority: P2)

As a user with complex form fields, I want the system to find the most relevant information even when my query uses different words than the source documents.

**Why this priority**: Users often describe their experience in ways that differ from how it's written in their resume. Better retrieval ensures more fields can be filled accurately.

**Independent Test**: Can be tested by querying with paraphrased descriptions and verifying the correct information is retrieved.

**Acceptance Scenarios**:

1. **Given** a resume mentions "JavaScript" but user asks about "JS experience", **When** HyDE generates a hypothetical answer, **Then** the retrieval finds the JavaScript section
2. **Given** a query returns 10 similar results about the same topic, **When** MMR is applied, **Then** results are diversified to cover different aspects
3. **Given** initial vector search returns top-100 results, **When** embedding reranker is applied, **Then** results are re-scored by cross-encoder for better relevance

---

### User Story 3 - Maintain Fast Response Times (Priority: P3)

As a user filling multiple form fields, I want the system to remain responsive even with enhanced retrieval techniques.

**Why this priority**: Users expect instant form filling. Adding reranking layers shouldn't significantly increase latency.

**Independent Test**: Can be tested by measuring end-to-end response time with various enhancement techniques enabled.

**Acceptance Scenarios**:

1. **Given** hybrid search with reranking is enabled, **When** a fill-form request is made, **Then** the response completes in under 3 seconds
2. **Given** LLM rubric reranking is used, **When** processing top-10 candidates, **Then** the cost remains under $0.10 per request
3. **Given** caching is implemented, **When** the same query is repeated, **Then** subsequent responses return from cache

---

### Edge Cases

- What happens when HyDE generates an empty or invalid hypothetical answer?
- How does the system handle very short queries (1-2 words) that have limited semantic value?
- What happens when embedding reranking fails due to API errors?
- How does the system behave when all candidates fail the LLM rubric threshold?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement HyDE (Hypothetical Document Embeddings) to improve semantic retrieval by generating hypothetical answers before embedding the query
- **FR-002**: System MUST implement embedding-based cross-encoder reranking to re-score initial retrieval results for improved relevance
- **FR-003**: System MUST implement LLM rubric reranking to score top candidates against explicit relevance criteria using an LLM
- **FR-004**: System MUST implement MMR (Maximal Marginal Relevance) to diversify retrieval results and avoid duplicate content
- **FR-005**: System MUST provide configurable weights for combining different retrieval signals (vector, BM25, reranking)
- **FR-006**: System MUST maintain sub-3-second response time even with all enhancement techniques enabled
- **FR-007**: System MUST gracefully degrade when enhancement techniques fail (fall back to baseline retrieval)
- **FR-008**: System MUST cache HyDE-generated drafts and reranking results to reduce API costs

### Key Entities

- **RetrievalConfig**: Stores weights for vector search, BM25, and reranking; enables/disables each technique
- **HyDEGenerator**: Creates hypothetical answer drafts from user queries using the LLM
- **RerankerPool**: Manages both embedding-based and LLM-based reranking with fallback logic
- **QueryCache**: Caches processed queries, HyDE drafts, and reranking results

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can fill form fields with answers that are directly traceable to source documents (100% of answers traceable to Qdrant)
- **SC-002**: Hybrid retrieval with enhancements reduces hallucination rate to zero (NONE confidence when no data)
- **SC-003**: User queries with paraphrased language successfully retrieve correct information (measured by relevance scoring)
- **SC-004**: System maintains average response time under 3 seconds for fill-form requests
- **SC-005**: LLM rubric reranking improves top-1 result relevance by at least 20% compared to baseline retrieval

---

## Assumptions

The current Qdrant-only architecture is maintained. Enhancements build upon the existing hybrid search rather than replacing Qdrant with pgvector.

## Open Questions

None identified - all requirements are testable with clear acceptance criteria.