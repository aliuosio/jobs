# Implementation Plan: Job Offers API Endpoint

**Branch**: `006-job-offers-api` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Status**: Draft

## Summary

Create a FastAPI GET endpoint `/job-offers` that retrieves job offers (id, title, url) from PostgreSQL database "n8n" table `job_offers`, joined with `job_offers_process` table to include all processing metadata. Returns nested JSON structure with all records ordered by id ascending.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, asyncpg (PostgreSQL async driver), Pydantic
**Storage**: PostgreSQL 18 (existing docker-compose service `postgres`)
**Testing**: pytest (existing test structure in `tests/`)
**Target Platform**: Linux server (Docker container `api-backend`)
**Project Type**: web-service (REST API)
**Performance Goals**: <500ms response time for up to 1000 records
**Constraints**: Read-only endpoint, async database access required
**Scale/Scope**: Single endpoint, 2-table JOIN, no pagination by default

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID Design | ✅ PASS | Single responsibility: database service + route handler |
| II. DRY | ✅ PASS | Reuse existing config patterns from src/config.py |
| III. YAGNI | ✅ PASS | Only GET endpoint, no write operations |
| IV. KISS | ✅ PASS | Direct asyncpg queries, no ORM overhead |
| V. Type Safety | ✅ PASS | Pydantic models for request/response |
| VI. Composition | ✅ PASS | Database service composed into route |
| VII. Git-Flow | ✅ PASS | Feature spec already in specs/006-job-offers-api |

## Project Structure

### Documentation (this feature)

```text
specs/006-job-offers-api/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 research findings
├── data-model.md        # Data model documentation
├── quickstart.md        # Implementation guide
└── checklists/
    └── requirements.md  # Requirements checklist
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── routes.py        # MODIFIED - Add /job-offers endpoint
│   └── schemas.py       # MODIFIED - Add JobOffer response models
├── services/
│   └── job_offers.py    # NEW - Database service for job offers
├── config.py            # MODIFIED - Add PostgreSQL settings
└── main.py              # MODIFIED - Add lifespan for DB pool

tests/
├── integration/
│   └── test_job_offers.py  # NEW - Integration tests
└── unit/
    └── test_job_offers_service.py  # NEW - Unit tests
```

**Structure Decision**: Single FastAPI backend service extending existing `src/api/routes.py` pattern. Database service in `src/services/job_offers.py` follows existing service pattern (see `retriever.py`, `embedder.py`).

## Implementation Details

### New Files

| File | Purpose |
|------|---------|
| `src/services/job_offers.py` | Async database service with connection pooling |
| `tests/integration/test_job_offers.py` | Integration tests for endpoint |
| `tests/unit/test_job_offers_service.py` | Unit tests for service layer |

### Modified Files

| File | Changes |
|------|---------|
| `src/config.py` | Add PostgreSQL connection settings (DATABASE_URL, DB_POOL_SIZE) |
| `src/api/schemas.py` | Add JobOfferResponse, JobOfferProcessResponse, JobOfferWithProcess models |
| `src/api/routes.py` | Add GET /job-offers endpoint |
| `src/main.py` | Add database pool to lifespan context manager |

### Database Query

```sql
SELECT 
    jo.id, jo.title, jo.url,
    jop.*  -- All columns from job_offers_process
FROM job_offers jo
LEFT JOIN job_offers_process jop ON jo.id = jop.job_offer_id
ORDER BY jo.id ASC
```

### Response Schema

```json
{
  "job_offers": [
    {
      "id": 1,
      "title": "Senior Python Developer",
      "url": "https://example.com/job/1",
      "process": {
        "job_offer_id": 1,
        "status": "processed",
        "...": "other columns"
      }
    }
  ]
}
```

## Testing

### Integration Tests

| Test | Description |
|------|-------------|
| T001 | GET /job-offers returns 200 with valid JSON |
| T002 | Response contains expected fields (id, title, url, process) |
| T003 | LEFT JOIN behavior: job without process returns null process |
| T004 | Empty tables return empty array |
| T005 | Results ordered by id ascending |

### Unit Tests

| Test | Description |
|------|-------------|
| T101 | Database service returns parsed rows |
| T102 | Connection error raises appropriate exception |
| T103 | Query timeout handling |

## Verification

- [ ] All integration tests pass
- [ ] All unit tests pass
- [ ] LSP diagnostics clean
- [ ] Manual test with curl against local database
- [ ] Response time <500ms for 1000 records

## Completion Status

| Phase | Status |
|-------|--------|
| Phase 0: Research | ✅ Complete |
| Phase 1: Design | ✅ Complete |
| Phase 2: Implementation | ⏳ Pending |
| Phase 3: Testing | ⏳ Pending |
