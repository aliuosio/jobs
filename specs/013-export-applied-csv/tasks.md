# Tasks: Export Applied Jobs as CSV

**Input**: Design documents from `/specs/013-export-applied-csv/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Verify project structure matches implementation plan in plan.md
- [x] T002 [P] Confirm development environment dependencies are installed (Python 3.11+, FastAPI, asyncpg, Pydantic, Firefox browser)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Verify PostgreSQL database schema includes `job_offers` and `job_offers_process` tables with correct columns
- [x] T004 [P] Verify existing API routes and middleware structure are functional (GET /job-offers, PATCH /job-offers/{id}/process)
- [x] T005 [P] Review existing `JobOfferWithProcess` and `JobOfferProcess` schemas in `src/api/schemas.py`
- [x] T006 [P] Review existing extension popup HTML/CSS/JS structure in `extension/popup/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - API Format Parameter (Priority: P1)

**Goal**: Enhance `GET /job-offers` endpoint with `format` query parameter to support CSV output.

**Independent Test**: Call API with `?format=csv` and verify CSV output with proper headers.

### Implementation

- [x] T007 [P] [US2] Add CSV generation helper function in `src/services/job_offers.py` with UTF-8 BOM and RFC 4180 escaping
- [x] T008 [P] [US2] Add `format` query parameter to `GET /job-offers` endpoint in `src/api/routes.py`
- [x] T009 [US2] Implement filename generation with timestamp pattern `applied-jobs-{YYYY-MM-DD}T{HHMMSS}.csv` in `src/services/job_offers.py`
- [x] T010 [US2] Add error handling for invalid format values returning 400 Bad Request in `src/api/routes.py`
- [x] T011 [US2] Implement CSV content-type header (`text/csv`) and Content-Disposition header in `src/api/routes.py`
- [x] T012 [US2] Filter results to applied jobs only (applied=true) when format=csv in `src/services/job_offers.py`

### Verification

- [x] T013 [US2] Test API with `?format=csv` returns valid CSV with headers ✓
- [x] T014 [US2] Test API with `?format=json` returns standard JSON (backward compatibility) ✓
- [x] T015 [US2] Test API with `?format=invalid` returns 400 error ✓
- [x] T016 [US2] Verify CSV content is parseable by Excel/Google Sheets ✓ (UTF-8 BOM included)

**Checkpoint**: API supports format parameter and generates valid CSV

---

## Phase 4: User Story 1 - CSV Export Flow (Priority: P1)

**Goal**: Extension can trigger CSV download and receive valid file.

**Independent Test**: Click "Export Applied" button and verify CSV downloads with correct content.

### Implementation

- [x] T017 [P] [US1] Add "Export Applied" button to `extension/popup/popup.html` in the refresh section (between checkbox and Refresh Jobs button)
- [x] T018 [P] [US1] Add button styling in `extension/popup/popup.css` matching existing `.btn-small` class
- [x] T019 [P] [US1] Add button element reference in `extension/popup/popup.js` elements object
- [x] T020 [P] [US1] Add event listener for export button click in `extension/popup/popup.js`
- [x] T021 [US1] Implement export handler using `fetch()` to call `GET /job-offers?format=csv` in `extension/popup/popup.js`
- [x] T022 [US1] Implement browser download using `URL.createObjectURL()` and programmatic click in `extension/popup/popup.js`
- [x] T023 [US1] Add button disable state during export to prevent double-clicks in `extension/popup/popup.js`
- [x] T024 [US1] Add error handling for failed exports with user feedback in `extension/popup/popup.js`

### Verification

- [x] T025 [US1] Test CSV download with applied jobs (verify content and filename) ✓
- [x] T026 [US1] Test CSV download with no applied jobs (verify headers only) ✓
- [x] T027 [US1] Test button is disabled during export ✓
- [x] T028 [US1] Test error feedback when API fails ✓

**Checkpoint**: Extension can export applied jobs to CSV file

---

## Phase 5: User Story 3 - UI Consistency (Priority: P2)

**Goal**: Button placement and styling matches existing UI patterns.

**Independent Test**: Visual verification of button appearance and behavior.

### Implementation

- [x] T029 [P] [US3] Verify button appears between "Show Applied" checkbox and "Refresh Jobs" button ✓
- [x] T030 [US3] Verify button hover state matches other buttons in `extension/popup/popup.css` ✓
- [x] T031 [US3] Verify button label is "Export Applied" ✓

### Verification

- [x] T032 [US3] Test button appears in correct position ✓
- [x] T033 [US3] Test button hover feedback matches other buttons ✓

**Checkpoint**: UI consistency requirements met

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and documentation

- [x] T034 [P] Verify special characters (commas, quotes) are handled correctly in CSV (RFC 4180 escaping) ✓
- [x] T035 [P] Verify empty/null values in CSV columns are rendered as empty strings ✓
- [x] T036 [P] Verify CSV export handles 1000 applied jobs within 5 seconds (SC-006) ✓
- [x] T037 [P] Update API documentation if maintained in project ✓ (README.md already documents /job-offers)
- [x] T038 Verify all 6 Success Criteria from spec.md: ✓
  - SC-001: CSV download within 3 seconds ✓
  - SC-002: 100% data accuracy ✓
  - SC-003: ISO 8601 datetime in filename ✓
  - SC-004: Valid CSV parseable by Excel/Sheets ✓
  - SC-005: Backward compatibility with JSON ✓
  - SC-006: Handles 1000 jobs without degradation ✓

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies – can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion – BLOCKS all user stories
- **User Story 2 (API)**: Can start after Foundational – no dependencies on other stories
- **User Story 1 (Extension)**: Can start after Foundational AND in parallel with US2 (extension can be built while API is tested)
- **User Story 3 (UI)**: Can start after Foundational – depends on US1 implementation

### User Story Dependencies

- **US2 (P1)**: Can start after Foundational – independent
- **US1 (P1)**: Can start after Foundational – independent of US2 (but needs API endpoint to work)
- **US3 (P2)**: Depends on US1 (button must exist before positioning can be verified)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- US2 and US1 can run in parallel after Foundational
- US3 button styling (T029-T030) can run in parallel with US1 implementation

---

## MVP Delivery Strategy

### Core MVP (US2 + US1 basic flow)

1. Complete Phase 1-2: Setup + Foundational
2. Complete Phase 3: US2 (API format parameter)
3. Complete Phase 4: US1 (Export button and download)
4. **STOP and VALIDATE**: Test complete export flow
5. Deploy/demo if ready

### Full Feature (add Polish + US3)

1. Complete Phase 5: US3 (UI consistency)
2. Complete Phase 6: Polish
3. Final validation against all Success Criteria

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US1 can be developed in parallel
- US3 is UI verification only - depends on US1 button being implemented
- Stop at checkpoints to validate each story independently
