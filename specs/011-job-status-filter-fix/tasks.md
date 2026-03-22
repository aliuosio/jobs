# Tasks: Job Status List Filtering Fix

**Input**: Design documents from `/specs/011-job-status-filter-fix/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual browser testing (no automated tests - extension UI testing)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Verification)

**Purpose**: Verify existing implementation handles US1, US2, US3 correctly

**Independent Test**: Open popup → verify only non-applied jobs shown → click icon → job disappears → refresh → non-applied still shown

- [x] T001 Review existing `filterNotAppliedLinks()` in extension/popup/popup.js to verify it filters `applied=false` jobs correctly (covers: FR-001, FR-002) ✅ VERIFIED
- [x] T002 Review existing `handleStatusClick()` in extension/popup/popup.js to verify it removes job from list after successful toggle (covers: FR-003, FR-004, FR-005, FR-007) ✅ VERIFIED
- [x] T003 Review existing `loadJobLinks()` in extension/popup/popup.js to verify refresh uses same filter (covers: FR-006) ✅ VERIFIED

**Checkpoint**: Existing implementation verified for US1, US2, US3

---

## Phase 2: Foundational - Show Applied Toggle (NEW FEATURE)

**Purpose**: Add "Show Applied" toggle to reveal applied jobs

**⚠️ CRITICAL**: This phase implements the NEW feature (US4). All other user stories are verified working.

### Implementation for Show Applied Toggle (US4)

- [x] T004 [P] Add `SHOW_APPLIED_FILTER` to `STORAGE_KEYS` constant in extension/popup/popup.js ✅ DONE
- [x] T005 [P] Add `showAppliedFilter` state variable (default: false) in extension/popup/popup.js ✅ DONE
- [x] T006 Add `filterJobLinks(links, showApplied)` helper function in extension/popup/popup.js that:
  - Returns all links when `showApplied === true`
  - Returns `filterNotAppliedLinks(links)` when `showApplied === false` ✅ DONE
- [x] T007 Add `restoreShowAppliedFilter()` async function in extension/popup/popup.js that:
  - Loads filter state from browser.storage.local
  - Sets checkbox checked state ✅ DONE
- [x] T008 Add checkbox toggle HTML in extension/popup/popup.html inside job-links-section ✅ DONE
- [x] T009 Add CSS styles in extension/popup/popup.css ✅ DONE
- [x] T010 Add `handleShowAppliedToggle()` function in extension/popup/popup.js that:
  - Reads checkbox state
  - Updates `showAppliedFilter` variable
  - Saves to browser.storage.local
  - Re-renders job list with current filter ✅ DONE
- [x] T011 Wire up toggle in `setupEventListeners()` in extension/popup/popup.js:
  - Add change event listener to `#show-applied-toggle`
  - Call `handleShowAppliedToggle()` ✅ DONE
- [x] T012 Call `restoreShowAppliedFilter()` in `init()` function in extension/popup/popup.js ✅ DONE
- [x] T013 Update all render call sites in extension/popup/popup.js to use `filterJobLinks()`:
  - `loadJobLinks()` after fetching/loading job links
  - `fetchAndCacheJobOffers()` after fetching
  - `handleStatusClick()` after successful toggle ✅ DONE

**Checkpoint**: Show Applied toggle fully functional

---

## Phase 3: Verification & Polish

**Purpose**: Final validation of all user stories

### Manual Validation

- [ ] T014 Verify popup loads with only non-applied jobs visible (applied jobs hidden) - MANUAL TEST
- [ ] T015 Verify clicking status icon turns it red and removes job from list - MANUAL TEST
- [ ] T016 Verify refresh button maintains filter (only non-applied shown) - MANUAL TEST
- [ ] T017 Verify "Show Applied" checkbox shows all jobs when checked - MANUAL TEST
- [ ] T018 Verify "Show Applied" state persists on popup close/reopen - MANUAL TEST
- [ ] T019 Verify "Show Applied" state persists on refresh - MANUAL TEST
- [ ] T020 Verify clicking status icon on applied job (with filter active) toggles it back to non-applied - MANUAL TEST

### Edge Case Verification

- [ ] T021 Verify empty list message shows when all jobs are applied (default filter) - MANUAL TEST
- [ ] T022 Verify API errors show error state with retry button - MANUAL TEST
- [ ] T023 Run quickstart.md validation checklist - MANUAL TEST

### Files Summary

| File | Tasks |
|------|-------|
| popup.html | T008 |
| popup.css | T009 |
| popup.js | T004, T005, T006, T007, T010, T011, T012, T013 |

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - verify existing code first
- **Phase 2 (Foundational)**: Depends on Phase 1 verification
- **Phase 3 (Verification)**: Depends on Phase 2 completion

### Within Phase 2 (Parallel Opportunities)

- T004, T005, T008, T009 can start immediately (no dependencies)
- T006 can start after T004/T005 (needs STORAGE_KEYS and state variable)
- T007 can start after T004/T005 (needs STORAGE_KEYS and state variable)
- T010 can start after T008 (needs HTML element to exist)
- T011 can start after T008 and T010 (needs element and handler)
- T012 can start after T004, T005, T007 (needs storage key and restore function)
- T013 can start after T006 (needs filterJobLinks function to be defined)

---

## Parallel Example: Phase 2

```bash
# These can start immediately in parallel:
Task T004: Add SHOW_APPLIED_FILTER to STORAGE_KEYS
Task T005: Add showAppliedFilter state variable  
Task T008: Add checkbox HTML to popup.html
Task T009: Add CSS styles to popup.css

# After T004-T005 complete:
Task T006: Add filterJobLinks() helper function
Task T007: Add restoreShowAppliedFilter() function

# After T008 complete:
Task T010: Add handleShowAppliedToggle() function

# After T006-T010 complete:
Task T011: Wire up event listener
Task T012: Call restoreShowAppliedFilter() in init()
Task T013: Update render call sites
```

---

## Implementation Strategy

### MVP First (US1, US2, US3 already implemented)

1. Complete Phase 1: Verify existing implementation
2. Complete Phase 2: Implement Show Applied toggle
3. **STOP and VALIDATE**: Test all user stories
4. Complete Phase 3: Final verification

### Quick Verification (10 minutes)

1. Open popup → jobs load, only non-applied shown ✅
2. Click status icon → job disappears ✅
3. Click refresh → same filter maintained ✅
4. Check "Show Applied" → applied jobs appear ✅
5. Close/reopen popup → filter state remembered ✅

---

## Notes

- US1, US2, US3 are verified, not implemented (already exist)
- US4 is the new feature requiring implementation
- Tests are manual browser testing only
- No backend changes needed
- Low risk: 3 files modified, all additions only
