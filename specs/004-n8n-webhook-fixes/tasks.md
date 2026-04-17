# Tasks: n8n Webhook Fixes - Job Application Writer

**Feature**: 004-n8n-webhook-fixes | **Branch**: 004-n8n-webhook-fixes | **Generated**: 2026-04-18

## Implementation Strategy

This is a **configuration-only change** to an existing n8n workflow. No code, no tests (TDD excluded per Constitution). Single workflow file modification with 3 distinct fixes that can be done in parallel since they're independent JSON edits.

**MVP Scope**: All 3 user stories - no phased delivery needed for this small fix.

---

## Dependencies

```
User Story 1 (P1) ─┬─► User Story 2 (P1) ─┬─► User Story 3 (P2)
                   │                       │
                   └───────────────────────┘
                   
All stories can be implemented in parallel (different fixes in same file)
```

**Parallel Execution**: T001, T002, T003 can run in parallel as they modify different sections of the workflow JSON.

---

## Phase 1: Setup

*No setup required - workflow file already exists.*

---

## Phase 2: Foundational

*No foundational tasks - no new dependencies or infrastructure.*

---

## Phase 3: User Story 1 - Targeted Cover Letter Generation (P1)

**Goal**: Workflow filters by `job_offers_id` from webhook request

**Independent Test**: Send webhook request with specific job ID, verify SQL query filters by that ID

### Tasks

- [x] T001 [P] [US1] Modify SQL query in workflow to filter by `$input.params.job_offers_id` parameter in `n8n-workflows/3.Job Application Writer.json`

---

## Phase 4: User Story 2 - Synchronous Response Handling (P1)

**Goal**: Webhook waits for full processing before returning response

**Independent Test**: Trigger webhook, verify response only received after cover letter saved to database

### Tasks

- [x] T002 [P] [US2] Set webhook node `responseMode: "lastNode"` in `n8n-workflows/3.Job Application Writer.json`

---

## Phase 5: User Story 3 - Clean Workflow Configuration (P2)

**Goal**: Remove unused nodes, no warnings in logs

**Independent Test**: Check execution logs for "Unused Respond to Webhook" warnings

### Tasks

- [x] T003 [P] [US3] Remove or reconnect "Respond to Webhook" node to eliminate unused node warning in `n8n-workflows/3.Job Application Writer.json`

---

## Phase 6: Validation & Deployment

### Tasks

- [x] T004 Validate workflow JSON syntax using `n8nac skills validate n8n-workflows/3.Job Application Writer.json` (Note: Pre-existing validation errors unrelated to this change)
- [x] T005 [P] Push workflow to n8n instance using `n8nac push 3.Job Application Writer` (Pushed via REST API, ID: toVyGHuM4IG3Bd49)
- [x] T006 Test webhook with specific job_offers_id to verify all three fixes work correctly (✅ Tested - job 328 cover letter generated and saved to database)
- [x] T007 Verify no "Unused Respond to Webhook" warning in execution logs (✅ Node removed - no warnings)

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | - | No setup needed |
| Phase 2 | - | No foundational tasks |
| Phase 3 (US1) | T001 | Fix SQL query filter |
| Phase 4 (US2) | T002 | Set responseMode to lastNode |
| Phase 5 (US3) | T003 | Remove unused node |
| Phase 6 | T004-T007 | Validate, deploy, test |
| **Total** | **7 tasks** | |

### Parallel Opportunities

- **T001, T002, T003**: Can run in parallel (different JSON sections)
- **T005, T006**: Can run in parallel (deployment independent of testing)

### Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`