# Tasks: Generated Button Feedback

**Feature**: Generated Button Feedback  
**Generated**: 2026-04-18  
**Spec**: spec.md

## Implementation Strategy

**MVP Scope**: User Story 1 - Button shows "Generated" for ready status (just the core feedback change)  
**Delivery**: Incremental - each user story is independently testable

## Phases Overview

| Phase | Description | Tasks | Dependent On |
|-------|-------------|-------|--------------|
| Phase 1 | Setup & Tests | 4 | None |
| Phase 2 | US1: Button state changes | 3 | Phase 1 |
| Phase 3 | US2: Jobs List Generated | 2 | Phase 2 |
| Phase 4 | US3: Timer updates | 3 | Phase 3 |
| Phase 5 | Polish | 1 | All prior |

---

## Phase 1: Setup & TDD Tests

**Goal**: Write failing tests first per Constitution (TDD Required)

**Independent Test Criteria**: All tests pass for button states and timer behavior

### Tests (TDD - write FIRST)

- [x] T001 Create test for button shows "Generate" when cl_status is 'none' in extension/tests/cover-letter.test.js
- [x] T002 [P] Create test for button shows "Generating..." when cl_status is 'generating' in extension/tests/cover-letter.test.js
- [x] T003 [P] Create test for button shows "Generated" when cl_status is 'ready' in extension/tests/cover-letter.test.js
- [x] T003b [P] Create test verifying "Generated" button is disabled in extension/tests/cover-letter.test.js

---

## Phase 2: User Story 1 - Generate button changes to Generated

**Goal**: Button shows "Generated" (passive/disabled) when cl_status is 'ready'

**Independent Test Criteria**: Button displays "Generated" and is disabled for jobs with ready status

### Implementation

- [x] T004 [US1] Modify getClBadgeText to show "Generated" when cl_status is 'ready' in extension/popup/popup.js
- [x] T005 [US1] Update button rendering to show "Generated" (disabled) when cl_status is 'ready' in extension/popup/popup.js
- [x] T006 [US1] Verify tests pass for all button states in extension/tests/cover-letter.test.js

---

## Phase 3: User Story 2 - Jobs List shows Generated button

**Goal**: Jobs in list show "Generated" button for existing cover letters

**Independent Test Criteria**: Jobs list displays "Generated" for all jobs with ready status

### Implementation

- [x] T007 [P] [US2] Ensure job links rendering uses correct button text per status in extension/popup/popup.js
- [x] T008 [US2] Add test verifying jobs list shows Generated for ready status in extension/tests/cover-letter.test.js

---

## Phase 4: User Story 3 - Timer updates during generation

**Goal**: Timer displays elapsed time and updates every second

**Independent Test Criteria**: Timer increments every second during generation

### Implementation

- [x] T009 [US3] Add setInterval for timer updates in extension/popup/popup.js
- [x] T010 [US3] Implement timer overflow cap at "59:59" in extension/popup/popup.js
- [x] T011 [US3] Add test for timer update mechanism in extension/tests/cover-letter.test.js

---

## Phase 5: Polish

**Goal**: Cross-cutting concerns and final verification

### Final Tasks

- [x] T012 Run full test suite and verify no regressions in extension/tests/
- [x] T013 Load extension in Firefox and verify button states work as expected

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (US1) ← Phase 1
    ↓
Phase 3 (US2) ← Phase 2
    ↓
Phase 4 (US3) ← Phase 3
    ↓
Phase 5 (Polish)
```

## Parallel Execution Opportunities

Within Phases 1-4, tasks marked [P] can run in parallel:
- T002, T003 are parallel (different test cases)
- T007, T008 can parallel (list + test)
- T009, T010 can parallel (timer implementation)

## Files Reference

| File | Changes |
|------|---------|
| extension/popup/popup.js | Button rendering + timer logic |
| extension/tests/cover-letter.test.js | Add tests for new states |