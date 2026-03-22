# Tasks: Job Status Sync

**Input**: Design documents from `/specs/012-job-status-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure matches implementation plan in plan.md
- [x] T002 Confirm development environment dependencies are installed (Python 3.11+, FastAPI, asyncpg, Pydantic, Firefox extension tools)
- [x] T003 [P] Configure linting and formatting tools (ruff for Python, eslint for JavaScript)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Verify PostgreSQL database schema includes `job_offers` and `job_offers_process` tables with correct columns (id, job_offers_id, research, research_email, applied, created_at, updated_at)
- [ ] T005 [P] Confirm existing API routes and middleware structure are functional (GET /job-offers, PATCH /job-offers/{id}/process)
- [ ] T006 [P] Verify existing `JobOfferWithProcess` and `JobOfferProcess` schemas in `src/api/schemas.py`
- [ ] T007 [P] Test that API returns process data for job offers with associated process records (manual verification)
- [ ] T008 [P] Test that API returns null process field for job offers without process records (manual verification)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - API Returns Process Data (Priority: P1)

**Goal**: Ensure the backend API returns process status data (research, research_email, applied) when retrieving job offers.

**Independent Test**: Send a request to the `/job-offers` endpoint and verify the response includes the process object with correct fields for each job offer, without requiring the extension.

### Implementation for User Story 2

- [x] T009 [P] [US2] Update `src/api/schemas.py` to include `JobOfferProcess` model with all fields (id, job_offer_id, research, research_email, applied, created_at, updated_at)
- [x] T010 [P] [US2] Update `src/api/schemas.py` to ensure `JobOfferWithProcess` schema includes optional `process` field
- [x] T011 [US2] Modify `src/services/job_offers.py` to join `job_offers_process` table when fetching job offers
- [x] T012 [US2] Update `src/api/routes.py` GET `/job-offers` endpoint to use the new schema and service method
- [ ] T013 [US2] Verify that the API returns process data for 100% of job offers that have an associated process record (success criterion SC-002)

**Checkpoint**: API now returns process data; extension can consume it.

---

## Phase 4: User Story 1 - View Job Status in Extension (Priority: P1)

**Goal**: Extension displays the applied status flag (color-coded) for each job offer in the job list.

**Independent Test**: Load the extension, verify it displays the correct applied status (green/red) for a set of job offers stored in the database, without requiring real-time updates.

### Implementation for User Story 1

- [x] T014 [P] [US1] Update `extension/manifest.json` to include necessary permissions (activeTab, storage, *://localhost:8000/*)
- [x] T015 [P] [US1] Modify `extension/popup/popup.html` to include UI elements for displaying applied status (e.g., a colored dot or icon)
- [x] T016 [P] [US1] Update `extension/popup/popup.css` with styles for green (not applied) and red (applied) status indicators
- [x] T017 [US1] Implement `extension/popup/popup.js` to fetch job offers from `/job-offers` endpoint and render applied status
- [x] T018 [US1] Add error handling in `extension/popup/popup.js` for API unavailability (show empty state with retry button per FR-005)
- [x] T019 [US1] Update `extension/background/background.js` to establish SSE connection to `/api/v1/stream` (per contract)
- [x] T020 [US1] Implement `extension/background/background.js` to maintain in-memory map of job offer IDs to latest process data
- [x] T021 [US1] Add message passing between background and popup scripts to update UI when SSE events arrive
- [x] T022 [US1] Implement automatic reconnection with exponential backoff in `extension/background/background.js`
- [ ] T023 [US1] Test that extension displays initial job offer data correctly (manual verification)
- [ ] T024 [US1] Test that extension updates displayed status when SSE events received (manual verification)

**Checkpoint**: Extension now displays applied status and updates in real-time.

---

## Phase 5: User Story 3 - Extension API Connection Works (Priority: P2)

**Goal**: Extension successfully connects to the backend API and receives job offer data.

**Independent Test**: Verify that the extension can make a successful HTTP request to the backend API's `/job-offers` endpoint and receive a valid response, without requiring the data to be processed or displayed.

### Implementation for User Story 3

- [x] T025 [P] [US3] Add connection status tracking in `extension/background/background.js` (connected, disconnected, reconnecting)
- [x] T026 [US3] Implement empty state UI in `extension/popup/popup.html` and `extension/popup/popup.js` with retry button (per FR-005)
- [x] T027 [US3] Add retry button click handler to trigger reconnection attempt
- [ ] T028 [US3] Test extension shows empty state when backend is stopped (manual verification)
- [ ] T029 [US3] Test extension automatically reconnects when backend is restarted (manual verification)
- [ ] T030 [US3] Test retry button manually triggers reconnection attempt (manual verification)

**Checkpoint**: Extension gracefully handles API unavailability and recovery.

---

## Phase 6: Backend SSE Implementation (Cross-Cutting)

**Purpose**: Implement Server-Sent Events endpoint for real-time updates (required by US1)

**Note**: This phase is a prerequisite for US1 real-time updates but can be developed in parallel with US2.

### Implementation

- [x] T031 [P] Add SSE endpoint handler in `src/api/routes.py` (GET `/api/v1/stream`)
- [x] T032 [P] Implement broadcast mechanism for process updates in `src/services/job_offers.py` (asyncio.Queue or similar)
- [x] T034 [US1] Test SSE endpoint with curl (manual verification)
- [x] T035 [US1] Test that updates are sent when process data changes via PATCH endpoint (manual verification)

**Checkpoint**: SSE endpoint operational; extension can subscribe.

---

## Phase 7: Error Handling & Edge Cases (Cross-Cutting)

**Purpose**: Robustness and compliance with constitution

- [x] T036 [P] Implement database connection error handling in `src/services/job_offers.py`
- [x] T037 [P] Add malformed JSON response handling in `extension/background/background.js`
- [x] T038 [P] Implement concurrent update conflict resolution (last-write-wins) in `src/services/job_offers.py`
- [x] T039 [P] Add JSDoc type annotations to `extension/background/background.js`
- [x] T040 [P] Add JSDoc type annotations to `extension/popup/popup.js`
- [x] T041 [P] Verify docstrings on all Python functions (per constitution)
- [x] T042 [P] Update documentation in `docs/` per constitution requirements
- [ ] T043 Verify SC-002: API returns process data for 100% of job offers with process records (manual verification)

---

## Phase 8: Success Criteria Verification (Cross-Cutting)

**Purpose**: Verify measurable outcomes from spec.md

### Success Criteria Verification

- [ ] T044 Verify SC-001: Extension displays correct applied status for ≥95% of job offers without manual refresh (manual verification)
- [ ] T045 Verify SC-003: SSE connection receives process updates within 1 second of database changes (manual timing test)
- [ ] T046 Verify SC-004: Empty state shown within 2 seconds of API unavailability detection (manual timing test)
- [ ] T047 Verify SC-005: UI updates within 1 second of receiving SSE event (manual timing test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies – can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion – BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 2 (API) should be completed before User Story 1 (extension) because US1 depends on US2's API.
  - User Story 3 (connection) can be developed in parallel with US2 but should be tested after US2 is ready.
- **Backend SSE (Phase 6)**: Can be developed in parallel with US2; required for US1 real-time updates.
- **Error Handling (Phase 7)**: Can be developed in parallel with any story; recommended to complete before final validation.

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational – No dependencies on other stories
- **User Story 1 (P1)**: Depends on User Story 2 (API returns process data) and Phase 6 (SSE endpoint)
- **User Story 3 (P2)**: Depends on User Story 2 (API returns process data) but can start after Foundational

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Story 2 and User Story 3 can start in parallel
- Within each user story, tasks marked [P] can run in parallel (e.g., UI updates, background script changes)

---

## Parallel Example: User Story 1

```bash
# Launch all UI tasks together:
Task: "Update extension/popup/popup.html to include UI elements for displaying applied status"
Task: "Update extension/popup/popup.css with styles for green/red status indicators"

# Launch all background script tasks together:
Task: "Implement extension/background/background.js to establish SSE connection"
Task: "Implement extension/background/background.js to maintain in-memory map"
```

---

## Implementation Strategy

### MVP First (User Story 2 + User Story 1 basic display)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL – blocks all stories)
3. Complete Phase 3: User Story 2 (API returns process data)
4. Complete Phase 4: User Story 1 (extension displays applied status) – but only the static fetch-and-display part (T014-T018). Skip real-time updates initially.
5. **STOP and VALIDATE**: Test that extension shows correct applied status from API.
6. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 2 → Test independently → Deploy/Demo
3. Add User Story 1 (static display) → Test independently → Deploy/Demo
4. Add SSE endpoint (Phase 6) → Add real-time updates to extension → Test independently → Deploy/Demo
5. Add User Story 3 (error handling) → Test independently → Deploy/Demo
6. Each step adds value without breaking previous steps.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (API)
   - Developer B: User Story 3 (error handling) + Phase 6 (SSE endpoint)
3. After User Story 2 is done, Developer A can start User Story 1 (extension UI)
4. Integration and testing as each component becomes ready.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests are written)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
