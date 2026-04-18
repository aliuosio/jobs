# Tasks: Copy Cover Letter to Clipboard

**Feature**: Copy Cover Letter to Clipboard
**Branch**: `005-copy-cover-letter`
**Date**: 2026-04-18
**Spec**: [Spec](spec.md) | [Plan](plan.md)

**Note**: This is primarily a **configuration fix** - no new code development required. All functionality exists in the codebase.

## Implementation Strategy

**MVP Scope**: User Story 1 + User Story 4 (the core fix)
- Activate n8n workflow
- Verify webhook trigger works
- Copy functionality already exists

## Phase 1: Setup & Configuration

- [x] T001 Activate n8n workflow "3.Job Application Writer"

## Phase 2: Verification

- [x] T002 [P] Verify webhook responds to POST requests
- [x] T003 Run existing tests: `node extension/tests/cover-letter.test.js`

## Phase 3: User Story 1 - Copy Cover Letter (P1)

**Goal**: Enable copy icon to copy generated cover letter to clipboard
**Independent Test**: Generate a letter, click copy icon, paste to verify content

- [x] T004 [US1] Verify copy icon appears when cl_status is "ready"
- [x] T005 [US1] Verify click copies cover letter content to clipboard

## Phase 4: User Story 2 - Visual Indication (P2)

**Goal**: Show which jobs have cover letters
**Independent Test**: Jobs with letters show copy icon, jobs without don't

- [x] T006 [US2] Verify copy icon visibility logic in popup.js

## Phase 5: User Story 3 - Feedback (P3)

**Goal**: Show feedback when copy succeeds
**Independent Test**: Click copy, see icon change/toast

- [x] T007 [US3] Verify visual feedback in copy click handler

## Phase 6: User Story 4 - Trigger Webhook (P1)

**Goal**: Generate button triggers n8n webhook
**Independent Test**: Click Generate, webhook is called

- [x] T008 [US4] Verify POST request sent to webhook URL with job_offers_id
- [x] T009 [US4] Verify "generating" UI state during polling

## Phase 7: Polish

- [x] T010 [P] Update Quickstart.md with activation instructions

## Dependencies

```
T001 → T002 → T003
                ↓
           T004-T009
                ↓
             T010
```

## Parallel Opportunities

- T002 and T003 can run independently after T001
- T004-T009 can run in parallel (independent checks)
- T010 is polish, runs after all stories verified

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 10 |
| User Stories | 4 |
| Parallelizable | 3 |
| MVP Tasks | 3 (T001-T003) |

## Independent Test Criteria

| User Story | Test |
|------------|------|
| US1 | Click copy icon → paste and verify content |
| US2 | View job list → copy icon only on "ready" jobs |
| US3 | Click copy → see feedback (✓ or toast) |
| US4 | Click Generate → webhook called, then "ready" |