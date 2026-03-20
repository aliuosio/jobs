# Tasks: Job Offers API Endpoint

**Feature**: 006-job-offers-api
**Branch**: `006-job-offers-api`
**Date**: 2026-03-20
**Status**: Ready for Implementation

## Overview

Implement a FastAPI GET endpoint `/job-offers` that retrieves job offers with processing metadata from PostgreSQL database "n8n".

## Task Summary

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| Phase 1: Setup | 2 | No |
| Phase 2: Foundational | 3 | Yes (2) |
| Phase 3: User Story 1 | 4 | Yes (1) |
| Phase 4: User Story 2 | 2 | Yes |
| Phase 5: User Story 3 | 2 | Yes (1) |
| Phase 6: Polish | 2 | Yes |
| **Total** | **15** | **6 parallelizable** |

---

## Phase 1: Setup

**Goal**: Initialize project dependencies and configuration for PostgreSQL connectivity.

**Independent Test**: Configuration loads without errors, asyncpg is importable.

### Tasks

- [X] T001 Add asyncpg dependency to Docker image or requirements - verify asyncpg is available in the api-backend container
- [X] T002 Add PostgreSQL configuration to src/config.py - add DATABASE_URL, DATABASE_POOL_SIZE, DATABASE_MAX_OVERFLOW settings

---

## Phase 2: Foundational

**Goal**: Create shared infrastructure (database service, response models) that all user stories depend on.

**Independent Test**: Database service can connect/close, response models validate correctly.

### Tasks

- [X] T003 [P] Create JobOfferProcess, JobOfferWithProcess, JobOffersListResponse Pydantic models in src/api/schemas.py
- [X] T004 [P] Create JobOffersService class with connect/close methods in src/services/job_offers.py
- [X] T005 Register JobOffersService in application lifespan - modify src/main.py to call connect/close

---

## Phase 3: User Story 1 - Retrieve Job Offers List (P1)

**Story**: As a developer, I want to retrieve a list of job offers with their basic information (id, title, url) and associated processing data.

**Goal**: Core endpoint returns all job offers with nested process data, ordered by id ascending.

**Independent Test**: `curl http://localhost:8000/job-offers` returns JSON with job_offers array containing id, title, url, process fields.

### Acceptance Criteria
1. GET /job-offers returns 200 with valid JSON
2. Each job offer includes id, title, url fields
3. Each job offer includes process object (or null if no process record)
4. Results ordered by id ascending
5. All records returned (no default limit)

### Tasks

- [X] T006 [P] [US1] Implement get_job_offers() method with LEFT JOIN query in src/services/job_offers.py
- [X] T007 [US1] Add GET /job-offers route handler in src/api/routes.py with JobOffersListResponse response model
- [X] T008 [US1] Implement row-to-nested-structure transformation in get_job_offers() - extract id, title, url, process from flat row
- [X] T009 [US1] Verify endpoint with manual curl test against running database

---

## Phase 4: User Story 2 - Filter and Pagination Support (P2)

**Story**: As a developer, I want to optionally filter and paginate job offers results.

**Goal**: Add optional limit and offset query parameters for pagination.

**Independent Test**: `curl "http://localhost:8000/job-offers?limit=10&offset=5"` returns 10 records starting from position 5.

### Acceptance Criteria
1. ?limit=N returns at most N records
2. ?offset=M skips first M records
3. Default behavior unchanged (no params = all records)

### Tasks

- [X] T010 [P] [US2] Add limit and offset query parameters to route handler in src/api/routes.py
- [X] T011 [US2] Modify get_job_offers() to accept and apply limit/offset in SQL query in src/services/job_offers.py

---

## Phase 5: User Story 3 - Error Handling for Database Issues (P3)

**Story**: As a developer, I want clear error responses when database issues occur.

**Goal**: Return appropriate HTTP status codes (503, 500) with descriptive error messages.

**Independent Test**: Simulate database failure and verify 503 response with error detail.

### Acceptance Criteria
1. Database connection failure returns 503 Service Unavailable
2. Query failure returns 500 Internal Server Error
3. All errors logged with appropriate context

### Tasks

- [X] T012 [P] [US3] Add PostgresError exception handling with 503 response in src/api/routes.py
- [X] T013 [US3] Add generic exception handler with 500 response and logging in src/api/routes.py

---

## Phase 6: Polish & Cross-Cutting

**Goal**: Final verification and cleanup.

**Independent Test**: All manual tests pass, code follows project patterns.

### Tasks

- [X] T014 [P] Verify all endpoint responses match spec (field names, ordering, null handling)
- [X] T015 Run full manual test suite: empty database, populated database, database unavailable

---

## Dependencies

```text
Phase 1 (Setup)
    └── T001 ──→ T002
                  │
                  ▼
Phase 2 (Foundational)
    └── T003 ──┬────────┐
         T004 ──┤        │
              │        │
              ▼        ▼
           T005 ──→ Phase 3
                      │
                      ▼
Phase 3 (US1 - Core Endpoint) [BLOCKS Phase 4 & 5]
    └── T006 ──→ T008 ──→ T007 ──→ T009
                      │
                      ▼
Phase 4 (US2 - Pagination)
    └── T010 ──→ T011
              │
              ▼
Phase 5 (US3 - Error Handling)
    └── T012
    └── T013
              │
              ▼
Phase 6 (Polish)
    └── T014
    └── T015
```

---

## Parallel Execution

### Phase 2 Parallel Group
```bash
# Run simultaneously
T003  # Create Pydantic models
T004  # Create database service class
```

### Phase 3 Parallel Group
```bash
# T006 can start after T003 and T004 complete
T006  # Implement database query method
```

### Phase 4 Parallel Group
```bash
# Run simultaneously (after Phase 3 complete)
T010  # Add query parameters
T011  # Modify database query
```

### Phase 5 Parallel Group
```bash
# Run simultaneously (after Phase 3 complete)
T012  # Add 503 error handling
T013  # Add 500 error handling
```

### Phase 6 Parallel Group
```bash
# Run simultaneously
T014  # Verify responses
T015  # Full manual test
```

---

## MVP Scope

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (User Story 1)

This delivers:
- Working GET /job-offers endpoint
- All job offers with process data
- Ordered by id ascending
- No pagination, basic error handling

**Estimated effort**: 9 tasks

---

## Implementation Strategy

1. **MVP First** (Phases 1-3): Deploy core endpoint immediately
2. **Incremental Enhancement** (Phase 4): Add pagination when datasets grow
3. **Production Hardening** (Phase 5): Add robust error handling before production use
4. **Final Polish** (Phase 6): Verify all acceptance criteria

---

## Files Summary

| File | Action | Tasks |
|------|--------|-------|
| `src/config.py` | Modified | T002 |
| `src/api/schemas.py` | Modified | T003 |
| `src/services/job_offers.py` | Created | T004, T006, T008, T011 |
| `src/main.py` | Modified | T005 |
| `src/api/routes.py` | Modified | T007, T010, T012, T013 |
| `Dockerfile` (or deps) | Modified | T001 |

---

## Verification Commands

```bash
# After Phase 3 (MVP)
curl http://localhost:8000/job-offers | jq '.job_offers | length'

# After Phase 4 (Pagination)
curl "http://localhost:8000/job-offers?limit=5&offset=2" | jq '.job_offers | length'

# After Phase 5 (Error Handling)
# Simulate DB failure by stopping postgres container
docker-compose stop postgres
curl http://localhost:8000/job-offers
# Should return 503 with {"detail": "Database temporarily unavailable"}
```
