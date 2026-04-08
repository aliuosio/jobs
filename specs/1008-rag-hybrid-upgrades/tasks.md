# Tasks: RAG System Hybrid Retrieval Enhancements

**Feature**: 1008-rag-hybrid-upgrades  
**Generated**: 2026-04-08  
**Spec**: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md)

---

## Implementation Strategy

**MVP Scope**: User Story 1 (Reduce LLM Hallucinations) - Core HyDE + graceful degradation  
**Approach**: Incremental delivery - each user story is independently testable

### User Stories

| Story | Priority | Goal |
|-------|----------|------|
| US1 | P1 | Reduce LLM Hallucinations - HyDE + graceful degradation |
| US2 | P2 | Improve Retrieval Relevance - Embedding/LLM reranking + MMR |
| US3 | P3 | Maintain Fast Response Times - Caching + performance |

### Dependency Order

```
Phase 1: Setup (T001-T002)
    ↓
Phase 2: Foundational (T003-T005)
    ↓
Phase 3: US1 - HyDE + Graceful Degradation (T006-T015)
    ↓
Phase 4: US2 - Reranking + MMR (T016-T025)
    ↓
Phase 5: US3 - Caching + Performance (T026-T030)
```

---

## Phase 1: Setup

### Goal: Project initialization and dependency setup

- [x] T001 Add new configuration settings to src/config.py for retrieval enhancements
- [x] T002 Install sentence-transformers package for cross-encoder reranking

---

## Phase 2: Foundational

### Goal: Core infrastructure required for all user stories

- [x] T003 Create src/utils/cache.py with QueryCache class for caching HyDE and reranking results (include all methods: get_hyde, set_hyde, get_rerank, set_rerank)
- [x] T004 Create src/services/hyde.py with HyDEGenerator class for hypothetical document generation
- [x] T005 Create src/services/reranker.py with RerankerPool class for embedding and LLM reranking

---

## Phase 3: User Story 1 - Reduce LLM Hallucinations

**Priority**: P1  
**Goal**: HyDE implementation with graceful degradation to baseline retrieval  
**Independent Test**: Submit queries with no context - verify NONE confidence returned

### Tasks

- [x] T006 [US1] Implement generate() method in src/services/hyde.py using Mistral LLM
- [x] T007 [US1] Implement generate_with_fallback() method in src/services/hyde.py
- [x] T008 [US1] Add HyDE integration to src/services/retriever.py - hyde_search() method
- [x] T009 [US1] Add configuration check for HYDE_ENABLED in retriever service
- [x] T010 [US1] Implement graceful degradation: fall back to original query on HyDE failure
- [x] T011 [US1] Add empty/invalid HyDE response handling in src/services/hyde.py
- [x] T012 [US1] Add short query handling (1-2 words) - skip HyDE, use baseline
- [ ] T013 [US1] Add unit tests for HyDEGenerator in tests/unit/test_hyde.py
- [ ] T014 [US1] Add integration test: query with no context returns NONE confidence
- [ ] T015 [US1] Add integration test: HyDE failure falls back to baseline retrieval

---

## Phase 4: User Story 2 - Improve Retrieval Relevance

**Priority**: P2  
**Goal**: Embedding reranking, LLM rubric reranking, and MMR diversification  
**Independent Test**: Query with paraphrased terms - verify correct info retrieved

### Tasks

- [x] T016 [US2] [P] Implement embedding_rerank() method in src/services/reranker.py using cross-encoder
- [x] T017 [US2] [P] Implement llm_rerank() method in src/services/reranker.py with rubric scoring
- [x] T018 [US2] [P] Implement combined_rerank() method in src/services/reranker.py for both stages
- [x] T019 [US2] Add cross-encoder model configuration to src/config.py
- [x] T020 [US2] Add reranking integration to src/services/retriever.py after hybrid search
- [x] T021 [US2] Implement MMR diversification in src/services/reranker.py
- [x] T022 [US2] Add configuration for MMR_LAMBDA and reranking weights
- [ ] T023 [US2] Add unit tests for RerankerPool in tests/unit/test_reranker.py
- [ ] T024 [US2] Add integration test: paraphrased query retrieves correct information
- [ ] T025 [US2] Add integration test: MMR diversifies similar results

---

## Phase 5: User Story 3 - Maintain Fast Response Times

**Priority**: P3  
**Goal**: Caching and performance optimization  
**Independent Test**: Repeated query - verify cache hit and fast response

### Tasks

- [x] T026 [US3] [P] Integrate HyDE caching in src/services/hyde.py using QueryCache
- [x] T027 [US3] [P] Integrate reranking caching in src/services/reranker.py using QueryCache
- [x] T028 [US3] [P] Add cache TTL configuration to src/config.py
- [x] T029 [US3] Add cache invalidation logic for stale entries
- [ ] T030 [US3] Add integration test: repeated query returns cached response
- [ ] T030b [US2] Add verification: LLM rubric reranking improves top-1 relevance by 20% vs baseline

---

## Phase 6: Polish & Cross-Cutting Concerns

### Goal: Final integration, testing, and documentation

- [ ] T031 [P] Run full integration test suite for fill-form endpoint
- [ ] T032 [P] Verify performance: response time < 3 seconds with all enhancements
- [ ] T033 [P] Add API documentation for new configuration options
- [ ] T034 Update docker-compose.yml if new dependencies required
- [ ] T035 Update README.md with new feature documentation

---

## Parallel Opportunities

The following tasks can be executed in parallel (different files, no dependencies):

1. **Setup Phase**: T001, T002
2. **Foundational Phase**: T003 (cache full impl), T004, T005 (parallel - different files)
3. **US2 Phase**: T016, T017, T018 (parallel - different methods)
4. **US3 Phase**: T026, T027, T028 (parallel - cache integration)
5. **Polish Phase**: T031, T032, T033 (parallel - different concerns)

---

## Independent Test Criteria

| User Story | Test | Expected Result |
|------------|------|----------------|
| US1 | Query with no relevant context | Returns "I don't have information" with NONE confidence |
| US1 | HyDE API failure | Falls back to baseline retrieval |
| US1 | Short query (1-2 words) | Uses baseline, skips HyDE |
| US2 | Query: "JS experience", resume: "JavaScript" | Finds JavaScript section |
| US2 | 10 similar results | MMR diversifies to different aspects |
| US2 | Top-50 candidates | Embedding reranker re-scores accurately |
| US3 | Same query repeated | Returns cached response |
| US3 | Full pipeline with enhancements | Response < 3 seconds |

---

## Notes

- All tasks must include unit tests per constitution §9
- Graceful degradation is critical - no enhancement should break baseline functionality
- Performance testing required for all user stories
- Use existing test infrastructure in tests/ directory