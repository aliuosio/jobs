# Tasks: Dynamic Form Field Detection

**Input**: Design documents from `/specs/002-dynamic-field-detection/`
**Prerequisites**: plan.md, spec.md

**Note**: This is a browser extension with no setup/foundational phase required. The existing extension infrastructure is ready to use.

---

## Clarifications (Session 2026-03-19)

| Question | Decision | Impact |
|----------|----------|--------|
| Q1: Latency Target | No latency bound | No strict timing requirement for detection |
| Q2: onFieldDetected payload | Element + metadata in separate args | Callback receives `(fieldElement, fieldDescriptor)` |
| Q3: Latency boundary | No explicit boundary | No latency measurement in acceptance criteria |
| Q4: Maximum tracked fields | Enforce a limit (e.g., 200 fields) | Predictable performance and UX in heavy pages |
| Q5: Dynamically removed fields | Re-scan to reconcile | Trigger reconciliation scan when fields are removed from DOM |

---

## Phase 1: Core Implementation (User Story 1 - MVP)

**Goal**: Detect dynamically loaded form fields via MutationObserver extension
**Independent Test**: Run unit tests, verify fields detected on Proxify test page

### Tests for User Story 1 (Write tests FIRST, ensure they FAIL) ⚠️

- [ ] T001 [P] [US1] Write test for direct field element detection in `extension/tests/form-observer.test.js`
- [ ] T002 [P] [US1] Write test for field detection from container element in `extension/tests/form-observer.test.js`
- [ ] T003 [P] [US1] Write test for `onFieldDetected(fieldElement, fieldDescriptor)` callback signature in `extension/tests/form-observer.test.js`

### Implementation for User Story 1

- [ ] T004 [P] [US1] Add `processedFields: WeakSet` and `onFieldDetected` callback in FormObserver constructor in `extension/content/form-observer.js`
- [ ] T005 [US1] Extend `processPendingMutations()` to detect individual fields alongside forms in `extension/content/form-observer.js`
- [ ] T006 [P] [US1] Extend `reset()` method to reset processedFields WeakSet in `extension/content/form-observer.js`
- [ ] T007 [US1] Extend `scanOrphanInputs()` for consistency in `extension/content/form-observer.js`
- [ ] T008 [US1] Add `onFieldDetected` callback to FormObserver options in `extension/content/content.js`
- [ ] T009 [US1] Handler adds field to detectedFields list with deduplication in `extension/content/content.js`
- [ ] T010 [US1] Verify no unnecessary re-scans when no new fields are added
- [ ] T011 [US1] Verify debounce mechanism works correctly for field detection (reuse existing 300ms debounce)

**Checkpoint**: User Story 1 complete - fields are detected, no duplicate entries in tracking list,---

## Phase 2: Performance (User Story 2)

**Goal**: Ensure efficient mutation handling without performance degradation
**Independent Test**: Load a page with 100+ rapid mutations. Extension should maintain responsiveness and not cause noticeable lag.
### Tests for User Story 2
- [ ] T012 [P] [US2] Write test for batch processing of multiple fields in `extension/tests/form-observer.test.js`
### Implementation for User Story 2
- [ ] T013 [US2] Verify debounce mechanism works correctly for field detection (reuse existing 300ms debounce)
- [ ] T014 [US2] Verify no unnecessary re-scans when no new fields are added
**Checkpoint**: User Story 2 complete - mutations are handled efficiently
---

## Phase 3: Data Integrity & Field Limits (User Story 3)
**Goal**: Prevent duplicate field tracking with 200-field limit and re-scan reconciliation
**Independent Test**: Trigger same field detection twice, verify single entry
### Tests for User Story 3
- [ ] T015 [P] [US3] Write test for duplicate field prevention in `extension/tests/form-observer.test.js`
- [ ] T016 [P] [US3] Write test for field limit enforcement (max 200 fields) in `extension/tests/form-observer.test.js`
- [ ] T017 [P] [US3] Write test for re-scan reconciliation when fields are removed from DOM in `extension/tests/form-observer.test.js`
### Implementation for User Story 3
- [ ] T018 [US3] Implement duplicate prevention: `if (!this.processedFields.has(field))` in `processPendingMutations()` in `extension/content/form-observer.js`
- [ ] T019 [US3] Implement field limit check: throw warning if `detectedFields.size >= MAX_TRACKED_FIELDS` in `extension/content/form-observer.js`
- [ ] T020 [US3] Implement `reconcileFields()` method to re-scan when fields are removed from DOM in `extension/content/form-observer.js`
- [ ] T021 [US3] Add cross-check `processedForms.has(field)` in `processPendingMutations()` in `extension/content/form-observer.js`
**Checkpoint**: User Story 3 complete - no duplicate fields in tracking list,---

## Phase 4: Integration & Polish
**Purpose**: Cross-cutting improvements and final validation
- [ ] T022 [P] Run all unit tests: `node extension/tests/form-observer.test.js`
- [ ] T023 Run existing tests to ensure no regression: `node extension/tests/*.test.js`
- [ ] T024 Manual test on Proxify URL: Navigate through multi-step form, verify fields appear
- [ ] T025 Verify popup shows updated field count after dynamic loading
- [ ] T026 Verify visual indicators (`jfh-field-detected`) appear on newly detected fields
---

## Dependencies & Execution Order
### Phase Dependencies
- **Phase 1 (Core)**: No prerequisites - can start immediately
- **Phase 2 (Performance)**: Depends on Phase 1 completion
- **Phase 3 (Integrity)**: Depends on Phase 1 completion (can run parallel with Phase 2)
- **Phase 4 (Polish)**: Depends on Phases 1-3 completion
### Parallel Opportunities
- T001, T002, T003 can run in parallel (different test scenarios)
- T004, T006 can run in parallel (constructor and reset modifications)
- T012, T016 can run in parallel (batch tests)
- T015, T016, T017 can run in parallel (limit and reconciliation tests)
### Execution Strategy
**MVP First (User Story 1)**:
1. Write T001, T002, T003 - ensure tests fail
2. Implement T004, T005, T006, T007, T008
3. Run T022 - should pass
4. Manual test on Proxify URL
**Full Feature**:
1. Complete User Story 1 → Test
2. Complete User Story 2 → Test
3. Complete User Story 3 → Test
4. Phase 4 Polish → Final validation
---
## Files Reference
### Modified Files
| File | Changes |
|------|---------|
| `extension/content/form-observer.js` | Add processedFields WeakSet, onFieldDetected callback, extend processPendingMutations() |
| `extension/content/content.js` | Add handleFieldDetected callback, wire up FormObserver |
| `extension/tests/form-observer.test.js` | NEW - unit tests for field detection |
### Unchanged Files (verified)
- `extension/content/form-scanner.js` - already works with any container
- `extension/manifest.json` - content scripts already run on all URLs
---
## Notes
- [P] tasks = can run in parallel (different files or independent)
- Tests MUST fail before implementation (TDD approach)
- Commit after each task or logical group
- Stop at Phase 1 checkpoint for MVP validation if needed
