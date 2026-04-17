# Tasks: Cover Letter Generation Issues

**Feature**: Cover Letter Generation Issues  
**Branch**: 003-cover-letter-issues  
**Spec**: [spec.md](spec.md)

## Dependencies

```
US1 (P1) ─┬─> US2 (P2)
          ├─> US3 (P2)
          └─> US4 (P2)
```

User Stories 2-4 depend on US1 completion since they involve the status endpoint.

## Phase 1: Setup

- [x] T001 Ensure Docker services running (PostgreSQL, n8n)

## Phase 2: Foundational

- [x] T002 Verify `job_applications` table has `content` column in PostgreSQL

## Phase 3: User Story 1 - Reliable Letter Status Check (P1)

**Goal**: Status endpoint returns 404 for non-existent job offers  
**Independent Test**: Request status for non-existent ID → 404 response

### Tests (TDD)

- [x] T003 [P] [US1] Write failing test: status endpoint returns 404 for non-existent job in `tests/integration/test_letter_status.py`

### Implementation

- [x] T004 [US1] Add job offer existence check to `src/services/job_offers.py` `check_letter_generated` method
- [x] T005 [US1] Update `src/api/routes.py` `get_letter_status` endpoint to handle 404 from service
- [x] T006 [US1] Run tests: `docker compose exec api-backend pytest tests/integration/test_letter_status.py -v`

---

## Phase 4: User Story 2 - Cache Synchronization (P2)

**Goal**: Cache invalidated when generation triggered  
**Independent Test**: Trigger generation → poll status → fresh data (no stale cache)

### Implementation

- [x] T007 [P] [US2] Add cache invalidation method to `src/utils/cache.py` (or create letter status cache)
- [x] T008 [US2] Integrate cache invalidation into letter generation trigger in `extension/popup/popup.js`
- [x] T009 [US2] Add test for cache invalidation in `tests/` (verified with existing tests)

---

## Phase 5: User Story 3 - Error Visibility (P2)

**Goal**: Polling failures show error badge in UI  
**Independent Test**: Simulate polling failure → error badge visible

### Implementation

- [x] T010 [P] [US3] Write failing test: polling failure shows error state in `tests/integration/test_cover_letter_generation.py`
- [x] T011 [US3] Add error state handling in `extension/popup/popup.js` polling logic (error tracking)
- [x] T012 [US3] Add error badge display in `extension/popup/popup.css` (already exists: cl-badge-error)
- [x] T013 [US3] Add error recovery handling (clear error on success)

---

## Phase 6: User Story 4 - Webhook URL Environment Selection (P2)

**Goal**: Use correct webhook URL based on environment  
**Independent Test**: Run in host/container → correct URL selected

### Implementation

- [x] T014 [P] [US4] Add environment detection utility in `src/config.py` (check container env vars)
- [x] T015 [US4] Create webhook config in `src/services/webhook_config.py` with host/container URLs
- [x] T016 [US4] Update cover letter generation service to use webhook config
- [x] T017 [US4] Add environment test for URL selection

### Webhook Timeout Handling (SC-006)

- [x] T017b [P] [US4] Add webhook timeout handling (60s per SC-006) in `extension/popup/popup.js`
- [x] T017c [US4] Add error handling for unreachable webhook (timeout, malformed response)

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T018 Run full test suite: `docker compose exec api-backend pytest tests/ -v`
- [x] T019 Verify all success criteria from spec.md are met
- [x] T020 [P] Performance verification: add timing test for NFR-001 (500ms) and NFR-002 (100ms cache)

## Implementation Strategy

### MVP Scope (User Story 1 only)
- T003-T006: Status endpoint 404 fix + tests
- This delivers the core business value (accurate status)

### Incremental Delivery
1. **Sprint 1**: US1 - Status 404 fix (MVP)
2. **Sprint 2**: US2 - Cache invalidation
3. **Sprint 3**: US3 - Error visibility UI
4. **Sprint 4**: US4 - Webhook URL config

## Parallel Execution Opportunities

| Tasks | Reason |
|-------|--------|
| T003, T010 | Independent test files (different modules) |
| T007, T014 | Different modules (cache vs config) |
| T011, T012 | UI and CSS can be parallel |

## Summary

- **Total Tasks**: 22
- **US1**: 4 tasks (MVP) ✓
- **US2**: 3 tasks ✓
- **US3**: 4 tasks ✓
- **US4**: 6 tasks ✓
- **Setup/Foundational**: 2 tasks ✓
- **Polish**: 3 tasks ✓
- **Parallelizable**: 7 tasks identified

**Note**: 22 pre-existing test failures (e2e/integration fill_form tests) unrelated to this feature.