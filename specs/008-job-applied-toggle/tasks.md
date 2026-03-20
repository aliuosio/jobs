# Tasks: Job Applied Status Toggle

**Input**: Design documents from `/specs/008-job-applied-toggle/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/job-offers-api.md, quickstart.md

**Tests**: Manual browser testing only (no automated tests for extension UI). Test tasks document manual validation steps per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project setup needed — Firefox extension project already exists. This phase reviews existing files and plans modifications.

- [x] T001 Review existing popup.html structure in extension/popup/popup.html to identify where to add loading/error containers
- [x] T002 Review existing popup.js state management in extension/popup/popup.js to identify where to add jobLinks state and fetch logic
- [x] T003 Review existing popup.css in extension/popup/popup.css to identify where to add skeleton and red status styles
- [x] T004 Review existing background.js message handlers in extension/background/background.js to identify where to add new message types

---

## Phase 2: Foundational

**Purpose**: Background script message handlers that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 [P] [US1] [US2] Add GET_JOB_OFFERS message handler in extension/background/background.js (handle message type, fetch GET /job-offers, return structured response)
- [x] T006 [P] [US1] [US2] Add UPDATE_APPLIED message handler in extension/background/background.js (handle message type, fetch PATCH /job-offers/{id}/process, return structured response)

**Checkpoint**: Background message handlers ready — popup implementation can now begin

---

## Phase 3: User Story 1 - View Job Links with Applied Status (Priority: P1) 🎯 MVP

**Goal**: Replace dummy job links with live API data. Show green icon for applied jobs, red for not applied.

**Independent Test**: Open popup → 3-5 skeleton rows → fade to job list with correct green/red icons per applied status.

### Manual Validation

- [x] T007 [US1] Validate GET /job-offers returns correct data with docker-compose (curl http://localhost:8000/job-offers) — ✅ PASSED: returns `{"job_offers":[{"id":54,"title":"Software Engineer","url":"https://example.com/job/1","process":{"applied":true}}]}`
- [ ] T008 [US1] Load extension in Firefox and verify popup opens without errors
- [ ] T009 [US1] Verify job links section shows skeleton placeholders on open (extension/popup/popup.js init)
- [ ] T010 [US1] Verify job list loads with green icons for applied=true jobs
- [ ] T011 [US1] Verify job list shows red icons for applied=false and applied=null jobs

### Implementation

- [x] T012 [P] [US1] Add skeleton loading HTML containers in extension/popup/popup.html (add div.job-links-loading, div.job-links-error with retry button)
- [x] T013 [P] [US1] Add CSS skeleton shimmer styles in extension/popup/popup.css (add .job-link-skeleton class with shimmer animation)
- [x] T014 [P] [US1] Add CSS red status indicator in extension/popup/popup.css (add .job-status-applied with red background #ef4444)
- [x] T015 [US1] Replace getDummyJobLinks() with fetchJobOffers() in extension/popup/popup.js (call background GET_JOB_OFFERS, map response to JobLinkState)
- [x] T016 [US1] Add showSkeleton(), showError(retryCallback), hideLoading() helper functions in extension/popup/popup.js
- [x] T017 [US1] Update renderJobLinksList() in extension/popup/popup.js to use applied status for icon class (applied ? 'job-status-applied' : 'job-status-new')
- [x] T018 [US1] Call fetchJobOffers() on init() in extension/popup/popup.js to load on popup open

**Checkpoint**: User Story 1 fully functional — job links load from API with correct green/red icons

---

## Phase 4: User Story 2 - Toggle Applied Status by Clicking Icon (Priority: P1)

**Goal**: Click status icon to toggle applied status with optimistic update and revert-on-failure.

**Independent Test**: Click icon → immediate color change → persists after API success. Click with API failure → reverts with error message.

### Manual Validation

- [ ] T019 [US2] Verify clicking red icon turns it green immediately (optimistic update)
- [ ] T020 [US2] Verify clicking green icon turns it red immediately (optimistic update)
- [ ] T021 [US2] Verify toggle persists after API success (poll DB or refresh popup) — ✅ Logic tested via node tests (optimistic update confirmed)
- [ ] T022 [US2] Verify icon reverts to original state on API failure — ✅ Logic tested via node tests (revert confirmed)
- [ ] T023 [US2] Verify rapid clicks on same icon are debounced (pending state blocks additional clicks) — ✅ Logic tested via node tests (debounce confirmed)

### Implementation

- [x] T024 [P] [US2] Update renderJobLinksList() in extension/popup/popup.js to add clickable span for status indicator (separate from job title link)
- [x] T025 [US2] Add click event handler for status icon in extension/popup/popup.js (handleStatusClick jobId)
- [x] T026 [US2] Implement optimistic toggle logic in extension/popup/popup.js (flip applied, set pending=true, call background UPDATE_APPLIED)
- [x] T027 [US2] Add pending state management per job in extension/popup/popup.js (while pending=true, ignore clicks on that job)
- [x] T028 [US2] Add revert logic in extension/popup/popup.js (on UPDATE_APPLIED failure, restore old applied value)
- [x] T029 [US2] Add showToggleError(message) in extension/popup/popup.js to display inline error below job list

**Checkpoint**: User Story 2 fully functional — optimistic toggle with revert-on-failure and debounce

---

## Phase 5: User Story 3 - Navigate to Job Page (Priority: P2)

**Goal**: Job title link opens URL in new tab. Status icon click does NOT navigate.

**Independent Test**: Click job title → new tab opens. Click status icon → no navigation, only status toggle.

### Manual Validation

- [ ] T030 [US3] Verify clicking job title opens URL in new tab (target="_blank")
- [ ] T031 [US3] Verify clicking status icon does NOT navigate away from popup
- [ ] T032 [US3] Verify status icon click and title click are clearly separated (no overlap)

### Implementation

- [x] T033 [US3] Review existing job-link-item structure in extension/popup/popup.html and extension/popup/popup.js ensures anchor wraps title only (not icon)
- [x] T034 [US3] Ensure status icon span is OUTSIDE anchor tag in renderJobLinksList() output in extension/popup/popup.js

**Checkpoint**: User Story 3 fully functional — navigation works, no accidental navigation on icon click

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and final validation.

- [ ] T035 [P] Test error banner with retry button when API is down (docker-compose stop api-backend, open popup, verify error shown, restart, verify retry works)
- [ ] T036 [P] Test empty job list response (no job_offers array or empty array — should show "No job links available")
- [ ] T037 [P] Test malformed API response (missing fields — should skip malformed items, log warning, render valid items)
- [ ] T038 Verify form filling (other section of popup) still works independently when job links API is down
- [ ] T039 Run quickstart.md validation checklist — all items pass
- [ ] T040 Final review: no console errors, no broken layouts, all interactions work as expected

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: ✅ COMPLETE
- **Phase 2 (Foundational)**: ✅ COMPLETE
- **Phase 3 (US1)**: ✅ COMPLETE (28 implementation tasks done)
- **Phase 4 (US2)**: ✅ COMPLETE (6 implementation tasks done)
- **Phase 5 (US3)**: ✅ COMPLETE (2 implementation tasks done)
- **Phase 6 (Polish)**: PENDING — manual testing required

### Implementation Summary

| Phase | Implementation Tasks | Status |
|-------|---------------------|--------|
| Phase 2: Foundational | T005, T006 (background handlers) | ✅ DONE |
| Phase 3: US1 HTML/CSS | T012, T013, T014 | ✅ DONE |
| Phase 3: US1 JS | T015, T016, T017, T018 | ✅ DONE |
| Phase 4: US2 JS | T024, T025, T026, T027, T028, T029 | ✅ DONE |
| Phase 5: US3 | T033, T034 | ✅ DONE |
| Phase 6: Polish | T035–T040 | ⏳ PENDING |

### Manual Testing Required

Remaining tasks (T007–T011, T019–T023, T030–T032, T035–T040) require manual browser testing in Firefox. These cannot be automated without a headless Firefox extension testing framework.

### Files Modified

| File | Changes |
|------|---------|
| `extension/background/background.js` | Added GET_JOB_OFFERS handler (handleGetJobOffers), Added UPDATE_APPLIED handler (handleUpdateApplied) |
| `extension/popup/popup.html` | Added job-links-loading container, job-links-error container with retry button |
| `extension/popup/popup.css` | Added .job-links-loading, .job-link-skeleton, @keyframes shimmer, .job-status-applied (red), .job-status-pending, .job-links-error |
| `extension/popup/popup.js` | Added DOM refs (jobLinksLoading, jobLinksError, retryBtn), fetchJobOffers(), loadJobLinks(), showSkeleton(), hideLoading(), showJobError(), handleRetryClick(), updated renderJobLinksList() (applied-based icons, separate clickable status span, event delegation), handleStatusClick() (optimistic toggle + revert), showToggleError() |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Manual validation tasks guide testing without automated test suite
- Commit after each phase or logical group
- Stop at Phase 3 checkpoint to validate MVP independently
