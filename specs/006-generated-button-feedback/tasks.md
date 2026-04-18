---

description: "Task list for Generated Button Feedback feature - UPDATED"
---

# Tasks: Generated Button Feedback

**Input**: Design documents from `/specs/006-generated-button-feedback/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: TDD tests are REQUIRED per Constitution - include them before each user story implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (No setup required)

**Purpose**: Browser extension project already exists - no initialization needed

**Note**: This is a simple UI modification to existing popup.js - no project setup required

---

## Phase 2: Foundational (No blocking prerequisites)

**Purpose**: This is a UI change to existing code - no foundational infrastructure changes needed

**Note**: The existing extension infrastructure (popup.js, storage, API) already supports all required functionality

---

## Phase 3: User Story 1 - Remove redundant Generated indicator (Priority: P1) 🎯 MVP

**Goal**: Remove the "Generated" badge, keep only ONE green "Generated" button at end of row when `cl_status` is 'ready'

**Independent Test**: View jobs with `cl_status: 'ready'` - should see ONE green button, NOT a badge AND button

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T001 [P] [US1] Add test: Button shows green "Generated" when cl_status is 'ready' in extension/tests/cover-letter.test.js
- [ ] T002 [P] [US1] Add test: No "Generated" badge appears when cl_status is 'ready' in extension/tests/cover-letter.test.js
- [ ] T003 [P] [US1] Add test: Only ONE Generated indicator for jobs with cl_status 'ready' in extension/tests/cover-letter.test.js

### Implementation for User Story 1

- [ ] T004 [US1] Modify getClBadgeText() in extension/popup/popup.js to NOT return "Generated" for cl_status 'ready' (badge should be hidden)
- [ ] T005 [US1] Modify getClBadgeClass() in extension/popup/popup.js to NOT return 'cl-badge-ready' for cl_status 'ready' (avoid badge styling)
- [ ] T006 [P] [US1] Modify renderJobLinksList() button rendering in extension/popup/popup.js to show green "Generated" button when cl_status is 'ready'
- [ ] T007 [P] [US1] Add green styling for "Generated" button in extension/popup/popup.css (new .btn-generated class with green background)

**Checkpoint**: At this point, User Story 1 should be fully functional - ONE green button shows, NO badge

---

## Phase 4: User Story 2 - Fix copy to clipboard functionality (Priority: P1)

**Goal**: Copy button correctly copies cover letter content and shows visual feedback

**Independent Test**: Click copy button on a job with cl_status 'ready' - text should be in clipboard, button shows checkmark

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US2] Add test: Copy button copies cover letter to clipboard in extension/tests/cover-letter.test.js
- [ ] T009 [P] [US2] Add test: Copy button shows checkmark feedback after copy in extension/tests/cover-letter.test.js
- [ ] T010 [US2] Add test: Copy button reverts to normal after 2 seconds in extension/tests/cover-letter.test.js

### Implementation for User Story 2

- [ ] T011 [US2] Debug and fix copy button handler in extension/popup/popup.js (setupClEventListeners function)
- [ ] T012 [US2] Debug: Verify window.apiService.checkGenerationStatus(jobId) returns {status: 'completed', content: string} in extension/popup/popup.js
- [ ] T013 [US2] Ensure navigator.clipboard.writeText() is called with correct cover letter text

**Checkpoint**: At this point, User Story 2 should work - copy button copies text and shows feedback

---

## Phase 5: User Story 3 - Generate button changes to Generated (Priority: P1)

**Goal**: After generation completes, button shows "Generated" (disabled) instead of reverting to "Generate"

**Independent Test**: Trigger generation, wait for completion - button should show "Generated" (not "Generate")

### Tests for User Story 3 ⚠️

> **NOTE: These are covered by US1 tests** - same button behavior

- Test T001 already covers: "Button shows green 'Generated' when cl_status is 'ready'"

### Implementation for User Story 3

- [ ] T014 [US3] Ensure updateClState() properly sets cl_status to 'ready' after generation completes
- [ ] T015 [US3] Verify renderJobLinksList() re-renders correctly when cl_status changes to 'ready'

**Note**: This is essentially handled by US1 implementation - the button already shows "Generated" when ready

**Checkpoint**: User Story 3 is covered by US1 implementation

---

## Phase 6: User Story 4 - Timer shows elapsed time during generation (Priority: P2)

**Goal**: Timer updates every second during generation instead of showing static value

**Independent Test**: Start generation - timer should increment every second

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US4] Add test: Timer displays elapsed time when cl_status is 'generating' in extension/tests/cover-letter.test.js
- [ ] T017 [P] [US4] Add test: Timer updates every second during generation in extension/tests/cover-letter.test.js

### Implementation for User Story 4

- [ ] T018 [US4] Implement startTimerUpdate() function in extension/popup/popup.js to start setInterval
- [ ] T019 [US4] Implement stopTimerUpdate() function in extension/popup/popup.js to clear interval
- [ ] T020 [US4] Call startTimerUpdate() in init() when any job has cl_status 'generating'
- [ ] T021 [US4] Call stopTimerUpdate() when generation completes or popup closes

**Checkpoint**: At this point, User Story 4 works - timer updates every second during generation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T022 Run all tests in extension/tests/cover-letter.test.js - ensure all pass
- [ ] T023 [P] Manual test: Verify one green "Generated" button appears for jobs with cl_status 'ready'
- [ ] T024 [P] Manual test: Verify copy button works and shows feedback
- [ ] T025 [P] Manual test: Verify timer updates during generation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: No blocking prerequisites for this UI change
- **User Stories (Phase 3+)**: All can proceed after understanding existing code
  - User Story 1 (MVP) should be completed first
  - User Stories 2-4 can follow sequentially
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - UI button/badge changes
- **User Story 2 (P1)**: Independent - copy functionality fix
- **User Story 3 (P1)**: Covered by US1 implementation (same button behavior)
- **User Story 4 (P2)**: Independent - timer updates (can run in parallel with others after US1)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Button/badge logic before styling
- Timer start/stop lifecycle management

### Parallel Opportunities

- T001, T002, T003 (US1 tests) can run in parallel
- T004, T005, T006 (US1 implementation) can run in parallel (different functions)
- T007 (styling) can run in parallel with T004-T006
- T008, T009, T010 (US2 tests) can run in parallel
- T023, T024, T025 (manual tests) can run in parallel
- US2 can start after US1 is partially done (T006 complete)
- US4 can start after US1 is partially done (T006 complete)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1
2. **STOP and VALIDATE**: Test that ONE green button shows, NO badge
3. Deploy/demo if ready

### Incremental Delivery

1. Complete User Story 1 → Test → Deploy (MVP!)
2. Add User Story 2 → Test → Deploy
3. Add User Story 3 → Test → Deploy (already covered by US1)
4. Add User Story 4 → Test → Deploy

---

## Notes

- [P] tasks = different files/functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- This is a simple UI change - no complex dependencies
- Main file: extension/popup/popup.js
- Main test file: extension/tests/cover-letter.test.js
- Main style file: extension/popup/popup.css