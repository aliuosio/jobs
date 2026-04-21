# Tasks: Fix Copy to Clipboard Button

**Feature**: Fix Copy to Clipboard Button  
**Branch**: `010-fix-copy-clipboard-button`  
**Generated**: 2026-04-21

---

## Phase 1: Setup

- [ ] T001 Verify feature branch is active and extension files accessible

---

## Phase 2: Foundational

- [ ] T002 [P] Read current copy button implementation in extension/popup/popup.js (lines 1289-1308)
- [ ] T003 [P] Read API service method checkGenerationStatus in extension/services/api-service.js

---

## Phase 2b: TDD Test (Required by Constitution)

This phase ensures TDD workflow per Constitution III - write failing test BEFORE implementation.

- [X] T003b [TDD] Write failing test for copy button in extension/tests/cover-letter.test.js
   - Test: Click copy button → copies content to clipboard
   - Expected: Test FAILS until T004-T006 implemented
   - Run: `node extension/tests/cover-letter.test.js` (should fail)
   - This is REQUIRED per Constitution gate "TDD Required"

---

## Phase 3: User Story 1 - Copy Cover Letter to Clipboard

**Goal**: Users can copy generated cover letter to clipboard when button is clicked

**Independent Test Criteria**:
1. Have a job with generated cover letter (status.status = 'completed')
2. Click copy button
3. Verify clipboard contains cover letter text

### Implementation

- [X] T004 [US1] Fix copy function in extension/popup/popup.js to use correct API response field `status.content`
- [X] T005 [US1] Add proper error handling with visible error message in extension/popup/popup.js
- [X] T006 [US1] Add debounce - disable button during copy operation in extension/popup/popup.js

**Verify**: After T004-T006, run `node extension/tests/cover-letter.test.js` → should PASS

**Parallel**: T004, T005, T006 are independent error handling paths

---

## Phase 4: User Story 2 - Visual Feedback on Copy

**Goal**: Users see clear visual confirmation when copy succeeds or fails

**Independent Test Criteria**:
1. Click copy button
2. Observe button state changes for 2 seconds

### Implementation

- [X] T007 [US2] Add success state styling in extension/popup/popup.css (green background, checkmark)
- [X] T008 [US2] Add error state styling in extension/popup/popup.css (red, error message)
- [X] T009 [US2] Add disabled state styling in extension/popup/popup.css

**Parallel**: T007, T008, T009 can be done in parallel (different CSS classes)

---

## Phase 5: Polish & Cross-Cutting

- [ ] T010 Verify all states work: default → success → revert (2s), default → error → revert (2s)
- [ ] T011 Test rapid clicks are debounced/ignored during copy operation
- [ ] T012 [FR-002] Implement copy button visibility logic based on `cl_status` field
- [ ] T013 [FR-005] Implement API call to `/job-applications?job_offer_id={id}` endpoint
- [ ] T014 [FR-006] Add processing state handling with hourglass indicator
- [ ] T015 [FR-008] Add pre-existing cover letter check on job load
- [ ] T016 [FR-009] Change message positioning to display BELOW job listing
- [ ] T017 Test non-HTTPS context handling with error message
- [ ] T018 Test long cover letter (>10KB) copy operation
- [ ] T019 Verify button state persistence across different job links

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 19 |
| User Story 1 Tasks | 3 |
| User Story 2 Tasks | 3 |
| Cross-Cutting Tasks | 9 |
| TDD Test Task | 1 (T003b) |
| Parallel Opportunities | 6 |
| Requirements Coverage | 100% (all 9 functional requirements) |
| MVP Scope | T003b + T004-T006 (test + copy functionality) |

## Files to Modify

| Task | File |
|------|------|
| T001 | N/A - Verification |
| T002 | extension/popup/popup.js |
| T003 | extension/services/api-service.js |
| T003b | extension/tests/cover-letter.test.js |
| T004 | extension/popup/popup.js |
| T005 | extension/popup/popup.js |
| T006 | extension/popup/popup.js |
| T007 | extension/popup/popup.css |
| T008 | extension/popup/popup.css |
| T009 | extension/popup/popup.css |
| T010 | N/A - Verification |
| T011 | N/A - Verification |
| T012 | extension/popup/popup.js |
| T013 | extension/services/api-service.js |
| T014 | extension/popup/popup.js |
| T015 | extension/services/api-service.js |
| T016 | extension/popup/popup.js |
| T017 | N/A - Verification |
| T018 | N/A - Verification |
| T019 | N/A - Verification |

## Implementation Strategy

**TDD Workflow** (REQUIRED per Constitution III):
1. **T003b**: Write failing test - run `node extension/tests/cover-letter.test.js` → should FAIL
2. **T004-T006**: Implement fixes - run test → should PASS
3. **T007-T009**: CSS enhancements - tests continue to pass
4. **T010-T011**: Final verification

**MVP First**: Focus on TDD test + User Story 1 first - copy functionality. Core fixes:
1. Fix API field access (`status.content`)
2. Fix status check (`status.status === 'completed'`)
3. Add visible error handling
4. Add debounce

**Incremental Delivery**: Add visual feedback styles (CSS) as separate enhancement.

## Dependencies

- Phase 2 (T002-T003) must complete before User Story phases
- Phase 2b (T003b - TDD test) MUST complete before Phase 3 (T004-T006)
  - Test must FAIL before implementation per Constitution TDD gate
- Phase 3 (US1) and Phase 4 (US2) are independent - can work in parallel
- All implementation tasks before polish (T010-T011)