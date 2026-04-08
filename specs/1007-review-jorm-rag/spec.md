# Feature Specification: Review JORM Filler and RAG System

**Feature Branch**: `1007-review-jorm-rag`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "reheck the jorm filler and the underlying RAG system. make use off your skill for opencode on the topics. data has to come from qdrant db and no fallbacks in the fastapi"

## User Scenarios & Testing

### User Story 1 - Verify Data Source (Priority: P1)

As a user filling job application forms, I want the system to ONLY retrieve data from Qdrant vector database so that answers are fully grounded in my stored resume profile.

**Why this priority**: The user explicitly requires Qdrant-only data source - any fallback could introduce hallucinated or stale data.

**Independent Test**: Send a fill-form request with a known field label, verify response comes only from Qdrant results with no alternative data sources attempted.

**Acceptance Scenarios**:

1. **Given** Qdrant contains resume profile data, **When** I submit a fill-form request, **Then** the answer is generated ONLY from Qdrant retrieval results
2. **Given** Qdrant is available, **When** I submit any fill-form request, **Then** NO fallback to alternative data sources occurs (no hardcoded responses, no LLM-only generation without context)
3. **Given** Qdrant is DOWN, **When** I submit a fill-form request, **Then** the system returns appropriate error rather than falling back to non-Qdrant data

---

### User Story 2 - Review RAG Pipeline Components (Priority: P1)

As a developer, I want to understand each component in the RAG pipeline so I can identify issues and optimization opportunities.

**Why this priority**: Understanding the current architecture enables targeted improvements.

**Independent Test**: Each component can be tested independently with mock inputs and verified outputs.

**Acceptance Scenarios**:

1. **Given** a form field label, **When** it passes through embedder, **Then** a valid embedding vector is generated
2. **Given** an embedding vector, **When** it passes through retriever, **Then** relevant chunks from Qdrant are returned with scores
3. **Given** context chunks, **When** they pass through generator, **Then** a grounded answer is generated referencing the context

---

### User Story 3 - Verify No Fallback Patterns (Priority: P1)

As a user requiring accurate form filling, I want the system to NOT use fallback data sources so answers are traceable to my actual profile data.

**Why this priority**: Fallbacks introduce untraceable data that may not reflect the user's actual profile.

**Independent Test**: All code paths can be traced - no hidden fallback to default/static data.

**Acceptance Scenarios**:

1. **Given** any code path in fill-form, **When** data is returned, **Then** it can be traced to Qdrant source
2. **Given** the user profile has missing fields, **When** a field is requested, **Then** the system clearly indicates "no data available" rather than providing invented data
3. **Given** context chunks are insufficient, **When** answer is generated, **Then** the confidence level reflects this (NONE) rather than hallucinating

---

### User Story 4 - Implement Hybrid Retrieval Best Practices (Priority: P2)

As a developer, I want to apply hybrid retrieval best practices from industry research so the system retrieves more accurate and relevant context.

**Why this priority**: Incorporate proven techniques from RAG research to reduce hallucinations and improve relevance.

**Independent Test**: New retrieval approaches can be A/B tested against current implementation.

**Acceptance Scenarios**:

1. **Given** a query with exact technical terms, **When** retrieved, **Then** hybrid search balances semantic similarity with keyword matching
2. **Given** a query, **When** retrieved, **Then** reranking by embedding similarity improves relevance
3. **Given** the query is short (< 3 chars), **When** retrieved, **Then** the system uses pure vector search (no BM25 possible)

---

### Edge Cases

- What happens when Qdrant collection doesn't exist? → Returns empty results with NONE confidence
- What happens when query returns zero results? → Returns "no data available" message
- What happens when embedding generation fails? → Returns 503 Service Unavailable
- What happens when the profile chunk is missing? → Returns empty but continues with other chunks
- How does the system handle very long field labels? → Truncates at request level (10KB limit)
- How does the system handle non-English content? → Uses Mistral embeddings which support multilingual

## Requirements

### Functional Requirements

- **FR-001**: System MUST retrieve ALL data from Qdrant vector database
- **FR-002**: System MUST NOT have any fallback patterns to alternative data sources (hardcoded responses, default values, LLM-only generation without context). **The fallback at retriever.py:137-138 will be removed during implementation.**
- **FR-003**: When Qdrant returns no results, system MUST return "no data available" with NONE confidence (not hallucinate)
- **FR-004**: All retrieval paths must be traceable to Qdrant source ID
- **FR-005**: System MUST support hybrid retrieval (BM25 + vector) as currently implemented
- **FR-006**: Embedder MUST use Mistral embeddings (current implementation)
- **FR-007**: Generator MUST only generate answers grounded in retrieved context (Constitution III compliance)
- **FR-008**: Field classifier MUST extract field values directly from Qdrant payloads for known field types
- **FR-009**: Profile chunk retrieval MUST include profile data for direct field extraction
- **FR-010**: System MUST log source attribution for all retrieval results
- **FR-011**: System MAY implement HyDE (hypothetical document embeddings) for enhanced retrieval (defer to future enhancement)
- **FR-012**: System MAY implement embedding reranking after initial retrieval (defer to future enhancement)
- **FR-013**: System MAY implement LLM rubric reranking for critical fields (defer to future enhancement)

### Key Entities

- **FormField**: The input field from the job application (label, signals)
- **EmbeddingVector**: 1024-dimensional vector from Mistral embedder
- **RetrievedChunk**: Context chunk from Qdrant with score and payload
- **ProfileData**: Structured resume data (name, email, phone, address, etc.)
- **GeneratedAnswer**: LLM-generated answer grounded in context
- **ConfidenceLevel**: HIGH/MEDIUM/LOW/NONE based on retrieval quality

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of fill-form responses are traceable to Qdrant source (verified by source ID in response)
- **SC-002**: Zero fallback patterns exist in the codebase (code review). The fallback at retriever.py:137-138 will be removed - verify in review.
- **SC-003**: When Qdrant returns no relevant chunks, confidence is NONE (not hallucinated)
- **SC-004**: System retrieves top-K results (configurable, default: 5) from Qdrant for context
- **SC-005**: Hybrid search weights are configurable (current: HYBRID_VECTOR_WEIGHT, HYBRID_BM25_WEIGHT)

## Architecture Overview

### Current Pipeline Components

The RAG pipeline consists of 4 main services:

1. **Embedder Service** (`src/services/embedder.py`): Generates 1024-dim embeddings using Mistral `mistral-embed` model
2. **Retriever Service** (`src/services/retriever.py`): Hybrid search (vector + BM25) against Qdrant, includes profile chunk retrieval
3. **Generator Service** (`src/services/generator.py`): LLM answer generation with anti-hallucination prompts
4. **Field Classifier** (`src/services/field_classifier.py`): Direct field extraction from Qdrant payloads for known types

### Code Locations

- `/fill-form` endpoint: `src/api/routes.py` lines 50-189
- Hybrid search: `src/services/retriever.py` lines 56-138
- Profile chunk retrieval: `src/services/retriever.py` lines 140-168
- Direct field extraction: `src/services/fill_form.py` lines 52-61
- Field value extraction: `src/services/field_classifier.py` lines 294-381

### Identified Potential Fallback Patterns to Review

| Location | Pattern | Concern Level | Resolution |
|----------|---------|--------------|------------|
| `retriever.py:137-138` | `logger.warning(f"Hybrid search failed, falling back to vector...")` | MEDIUM - error fallback | **CONFIRMED: Remove this fallback pattern** |
| `retriever.py:49-54` | Empty results when collection doesn't exist | LOW - returns empty, not fallback | Acceptable - proper empty state |
| `routes.py:94-101` | profile chunk fetch with error handling | LOW - proper error propagation | Acceptable - error propagation |
| `generator.py` | "I don't have information..." without retrieval | LOW - only after failed retrieval | Acceptable - only after failed retrieval |

## Glossary

| Term | Definition |
|------|------------|
| **Fallback** (in this spec) | Alternative data source (hardcoded response, default value, LLM-only without context) - prohibited by FR-002 |
| **Fallback** (Constitution Section 5) | Degraded-mode cache for reliability - permitted for service resilience |

## Assumptions

- Qdrant vector database is the single source of truth for profile data
- Missing fields in profile should result in "no data" response, not invented data
- The system should maintain Constitution III compliance (only generate from retrieved context)
- Hybrid search is preferred over pure vector or pure BM25

## Appendix: Reference Patterns from Research

From "Stop the Hallucinations: Hybrid Retrieval with BM25, pgvector, embedding rerank, LLM Rubric Rerank & HyDE" (Rick Hightower, May 2025):

1. **Hybrid retrieval**: Combine BM25 (keyword) + vector (semantic) scores with configurable weights
2. **HyDE (optional)**: Generate hypothetical answer first, embed that for retrieval
3. **Embedding rerank**: Rerank by cosine similarity to query embedding
4. **LLM rubric rerank**: Use LLM to score against domain-specific rubric (for hiring/selection scenarios)
5. **Query expansion**: Inject synonyms for better BM25 matching
6. **MMR (Maximal Marginal Relevance)**: Promote diversity in results

Key insight: "Pure vector search is magical, but it's not omniscient. Exact tokens, rare identifiers, and repetitive boilerplate still benefit from old-school lexical ranking."

## Expected Output Artifacts

After implementation, the following artifacts will be generated:
- **findings.md**: Code review findings report documenting all review results, code issues, and future recommendations

## Clarifications

### Session 2026-04-08

- Q: Should the system implement HyDE, embedding rerank, or LLM rubric reranking? → A: These are optional future enhancements, defer for now. These additions would enhance accuracy but add latency/cost.
- Q: The identified fallback pattern at retriever.py:137-138 contradicts FR-002 (no fallbacks). Should it be removed? → A: Remove fallback - Propagate errors, enforce strict Qdrant-only

### Coverage Summary

| Category | Status |
|----------|-------|
| Functional Scope & Behavior | Clear |
| Domain & Data Model | Clear |
| Interaction & UX Flow | Clear |
| Non-Functional Quality | Deferred (not critical for review task) |
| Integration & External | Clear |
| Edge Cases | Clear |
| Constraints | Clear |
| Terminology | Clear |
| Completion Signals | Clear |