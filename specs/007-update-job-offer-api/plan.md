# Implementation Plan: Update Job Offer Process API

**Branch**: `007-update-job-offer-api` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-update-job-offer-api/spec.md`

## Summary

Add a PATCH endpoint `/job-offers/{id}/process` to update job offer processing metadata. The endpoint supports upsert behavior (create if process record doesn't exist), partial updates, and returns the full updated job offer with process data.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, asyncpg, Pydantic  
**Storage**: PostgreSQL (existing `job_offers` and `job_offers_process` tables)  
**Testing**: pytest  
**Target Platform**: Linux server (Docker)  
**Project Type**: Web service (REST API)  
**Performance Goals**: <500ms response time (SC-001)  
**Constraints**: Uses existing asyncpg connection pool; must follow existing API patterns  
**Scale/Scope**: Single endpoint addition; existing database schema

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID Design | ✅ PASS | Single responsibility for update logic in service |
| II. DRY | ✅ PASS | Reuses existing `JobOffersService` with new method |
| III. YAGNI | ✅ PASS | Only implementing what's specified |
| IV. KISS | ✅ PASS | Straightforward PATCH with upsert |
| V. Type Safety | ✅ PASS | Pydantic schemas for validation |
| VI. Composition Over Inheritance | ✅ PASS | Service composition pattern |
| VII. Git-Flow | ✅ PASS | Feature branch per spec |

## Project Structure

### Documentation (this feature)

```text
specs/007-update-job-offer-api/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - patterns established)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── routes.py        # Add PATCH /job-offers/{id}/process endpoint
│   └── schemas.py      # Add ProcessUpdateRequest schema
├── services/
│   └── job_offers.py    # Add update_job_offer_process() method
└── main.py              # No changes needed (router already included)

tests/
├── integration/
│   └── test_job_offers_update.py   # New integration tests
└── unit/
    └── test_job_offers_service.py   # Unit tests for service method
```

**Structure Decision**: Extends existing `src/api/` and `src/services/` directories following established patterns.

## Complexity Tracking

No violations. Implementation follows existing patterns without complexity justification needed.

## Phase 0: Research

### Research Summary

No additional research required. The codebase already has:
- Established patterns for REST endpoints in `routes.py`
- Existing `JobOffersService` with asyncpg pool usage
- Pydantic schema patterns in `schemas.py`
- Error handling conventions (HTTPException with proper status codes)

### Existing Patterns to Follow

1. **Endpoint Pattern** (from `get_job_offers`):
   - Use `async def` with `Request` parameter
   - Import service inside function (lazy loading)
   - Return `JobOfferWithProcess` response model
   - Proper error handling with `HTTPException`

2. **Schema Pattern** (from `JobOfferProcess`):
   - Use `BaseModel` with `model_config = {"extra": "allow"}`
   - Boolean fields with `None` defaults
   - `Field()` with descriptions

3. **Database Pattern** (from `get_job_offers`):
   - Use parameterized queries with asyncpg
   - Acquire connection from pool
   - Return typed dictionaries

## Phase 1: Design & Contracts

### Data Model

```python
# New: ProcessUpdateRequest (in schemas.py)
class ProcessUpdateRequest(BaseModel):
    research: bool | None = None
    research_email: bool | None = None
    applied: bool | None = None

# Existing: JobOfferProcess (schemas.py)
class JobOfferProcess(BaseModel):
    model_config = {"extra": "allow"}
    job_offers_id: int | None = None
    research: bool | None = None
    research_email: bool | None = None
    applied: bool | None = None

# Existing: JobOfferWithProcess (schemas.py)
class JobOfferWithProcess(BaseModel):
    id: int
    title: str
    url: str
    process: JobOfferProcess | None
```

### Database Operations

```sql
-- Check if job offer exists
SELECT id FROM job_offers WHERE id = $1

-- Check if process record exists
SELECT id FROM job_offers_process WHERE job_offers_id = $1

-- Update existing process
UPDATE job_offers_process 
SET research = COALESCE($2, research),
    research_email = COALESCE($3, research_email),
    applied = COALESCE($4, applied)
WHERE job_offers_id = $1
RETURNING *

-- Insert new process (if not exists)
INSERT INTO job_offers_process (job_offers_id, research, research_email, applied)
VALUES ($1, COALESCE($2, false), COALESCE($3, false), COALESCE($4, false))
RETURNING *
```

### Interface Contract

**Endpoint**: `PATCH /job-offers/{id}/process`

**Request**:
```json
{
  "research": true,        // optional
  "research_email": false,  // optional
  "applied": true          // optional
}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "title": "Software Engineer",
  "url": "https://example.com/job/123",
  "process": {
    "job_offers_id": 123,
    "research": true,
    "research_email": false,
    "applied": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid job offer ID format
- `404 Not Found`: Job offer ID does not exist
- `500 Internal Server Error`: Database error

## Phase 2: Implementation Tasks

### Task Breakdown

1. **Add ProcessUpdateRequest schema** (`src/api/schemas.py`)
2. **Add update method to JobOffersService** (`src/services/job_offers.py`)
3. **Add PATCH endpoint** (`src/api/routes.py`)
4. **Add integration tests** (`tests/integration/`)
5. **Add unit tests** (`tests/unit/`)

### Files to Modify

| File | Changes |
|------|---------|
| `src/api/schemas.py` | Add `ProcessUpdateRequest` class |
| `src/services/job_offers.py` | Add `update_job_offer_process()` async method |
| `src/api/routes.py` | Add `update_job_offer_process` endpoint |
| `tests/integration/test_job_offers_update.py` | New file - integration tests |
| `tests/unit/test_job_offers_service.py` | New file - unit tests |

### Files to Create

| File | Purpose |
|------|---------|
| `specs/007-update-job-offer-api/research.md` | Phase 0 research artifact |
| `specs/007-update-job-offer-api/data-model.md` | Data model documentation |
| `specs/007-update-job-offer-api/quickstart.md` | Quick test guide |
| `specs/007-update-job-offer-api/contracts/` | API contract documentation |
