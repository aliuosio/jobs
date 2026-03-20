# Tasks: Persist Extension State

**Input**: Design documents from `/specs/009-persist-extension-state/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Extension**: `extension/popup/`, `extension/background/`, `extension/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing extension structure and prepare for state persistence

- [x] T001 Review existing popup.js and background.js structure in extension/
- [x] T002 Verify browser.storage.local API availability in manifest.json permissions
- [x] T003 Review existing test patterns in extension/tests/

---

## Phase 2: Foundational (Storage Infrastructure)

**Purpose**: Core storage layer that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Storage Utilities

- [x] T004 [P] Add storage constants in extension/popup/popup.js (STORAGE_KEYS, STALE_THRESHOLD_MS)
- [x] T005 [P] Implement loadStateFromStorage() function in extension/popup/popup.js
- [x] T006 [P] Implement saveStateToStorage() function in extension/popup/popup.js
- [x] T007 [P] Implement isCacheStale(timestamp) function in extension/popup/popup.js
- [x] T008 Implement error handling for storage quota exceeded in extension/popup/popup.js
- [x] T009 Add storage version migration support in extension/popup/popup.js

**Checkpoint**: Storage infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Restore Job List After Extension Reopens (Priority: P1) 🎯 MVP

**Goal**: Job list and applied status persist across extension restarts

**Independent Test**: Open extension → view job list → mark a job as applied → close popup → reopen popup → verify job still shows as applied

### Implementation for User Story 1

- [x] T010 [P] [US1] Modify loadJobLinks() in extension/popup/popup.js to restore from storage first
- [x] T011 [P] [US1] Modify loadJobLinks() to cache job offers after API fetch
- [x] T012 [US1] Modify handleStatusClick() in extension/popup/popup.js to persist applied status to storage
- [x] T013 [US1] Modify handleUpdateApplied() in extension/background/background.js to update cache on API sync
- [x] T014 [US1] Add stale indicator logic for job cache > 1 hour old in extension/popup/popup.js

**Checkpoint**: User Story 1 complete - job list and applied status persist across restarts

---

## Phase 4: User Story 2 - Preserve Form Scan Results (Priority: P2)

**Goal**: Detected form fields persist across extension restarts on the same page

**Independent Test**: Open extension → scan page → view detected fields → close popup → reopen popup → verify same fields are displayed

### Implementation for User Story 2

- [x] T015 [P] [US2] Modify handleScanClick() in extension/popup/popup.js to cache detected fields with URL
- [x] T016 [P] [US2] Modify init() in extension/popup/popup.js to restore cached fields on same URL
- [x] T017 [US2] Implement URL change detection in extension/popup/popup.js to clear fields on navigation
- [x] T018 [US2] Modify renderFieldsList() in extension/popup/popup.js to display restored fields

**Checkpoint**: User Story 2 complete - form scan results persist on same page

---

## Phase 5: User Story 3 - Preserve Last Selected Tab (Priority: P3)

**Goal**: User's tab preference persists across extension restarts

**Independent Test**: Open extension → switch to Links tab → close popup → reopen popup → verify Links tab is still active

### Implementation for User Story 3

- [x] T019 [P] [US3] Modify init() in extension/popup/popup.js to restore lastTab from storage
- [x] T020 [P] [US3] Modify switchTab() in extension/popup/popup.js to persist tab preference

**Checkpoint**: User Story 3 complete - tab preference persists across sessions

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that enhance all user stories

- [x] T021 [P] Add stale data visual indicator to extension/popup/popup.html
- [ ] T022 [P] Create extension/tests/storage-persistence.test.js for manual verification
- [x] T023 Update quickstart.md testing checklist with completed items
- [ ] T024 Code review and verify all storage operations handle errors gracefully

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - Can proceed sequentially in priority order (US1 → US2 → US3)
  - Or in parallel with separate developers
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2

### Within Each User Story

- Core storage integration before UI restoration
- Each story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (T004-T007)
- All US1 tasks marked [P] can run in parallel (T010-T011)
- All US2 tasks marked [P] can run in parallel (T015-T016)
- All US3 tasks marked [P] can run in parallel (T019-T020)
- T021 and T022 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch storage utilities in parallel:
Task: T004 - Add storage constants in popup.js
Task: T005 - Implement loadStateFromStorage() in popup.js
Task: T006 - Implement saveStateToStorage() in popup.js
Task: T007 - Implement isCacheStale() in popup.js

# Then sequential for US1:
Task: T010 - Modify loadJobLinks() to restore from storage
Task: T011 - Modify loadJobLinks() to cache after fetch
Task: T012 - Modify handleStatusClick() to persist applied status
Task: T013 - Modify handleUpdateApplied() to update cache
Task: T014 - Add stale indicator logic
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test job list persistence independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add Polish phase → Final validation

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 24 |
| Phase 1 (Setup) | 3 |
| Phase 2 (Foundational) | 6 |
| Phase 3 (US1 - Job List) | 5 |
| Phase 4 (US2 - Form Fields) | 4 |
| Phase 5 (US3 - Tab Pref) | 2 |
| Phase 6 (Polish) | 4 |
| Parallelizable [P] | 14 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- MVP scope: Phase 1 + Phase 2 + Phase 3
- All phases can be developed incrementally and deployed separately
