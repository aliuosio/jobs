# Tasks: Hybrid Search Upgrade

**Feature**: Hybrid Search Upgrade (70% Vector + 30% BM25)
**Goal**: Improve search quality for domain-specific terms using hybrid search

---

## Phase 1: Setup

- [X] T001 Verify Qdrant version supports sparse vectors (v1.10+) by checking docker-compose.yml
- [X] T002 [P] Verify Qdrant hybrid query API availability via test script
- [X] T003 Verify Mistral embedding service is running for dense vector generation

---

## Phase 2: Foundational

- [X] T004 Add hybrid search environment variables to `src/config.py`
- [X] T005 Update `.env.example` with HYBRID_VECTOR_WEIGHT, HYBRID_BM25_WEIGHT, HYBRID_PHRASE_BONUS, HYBRID_ENABLED
- [X] T006 Create SparseVector Pydantic model in `src/api/schemas.py`
- [X] T007 Create HybridWeights configuration model in `src/api/schemas.py`

---

## Phase 3: User Story 1 - Domain-specific term matching (P1)

**Goal**: Enable hybrid search combining dense vectors with sparse BM25 vectors for domain-specific term matching
**Independent Test**: Query with "BV-KI" and verify relevant chunk returned with higher score than pure vector search

### Implementation

- [X] T008 [P] [US1] Create `src/services/sparse_tokenizer.py` with BM25 tokenization (include type hints per Constitution §1)
- [X] T009 [US1] Implement tokenization with stopword removal in sparse_tokenizer.py (add type hints per Constitution §1)
- [X] T010 [US1] Implement TF-IDF weighting calculation in sparse_tokenizer.py (add type hints per Constitution §1)
- [X] T011 [P] [US1] Add sparse vector generation method to `src/services/embedder.py` (add type hints per Constitution §1)
- [X] T011a [US1] Integrate sparse vector generation into profile ingestion endpoint in `src/api/routes.py` (add type hints per Constitution §1)
- [X] T012 [US1] Update Qdrant collection schema to include sparse vectors config in retriever.py (add type hints per Constitution §1)
- [X] T013 [US1] Implement hybrid query method combining dense + sparse vectors in retriever.py (add type hints per Constitution §1)
- [X] T014 [US1] Implement hybrid scoring: combined_score = vector_weight * vector_score + bm25_weight * bm25_score (add type hints per Constitution §1)
- [X] T015 [US1] Add fallback to pure vector search when sparse vectors unavailable in retriever.py (add type hints per Constitution §1)

### Tests

- [X] T016 [US1] Create unit test for BM25 tokenization in tests/unit/test_sparse_tokenizer.py
- [X] T017 [US1] Create unit test for hybrid scoring calculation in tests/unit/test_hybrid_scoring.py
- [X] T018 [US1] Create integration test for hybrid search end-to-end in tests/integration/test_hybrid_search.py
- [ ] T019 [US1] Verify domain-specific term "BV-KI" returns relevant result in integration test

---

## Phase 4: User Story 2 - Phrase bonus for multi-word queries (P2)

**Goal**: Boost scores when query words appear together in documents for multi-word queries
**Independent Test**: Query "project management" and verify phrase-matched chunks score higher

### Implementation

- [X] T020 [US2] Implement phrase detection function in sparse_tokenizer.py (add type hints per Constitution §1)
- [X] T021 [US2] Implement phrase bonus calculation (exact phrase = 2x bonus, partial = 0.5x bonus) (add type hints per Constitution §1)
- [X] T022 [US2] Integrate phrase bonus into hybrid scoring in retriever.py (add type hints per Constitution §1)

### Tests

- [ ] T023 [US2] Create unit test for phrase detection in tests/unit/test_sparse_tokenizer.py
- [ ] T024 [US2] Create integration test for phrase bonus in tests/integration/test_phrase_bonus.py
- [ ] T025 [US2] Verify "project management" query boosts contiguous match over scattered match

---

## Phase 5: User Story 3 - Configurable hybrid weights (P3)

**Goal**: Support configurable vector/BM25 weight ratio via environment variables
**Independent Test**: Change HYBRID_VECTOR_WEIGHT to 0.5 and verify different result rankings

### Implementation

- [X] T026 [US3] Add weight configuration validation (weights must sum to 1.0) in config.py
- [X] T027 [US3] Support backward compatibility: HYBRID_VECTOR_WEIGHT=1.0 enables pure vector mode in retriever.py

---

## Phase 6: Data Migration

- [X] T028 Create migration script to re-generate sparse vectors for existing collection in scripts/migrate_sparse_vectors.py
- [X] T029 Run migration script to re-ingest resume data with sparse vectors
- [X] T030 Verify data integrity: count and sample sparse vectors in Qdrant

---

## Phase 7: Edge Cases & Performance

- [X] T031 [P] Handle very short queries (1-2 characters) - skip BM25, use vector only in retriever.py
- [X] T032 Handle Unicode/special characters in queries - verify BM25 tokenizer handles German umlauts
- [X] T033 Handle Qdrant version without sparse vector support - log warning, fall back to pure vector (covered by T015)

### Performance

- [X] T034 Run performance benchmark: verify <500ms overhead vs pure vector search in tests/performance/

---

## Phase 8: Documentation & Deployment

- [X] T036 Update `docs/technical-overview.md` with hybrid search architecture
- [X] T037 Add logging for combined_score and warnings in retriever.py per FR-009 (use structlog per Constitution §7)
- [X] T038 Verify backward compatibility: existing API response schema unchanged (SC-004)

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1: Hybrid Search)
    ↓
Phase 4 (US2: Phrase Bonus)
    ↓
Phase 5 (US3: Configurable Weights)
    ↓
Phase 6 (Data Migration)
    ↓
Phase 7 (Edge Cases)
    ↓
Phase 7b (Performance)
    ↓
Phase 8 (Documentation)
```

---

## Parallel Opportunities

- T004, T006, T007 can run in parallel (config, models - no dependencies)
- T008, T011 can run in parallel (sparse_tokenizer creation, embedder update)
- T016, T017, T018 can run in parallel (unit tests independent)
- US2 and US3 can run in parallel after US1 core tasks (T008-T015) complete

---

## MVP Scope (User Story 1 Only)

For MVP, complete: Phase 1 → Phase 2 → Phase 3 (T008-T015) → Phase 6 → Phase 7 (T031-T034) → Phase 8

This provides:
- Core hybrid search functionality
- Domain-specific term matching
- Fallback to pure vector search
- Basic data migration

**Estimated MVP Time**: ~2 days

---

## Total Task Count

| Phase | Tasks | Notes |
|-------|-------|-------|
| Phase 1: Setup | T001-T003 | 3 tasks |
| Phase 2: Foundational | T004-T007 | 4 tasks |
| Phase 3: US1 | T008-T019 | 13 tasks (+ T011a) |
| Phase 4: US2 | T020-T025 | 6 tasks |
| Phase 5: US3 | T026-T027 | 2 tasks |
| Phase 6: Migration | T028-T030 | 3 tasks |
| Phase 7: Edge Cases | T031-T033 | 3 tasks |
| Phase 7b: Performance | T034 | 1 task |
| Phase 8: Docs | T036-T038 | 3 tasks |
| **Total** | **T001-T038** | **38 tasks** |
