# Tasks: Review JORM Filler and RAG System

**Branch**: `1007-review-jorm-rag` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Input**: Review fill-form endpoint and underlying RAG system - verify Qdrant-only data source, no fallbacks

---

## Task Overview

This is a **code review task** - no new implementation required. The goal is to verify:
1. All data comes from Qdrant vector database (no fallbacks)
2. Hybrid search implementation is correct
3. Future enhancements can be deferred

**Total Estimated Duration**: 2-3 hours (manual code review)
**Dependencies**: None - all services already exist

---

## Phase 1: Verify Qdrant-Only Data Source

**Goal**: Trace all data paths to ensure Qdrant is the only source

### Independent Test Criteria
- [ ] All fill-form responses include Qdrant source ID
- [ ] No hardcoded response paths exist
- [ ] Embedder generates valid 1024-dim vectors
- [ ] Retriever returns chunks with scores from Qdrant

### Tasks

- [ ] T001 [P] Review fill-form endpoint in src/api/routes.py - trace all data paths to Qdrant
- [ ] T002 [P] Review retriever service in src/services/retriever.py - verify all retrieval goes through Qdrant
- [ ] T003 [P] Review embedder service in src/services/embedder.py - verify Mistral embeddings used correctly
- [ ] T004 Review generator service in src/services/generator.py - verify only generates from retrieved context

---

## Phase 2: Verify No Fallback Patterns

**Goal**: Identify and document ALL fallback patterns; remove the identified fallback at retriever.py:137-138

### Independent Test Criteria
- [ ] All fallback patterns identified and documented
- [ ] Fallback at retriever.py:137-138 removed
- [ ] Confidence calculation logic reviewed
- [ ] Field extraction reviewed for direct Qdrant access

### Tasks

- [ ] T005 [P] Identify and document ALL fallback patterns in codebase
- [ ] T006 Review src/services/retriever.py lines 137-138 - the identified error fallback for removal
- [ ] T007 Review src/services/fill_form.py - confidence calculation logic
- [ ] T008 Review src/services/field_classifier.py - direct field extraction from Qdrant payloads

---

## Phase 3: Verify Hybrid Search Implementation

**Goal**: Confirm hybrid search (BM25 + vector) is correctly implemented

### Independent Test Criteria
- [ ] HYBRID_VECTOR_WEIGHT and HYBRID_BM25_WEIGHT configuration reviewed
- [ ] BM25 implementation in retriever verified
- [ ] Profile chunk retrieval logic verified

### Tasks

- [ ] T009 [P] Review hybrid search weights configuration (HYBRID_VECTOR_WEIGHT, HYBRID_BM25_WEIGHT)
- [ ] T010 [P] Review sparse vector / BM25 implementation in retriever
- [ ] T011 Review profile chunk retrieval logic in retriever.py

---

## Phase 4: Document Findings & Recommendations

**Goal**: Create comprehensive findings report

### Independent Test Criteria
- [ ] Findings report created with all review results
- [ ] Code issues documented with file locations
- [ ] Future enhancement recommendations documented

### Tasks

- [ ] T012 Create findings report documenting all review results in src/services/
- [ ] T013 Document any code issues found (fallbacks, bugs) with file:line references
- [ ] T014 Document future enhancement recommendations (HyDE, embedding rerank, LLM rubric)

---

## Dependencies

```
Phase 1 (T001-T004) ─┬─► Phase 2 (T005-T008) ─┬─► Phase 3 (T009-T011) ─┬─► Phase 4 (T012-T014)
                     │                        │                        │
                     └────────────────────────┴────────────────────────┘
```

**Note**: Phases are sequential - each phase builds on findings from the previous.

---

## Parallel Execution

**Within Phase 1** (T001-T004):
- T001, T002, T003 can run in parallel - different files, no dependencies

**Within Phase 2** (T005-T008):
- T005 and T006 can run in parallel - different focus areas

**Within Phase 3** (T009-T011):
- T009 and T010 can run in parallel - different aspects of hybrid search

---

## Key Files Under Review

| File | Lines | Purpose |
|------|-------|---------|
| `src/api/routes.py` | 50-189 | fill-form endpoint |
| `src/services/retriever.py` | 56-138 | Hybrid Qdrant retrieval |
| `src/services/retriever.py` | 140-168 | Profile chunk retrieval |
| `src/services/fill_form.py` | 52-61 | Context assembly & confidence |
| `src/services/field_classifier.py` | 294-381 | Direct field value extraction |
| `src/services/embedder.py` | - | Mistral embedding generation |
| `src/services/generator.py` | - | LLM answer generation |

---

## Verification Criteria

### For Completion (ALL must pass)
- [ ] All code paths traced to Qdrant source
- [ ] All fallback patterns identified and documented
- [ ] Hybrid search implementation reviewed
- [ ] Findings report created

### Success Metrics
- **SC-001**: 100% of fill-form responses traceable to Qdrant source (verified by source ID in response)
- **SC-002**: Zero fallback patterns exist - the fallback at retriever.py:137-138 removed
- **SC-003**: NONE confidence when no results (not hallucinated)

---

## Notes

- **Testing**: Not applicable - this is a code review task, not new implementation. Constitution testing rule (Section 9) applies to new/modified code, not review activities.
- **HyDE, embedding rerank, LLM rubric reranking**: Deferred as optional future enhancements (FR-011, FR-012, FR-013)
- **Key decision point**: The fallback pattern at `retriever.py:137-138` was decided to be removed - verify this in review
- **No implementation changes** - this is purely a code review task

---

*Generated: 2026-04-08*
