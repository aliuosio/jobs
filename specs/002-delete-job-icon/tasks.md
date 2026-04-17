---
description: "Task list for Delete Job Icon feature implementation"
---

# Tasks: Delete Job Icon

**Input**: Design documents from `/specs/002-delete-job-icon/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: TDD approach requested per spec.md - write tests first, ensure they FAIL before implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup needed - existing project structure ready

> SKIP: No additional setup tasks required

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

> SKIP: No foundational blocking tasks - existing infrastructure supports feature

---

## Phase 3: User Story 1 - Delete Individual Job Offer (Priority: P1) 🎯 MVP

**Goal**: Users can delete a job offer with a single click, and it gets removed from both UI and database

**Independent Test**: Open extension popup, click delete icon, verify job removed from list and database

### Tests for User Story 1 (TDD - Write FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T001 [P] [US1] Unit test for DELETE /job-offers/{id} endpoint returns 204 in tests/unit/test_routes.py
- [ ] T002 [P] [US1] Unit test for job_offers_service.delete_job_offer method in tests/unit/test_job_offers.py
- [ ] T003 [P] [US1] Integration test for delete button click in extension/tests/test_popup.py

### Implementation for User Story 1

Backend (DELETE endpoint):

- [ ] T004 [US1] Add delete_job_offer method in src/services/job_offers.py
- [ ] T005 [US1] Add DELETE /job-offers/{job_offer_id} endpoint in src/api/routes.py

Frontend (delete button):

- [ ] T006 [P] [US1] Add delete button CSS in extension/popup/popup.css
- [ ] T007 [P] [US1] Add delete button rendering in extension/popup/popup.js
- [ ] T008 [US1] Add delete API call and error handling in extension/popup/popup.js
- [ ] T009 [US1] Integrate delete with job list refresh after success

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Wider Extension Popup (Priority: P2)

**Goal**: Extension popup width increased by 20% to reduce text truncation

**Independent Test**: Open extension popup, measure width is approximately 576px

### Tests for User Story 2 (Optional - inline with implementation) ⚠️

> **NOTE: Width is a simple CSS change - optional test**

- [ ] T010 [P] [US2] Verify popup width is 576px in extension/tests/test_popup.py

### Implementation for User Story 2

- [ ] T011 [P] [US2] Update popup width from 480px to 576px in extension/popup/popup.css

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T012 [P] Run lsp_diagnostics on all modified files
- [ ] T013 Verify existing tests still pass
- [ ] T014 Validate quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: No blocking tasks - can proceed directly to user stories
- **User Stories (Phase 3+)**: Both depend on existing infrastructure
  - US1 and US2 are independent of each other
  - Can proceed in parallel or sequentially

### Within Each User Story

- Tests (T001-T003) MUST be written and FAIL before implementation
- Models already exist - services before endpoints
- Core implementation before integration
- User Story 1 (T004-T009) complete before validation

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different test files)
- T004 and T006, T007 can run in parallel (backend vs frontend)
- T006 and T007 can run in parallel (CSS vs JS rendering)
- US1 and US2 can run in parallel after tests are written

---

## Parallel Example: Full Implementation

```bash
# Phase 3-4: Write all tests first (all in parallel)
Task: "Unit test for DELETE endpoint in tests/unit/test_routes.py"
Task: "Unit test for job_offers_service.delete_job_offer in tests/unit/test_job_offers.py"  
Task: "Integration test for delete button in tests/extension/test_popup.py"

# Phase 3: Implement User Story 1 (backend in parallel, then frontend)
Task: "Add delete_job_offer method in src/services/job_offers.py"
Task: "Add DELETE endpoint in src/api/routes.py"

# Phase 4: Implement User Story 2
Task: "Update popup width in extension/popup/popup.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Write tests (T001-T003) - ensure they FAIL
2. Implement backend delete (T004-T005)
3. Implement frontend button (T006-T009)
4. **STOP and VALIDATE**: Test delete functionality
5. Deploy/demo if ready

### Incremental Delivery

1. Write tests → they FAIL
2. Add delete method + endpoint (T004-T005)
3. Add delete button + API call (T006-T009)
4. Test independently → Deploy/Demo (MVP!)
5. Add wider popup (T010-T011)
6. Test independently → Deploy/Demo

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 is MVP - can ship after Phase 3 is complete