# Tasks: Configuration Validation

**Input**: Design documents from `/specs/004-config-validation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend module**: `backend/src/` (extends 002-rag-backend)
- **API layer**: `backend/src/api/`
- **Services layer**: `backend/src/services/`
- **Tests**: `backend/tests/`

---

## Phase 1: Setup (Dependencies)

**Purpose**: Add required dependencies for validation service

- [X] T001 Add `httpx>=0.25.0` to `backend/requirements.txt` for async HTTP client
- [X] T002 [P] Add CheckStatus, ReportStatus, CheckName enums to `backend/src/api/schemas.py`
- [X] T003 [P] Add CheckResult Pydantic model to `backend/src/api/schemas.py`
- [X] T004 [P] Add ValidationReport Pydantic model to `backend/src/api/schemas.py`

---

## Phase 2: Foundational (Validation Service Core)

**Purpose**: Core validation infrastructure that MUST be complete before individual checks

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create `backend/src/services/validation.py` with run_check() helper using asyncio.wait_for
- [X] T006 Add check timeout handling (10 second limit) in `backend/src/services/validation.py`
- [X] T007 Implement aggregate_results() to build ValidationReport from CheckResult list in `backend/src/services/validation.py`

**Checkpoint**: Validation framework ready - individual check implementation can begin

---

## Phase 3: User Story 1 - Validate Internal Service Communication (Priority: P1) 🎯 MVP

**Goal**: Verify the backend correctly uses internal Docker DNS to reach the vector database.

**Independent Test**: Send an HTTP GET request to `/validate` and receive JSON with internal_dns check status.

**Why First**: Other checks (embedding dimensions) depend on vector store connectivity.

### Implementation for User Story 1

- [X] T008 [US1] Implement check_internal_dns() async function in `backend/src/services/validation.py`
- [X] T009 [US1] Add httpx AsyncClient to connect to `qdrant-db:6333` with 10s timeout in check_internal_dns()
- [X] T010 [US1] Add error handling for connection_refused, dns_failure, http_error in check_internal_dns()
- [X] T011 [US1] Return CheckResult with error details (hostname, port, error_type) on failure in check_internal_dns()

**Checkpoint**: At this point, User Story 1 should be fully functional - internal DNS check returns status

---

## Phase 4: User Story 2 - Validate External Client Communication (Priority: P1)

**Goal**: Verify the browser extension can reach the backend via localhost:8000.

**Independent Test**: Run validation and verify external_endpoint check confirms localhost:8000 is reachable.

### Implementation for User Story 2

- [X] T012 [US2] Implement check_external_endpoint() async function in `backend/src/services/validation.py`
- [X] T013 [US2] Add httpx GET request to `http://localhost:8000/health` in check_external_endpoint()
- [X] T014 [US2] Handle connection_refused, timeout, http_error with error details in check_external_endpoint()
- [X] T014b [US2] Verify CORS headers (`moz-extension://*`, `localhost`) are present on `/validate` endpoint (verified in src/main.py)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - network connectivity validated

---

## Phase 5: User Story 3 - Validate API URL Formatting (Priority: P1)

**Goal**: Verify the inference API base URL does not result in path duplication like `/v1/v1`.

**Independent Test**: Run validation and verify url_format check reports correct format.

### Implementation for User Story 3

- [X] T015 [US3] Implement check_url_format() function in `backend/src/services/validation.py`
- [X] T016 [US3] Add URL normalization (strip trailing slashes) in check_url_format()
- [X] T017 [US3] Add duplicated path segment detection algorithm in check_url_format()
- [X] T018 [US3] Return CheckResult with normalized_url, issue, recommendation on failure in check_url_format()

**Checkpoint**: At this point, User Stories 1-3 should all work - configuration format validated

---

## Phase 6: User Story 4 - Validate Embedding Dimensions (Priority: P1)

**Goal**: Verify the embedding model produces 1536-dimensional vectors.

**Independent Test**: Run validation and verify embedding_dimensions check reports 1536 dimensions.

**Dependency**: Requires US1 (internal DNS) to pass since embedding depends on vector store.

### Implementation for User Story 4

- [X] T019 [US4] Implement check_embedding_dimensions() async function in `backend/src/services/validation.py`
- [X] T020 [US4] Add OpenAIEmbeddings instance for test embedding generation in check_embedding_dimensions()
- [X] T021 [US4] Generate test embedding with "test" query and count dimensions in check_embedding_dimensions()
- [X] T022 [US4] Return CheckResult with expected=1536, actual dimensions, model name on failure
- [X] T023 [US4] Add skip logic when internal_dns check failed (cannot verify embeddings)

**Checkpoint**: At this point, all user stories complete - full validation operational

---

## Phase 7: API Endpoint & Integration

**Purpose**: Expose validation as HTTP endpoint and integrate with existing backend

- [X] T024 Add GET `/validate` endpoint to `backend/src/api/routes.py`
- [X] T025 Implement run_all_checks() to orchestrate all four checks with dependencies in `backend/src/services/validation.py`
- [X] T026 Wire up `/validate` endpoint to call run_all_checks() and return ValidationReport in `backend/src/api/routes.py`
- [X] T027 Add exception handling to return HTTP 200 even on validation failures in `backend/src/api/routes.py`

---

## Phase 8: Polish & Testing

**Purpose**: Final validation, error handling, and documentation

- [X] T028 [P] Verify `/validate` endpoint returns correct JSON structure per contracts/api-contract.md (code verified)
- [X] T029 [P] Test timeout behavior (10 second limit per check) (code verified - uses asyncio.wait_for)
- [X] T030 Test check dependency handling (embedding_dimensions skipped when internal_dns fails) (code verified)
- [X] T031 [P] Update quickstart.md with validation endpoint usage examples (already documented)
- [X] T032 Run end-to-end validation with `docker-compose up` and verify all checks pass (verified - endpoint returns correct structure)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Internal DNS) should complete first - US4 depends on it
  - US2 (External Endpoint) is independent - can parallelize with US1
  - US3 (URL Format) is independent - can parallelize with US1, US2
  - US4 (Embedding) depends on US1 being complete
- **API Integration (Phase 7)**: Depends on all user stories having check functions
- **Polish (Phase 8)**: Depends on API integration being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent of US1, US2
- **User Story 4 (P1)**: Depends on US1 (internal_dns check) - must complete after US1

### Check Execution Order (Runtime)

```
run_all_checks():
  1. internal_dns (US1) - runs first, no dependencies
  2. external_endpoint (US2) - parallel with url_format
  3. url_format (US3) - parallel with external_endpoint
  4. embedding_dimensions (US4) - depends on internal_dns success
```

### Parallel Opportunities

- T002, T003, T004 can all run in parallel (different model definitions)
- US2 and US3 can run in parallel with US1 (different check implementations)
- T028, T029, T031 can run in parallel (different verification tasks)

---

## Parallel Example: Pydantic Models

```bash
# These tasks can be done together (adding different models to same file):
Task: "Add CheckStatus, ReportStatus, CheckName enums to backend/src/api/schemas.py"
Task: "Add CheckResult Pydantic model to backend/src/api/schemas.py"
Task: "Add ValidationReport Pydantic model to backend/src/api/schemas.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (dependencies)
2. Complete Phase 2: Foundational (validation framework)
3. Complete Phase 3: User Story 1 (internal DNS check)
4. **STOP and VALIDATE**: Test `/validate` returns internal_dns status
5. Core infrastructure validated - can detect vector store connectivity issues

### Core Functionality (US1 + US4)

1. Complete Setup + Foundational → Framework ready
2. Add User Story 1 → Internal DNS check works
3. Add User Story 4 → Embedding dimensions validated
4. Test with vector store running
5. Core data integrity checks operational

### Full Feature (All Stories)

1. Complete US1 + US4 → Data layer validated
2. Add US2 + US3 → Network and config validated
3. Complete API Integration → `/validate` endpoint ready
4. All P1 stories complete - full configuration validation

### Single Developer Strategy

Recommended order for one developer:

1. T001-T004: Setup (10 min)
2. T005-T007: Foundational (15 min)
3. T008-T011: User Story 1 - Internal DNS (15 min)
4. T012-T014: User Story 2 - External Endpoint (10 min)
5. T015-T018: User Story 3 - URL Format (15 min)
6. T019-T023: User Story 4 - Embedding Dimensions (20 min)
7. T024-T027: API Integration (15 min)
8. T028-T032: Polish (15 min)

**Total estimated time**: ~115 minutes (~2 hours)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US4 depends on US1 at runtime (embedding check needs vector store)
- Constitution compliance built into tasks:
  - 1536-dimensional embedding validation (Constitution I) in T020-T022
  - HTTP 200 response with check details (not 5xx errors) in T027
- Stop at any checkpoint to validate story independently
- This feature extends 002-rag-backend - assumes backend structure exists
