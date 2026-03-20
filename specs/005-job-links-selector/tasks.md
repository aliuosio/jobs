# Tasks: Job Details Links Selector

**Input**: Design documents from `/specs/005-job-links-selector/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: No automated tests - manual testing in browser

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Extension popup files: `extension/popup/`
- Data source: `extension/popup/datasource/`
- Tests: `extension/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add UI structure and integrate dummy data into existing popup.js

- [ ] T001 [P] Add job links section HTML to extension/popup/popup.html after "Detected Fields" section
- [ ] T002 [P] Add job links CSS styles to extension/popup/popup.css
- [ ] T003 [P] Add dummy data function to extension/popup/popup.js (NO new file)

**Checkpoint**: Setup complete - UI structure and dummy data ready in existing files

---

## Phase 2: User Story 1 - View Job Links List (Priority: P1) 🎯 MVP

**Goal**: Display 5 dummy job links with status indicators in the extension popup

**Independent Test**: Open extension popup and visually confirm 5 links are displayed with visible status indicators

### Implementation for User Story 1

- [ ] T004 [US1] Add getDummyJobLinks() function to extension/popup/popup.js (no import needed)
- [ ] T005 [US1] Create renderJobLinksList() function in extension/popup/popup.js
- [ ] T006 [US1] Call renderJobLinksList() on popup initialization (DOMContentLoaded)
- [ ] T007 [US1] Style status indicators in extension/popup/popup.css (.job-status-indicator)

**Checkpoint**: User Story 1 complete - 5 links display with status indicators

---

## Phase 3: User Story 2 - Select and Open Job Link (Priority: P2)

**Goal**: Click a job link to open the job details page in a new tab

**Independent Test**: Click each link and verify correct URL loads in a new browser tab

### Implementation for User Story 2

- [ ] T008 [P] [US2] Add click event handlers to job link items in extension/popup/popup.js
- [ ] T009 [P] [US2] Implement browser.tabs.create() to open links in new tabs
- [ ] T010 [US2] Add visual feedback on link click (highlight selected link)

**Checkpoint**: User Story 2 complete - clicking links opens new tabs

---

## Phase 4: User Story 3 - Clear Indicators for Link Status (Priority: P3)

**Goal**: Provide accessible, keyboard-navigable job links with status tracking

**Independent Test**: Tab through links, verify Enter activates, check WCAG AA contrast

### Implementation for User Story 3

- [ ] T011 [P] [US3] Add tabindex="0" to job link items in extension/popup/popup.html
- [ ] T012 [US3] Add keyboard event handlers (Enter key) in extension/popup/popup.js
- [ ] T013 [US3] Verify WCAG AA contrast ratios for status indicators (#22c55e, #9ca3af, #3b82f6)

**Checkpoint**: User Story 3 complete - keyboard navigation and accessibility verified

---

## Phase 5: Polish & Edge Cases

**Purpose**: Handle edge cases and finalize UI

- [ ] T014 Handle empty data source (show "No job links available" message)
- [ ] T015 Handle long titles (truncate with ellipsis at ~30 chars)
- [ ] T016 Verify 320px popup width constraint is maintained
- [ ] T017 Final manual testing in Firefox browser

**Checkpoint**: All user stories complete, edge cases handled

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Stories (Phase 2-4)**: All depend on Setup completion
  - US1 (P1) → US2 (P2) → US3 (P3) - sequential for simplicity
- **Polish (Phase 5)**: Depends on all user stories being complete

### Task Dependencies

| Task | Depends On | Can Parallel With |
|------|-----------|------------------|
| T001 | None | T002, T003 |
| T002 | None | T001, T003 |
| T003 | None | T001, T002 |
| T004 | T003 | None |
| T005 | T004 | None |
| T006 | T005 | None |
| T007 | T002 | None |
| T008 | T006 | T009 |
| T009 | T006 | T008 |
| T010 | T008, T009 | None |
| T011 | T002 | T012 |
| T012 | T011 | T011 |
| T013 | T007, T010, T012 | None |
| T014-T017 | T013 | None |

### Parallel Opportunities

- T001, T002, T003 can run in parallel (no dependencies)
- T004, T005, T006 can run sequentially (after T003)
- T008, T009 can run in parallel (after T006)
- T011, T012 can run in parallel (after T002)

---

## Implementation Strategy

### Simplified Approach (No New Files)
1. Integrate dummy data function directly into popup.js
2. Add HTML section to existing popup.html
3. Add CSS to existing popup.css
4. No separate datasource file needed

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002, T003)
2. Complete Phase 2: User Story 1 (T004, T005, T006, T007)
3. **STOP and VALIDATE**: Test viewing 5 links with status indicators
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → US1 → Test → Deploy (MVP!)
2. Add US2 → Test → Deploy
3. Add US3 → Test → Deploy
4. Polish → Final Test → Release

---

## Success Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | 5 job links displayed | Visual confirmation in popup |
| 2 | Each link has status indicator | Green dot visible for "new" status |
| 3 | Clicking opens new tab | browser.tabs.create() called |
| 4 | Keyboard navigation works | Tab/Enter tested manually |
| 5 | WCAG AA contrast met | Colors verified (#22c55e, #9ca3af, #3b82f6) |

---

## Notes

- Follow existing popup patterns (popup.js, popup.css, popup.html)
- Reuse existing CSS classes where possible (.field-item, .field-confidence)
- Minimal changes to popup.js (add functions, don't restructure)
- No persistence - status resets on popup close
- Manual testing only - no automated tests needed for MVP
