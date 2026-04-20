# Tasks: Fix Job Offer Delete with Cover Letter

**Feature Branch**: `008-fix-job-delete-cover-letter`
**Generated**: 2026-04-20

## Implementation Strategy

**MVP Scope**: User Story 1 only - single SQL fix to enable delete with cover letter
**Incremental Delivery**: User Story 2 is already covered by the same fix (deletes ALL related records)

### User Stories

| ID | Story | Priority | Task Count | Independent Test Criteria |
|----|-------|----------|------------|--------------------------|
| US1 | Delete Job Offer with Cover Letter | P1 | 1 | Delete job offer with cover letter, verify success |
| US2 | Delete Job Offer with Multiple Applications | P2 | 0 | Already covered by US1 fix |

## Phase 1: Setup (N/A)

No setup tasks required - existing infrastructure used.

## Phase 2: Foundational (N/A)

No foundational tasks - using existing service.

## Phase 3: User Story 1 - Delete Job Offer with Cover Letter (P1)

**Goal**: Allow users to delete job offers that have a generated cover letter

**Independent Test Criteria**: 
- Create job offer with cover letter (via extension or API)
- Attempt delete via extension
- Verify job offer removed from list without FK constraint error

**Implementation Tasks**:

- [X] T001 [US1] Add DELETE for job_applications in delete_job_offer() in src/services/job_offers.py

**Dependencies**: None - single function modification

**Parallel Opportunities**: None - single task

## Phase 4: User Story 2 - Delete Job Offer with Multiple Applications (P2)

**Goal**: Handle multiple applications for same job offer

**Independent Test Criteria**: 
- Generate multiple cover letters for same job
- Delete job offer
- Verify ALL related records removed

**Implementation Tasks**:

- [X] T002 [US2] Verify cascading delete handles multiple job_applications records

**Note**: Already covered by T001 - the DELETE uses WHERE clause that matches ALL related records

## Phase 5: Polish & Cross-Cutting Concerns

**Independent Test**: Full test suite passes, no regressions

**Implementation Tasks**:

- [X] T003 Run existing integration tests to verify no regressions in tests/integration/test_job_offer_delete.py

## Dependencies

```
T001 (US1) ──┬── T002 (US2) [implicit - same code handles]
              └── T003 [requires T001 completion]
```

## Parallel Execution Examples

None for this simple fix - tasks are sequential.

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 3 |
| User Story 1 | 1 task |
| User Story 2 | 0 tasks (covered by US1) |
| Parallelizable Tasks | 0 |
| MVP Tasks | 1 (T001) |

## Quick Reference

| Task | File | Action |
|------|------|--------|
| T001 | src/services/job_offers.py | Add DELETE for job_applications in delete_job_offer() |
| T002 | (implicit) | Verify multiple records handled |
| T003 | tests/integration/test_job_offer_delete.py | Run tests for regression check |