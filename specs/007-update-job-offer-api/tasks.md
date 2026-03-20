# Implementation Tasks: Update Job Offer Process API

**Feature**: `007-update-job-offer-api`  
**Generated**: 2026-03-20  
**Spec**: [spec.md](./spec.md)  
**Plan**: [plan.md](./plan.md)

## Summary

Add a PATCH endpoint `/job-offers/{id}/process` to update job offer processing metadata. Implementation follows existing codebase patterns (FastAPI, asyncpg, Pydantic).

## Implementation Phases

---

## Phase 1: Foundational Tasks

### Goal
Create the schema and service method that will be used by all user stories.

### Independent Test Criteria
No independent tests at this phase (foundational only).

### Tasks

- [ ] T001 Add ProcessUpdateRequest schema in src/api/schemas.py
- [ ] T002 Add update_job_offer_process method in src/services/job_offers.py

---

## Phase 2: User Story 1 - Update Job Offer Process Status

**Story Goal**: Core PATCH endpoint with upsert behavior (create or update process record)

**Independent Test Criteria**: Can be tested by sending PATCH request with process fields and verifying updated values are persisted.

**Acceptance Tests**:
1. Update existing process record → returns updated data
2. Create new process record when none exists → returns created data
3. Non-existent job offer → returns 404

### Tasks

- [ ] T003 [US1] Add PATCH /job-offers/{id}/process endpoint in src/api/routes.py
- [ ] T004 [US1] Test update existing process record in tests/integration/test_job_offers_update.py
- [ ] T005 [US1] Test create new process record in tests/integration/test_job_offers_update.py
- [ ] T006 [US1] Test 404 for non-existent job offer in tests/integration/test_job_offers_update.py

---

## Phase 3: User Story 2 - Partial Process Update

**Story Goal**: Update only specific fields without affecting others

**Independent Test Criteria**: Can be tested by updating one field and verifying other fields remain unchanged.

**Acceptance Tests**:
1. Partial update preserves other fields
2. Empty payload returns current state (no-op)

### Tasks

- [ ] T007 [US2] Test partial update preserves existing fields in tests/integration/test_job_offers_update.py
- [ ] T008 [US2] Test empty payload (no-op) in tests/integration/test_job_offers_update.py

---

## Phase 4: User Story 3 - Batch Status Retrieval

**Story Goal**: Response includes full job offer with process data

**Independent Test Criteria**: Can be tested by verifying response contains complete job offer record.

**Acceptance Tests**:
1. Response includes job offer title and URL
2. Response includes all process fields

### Tasks

- [ ] T009 [US3] Test response includes complete job offer data in tests/integration/test_job_offers_update.py

---

## Phase 5: Polish & Validation

### Tasks

- [ ] T010 Run full test suite to verify all functionality
- [ ] T011 Validate endpoint against API contract in contracts/patch-job-offer-process.md

---

## Files to Modify

| File | Tasks |
|------|-------|
| `src/api/schemas.py` | T001 |
| `src/services/job_offers.py` | T002 |
| `src/api/routes.py` | T003 |

## Files to Create

| File | Tasks |
|------|-------|
| `tests/integration/test_job_offers_update.py` | T004, T005, T006, T007, T008, T009 |

## Dependency Graph

```
Phase 1 (T001, T002)
       ↓
Phase 2 (T003, T004, T005, T006) ── US1 Complete
       ↓
Phase 3 (T007, T008) ── US2 Complete
       ↓
Phase 4 (T009) ── US3 Complete
       ↓
Phase 5 (T010, T011) ── Polish
```

## Parallel Opportunities

| Phase | Parallel Tasks |
|-------|---------------|
| Phase 2 | T004, T005, T006 can run in parallel (different test scenarios) |
| Phase 3 | T007, T008 can run in parallel (different edge cases) |

---

## Task Details

### T001: Add ProcessUpdateRequest schema
**File**: `src/api/schemas.py`
**Pattern**: Follow existing schema patterns (see research.md)
```python
class ProcessUpdateRequest(BaseModel):
    research: bool | None = Field(default=None, description="...")
    research_email: bool | None = Field(default=None, description="...")
    applied: bool | None = Field(default=None, description="...")
```

### T002: Add update_job_offer_process method
**File**: `src/services/job_offers.py`
**Pattern**: Follow existing JobOffersService patterns (see research.md)
**Method**: `async def update_job_offer_process(job_offer_id: int, **fields) -> dict`
**SQL**: Use INSERT ... ON CONFLICT DO UPDATE with COALESCE for partial updates

### T003: Add PATCH endpoint
**File**: `src/api/routes.py`
**Pattern**: Follow existing endpoint patterns (see research.md)
**Endpoint**: `PATCH /job-offers/{id}/process`
**Response**: `JobOfferWithProcess`

### T004-T009: Integration tests
**File**: `tests/integration/test_job_offers_update.py`
**Pattern**: Follow existing test patterns (see tests/integration/test_api.py)
**Fixtures**: Reuse `client` fixture from conftest.py

---

## MVP Scope

**User Story 1 only** (T001-T006) is sufficient for MVP:
- Core PATCH endpoint
- Upsert behavior
- Basic tests

User Stories 2 and 3 are already satisfied by the core implementation (partial updates are handled by COALESCE SQL, response includes full record).

---

## Verification Checklist

- [ ] ProcessUpdateRequest schema added to schemas.py
- [ ] update_job_offer_process method added to job_offers.py
- [ ] PATCH endpoint added to routes.py
- [ ] All integration tests pass
- [ ] Response matches JobOfferWithProcess schema
- [ ] 404 returned for non-existent job offer
- [ ] 400 returned for invalid ID format
- [ ] Partial updates work correctly
