# Tasks: Persist Job State on Extension Open

**Feature**: 1006-persist-job-state | **Created**: 2026-04-11

## Implementation Strategy

**MVP Focus**: User Story 1 (Load cached jobs on open) - provides immediate value  
**Delivery**: Incremental - complete each user story independently

## Phases

### Phase 1: Setup
*(No setup tasks needed - existing infrastructure sufficient)*

### Phase 2: Foundational
*(No foundational tasks - existing storage infrastructure already in place)*

### Phase 3: User Story 1 - Load Last Refreshed Jobs on Extension Open

**Goal**: Display cached job data immediately when opening extension  
**Independent Test**: Open extension → jobs display without clicking refresh  
**Priority**: P1

- [x] T001 [US1] Add LAST_CLICKED_JOB_LINK to STORAGE_KEYS in extension/popup/popup.js
- [x] T002 [US1] Implement loadLastClickedJobLink function in extension/popup/popup.js
- [x] T003 [US1] Modify init() to load cached jobs first, then trigger optional background refresh in extension/popup/popup.js
- [x] T004 [US1] Update cacheJobOffers to use existing storage pattern in extension/popup/popup.js
- [x] T005 [US1] Test cached data loading on popup open in extension/popup/popup.js

### Phase 4: User Story 2 - Highlight Last Clicked Job Link

**Goal**: Yellow highlight persists after closing/reopening extension  
**Independent Test**: Click job → close → open → yellow highlight visible  
**Priority**: P1

- [x] T006 [US2] Implement saveLastClickedJobLink function in extension/popup/popup.js
- [x] T007 [US2] Modify job link click handler to save last clicked in extension/popup/popup.js
- [x] T008 [US2] Update renderJobLinksList to apply highlight to last clicked in extension/popup/popup.js
- [x] T009 [US2] Handle edge case when last clicked not in current job list in extension/popup/popup.js

### Phase 5: User Story 3 - Clear Persisted State

**Goal**: User can clear cached data and highlight state  
**Priority**: P3

*(User requested to skip this feature)*

### Phase 6: Polish & Cross-Cutting Concerns

- [x] T013 Verify all storage keys use consistent pattern in extension/popup/popup.js
- [x] T014 Test offline behavior (backend unavailable) in extension/popup/popup.js
- [x] T015 Verify <500ms display time target in extension/popup/popup.js
- [x] T016 Display stale data indicator when showing cached data from previous refresh in extension/popup/popup.js
- [x] T017 Update stale indicator visibility based on data freshness in extension/popup/popup.js

## Dependencies

```
US1 (Phase 3) ─┬─► US2 (Phase 4) ─┬─► US3 (Phase 5)
               │                   │
               │                   └─► Polish (Phase 6)
               │
               └─────────────────────► Polish (Phase 6)
```

## Parallel Execution Opportunities

| Phase | Tasks | Can Run Parallel |
|-------|-------|-----------------|
| Phase 3 | T001-T005 | T001, T002 can run before T003-T005 (different functions) |
| Phase 4 | T006-T009 | T006, T007 can run before T008, T009 |
| Phase 5 | T010-T012 | T010 can run before T011, T012 |

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 14 |
| User Story 1 Tasks | 5 |
| User Story 2 Tasks | 4 |
| User Story 3 Tasks | 0 (skipped per user request) |
| Polish Tasks | 5 |
| Parallelizable Tasks | 8 |

**MVP Scope**: Phase 3 (T001-T005) - loads cached jobs on extension open

**Implementation Status**: Complete ✓