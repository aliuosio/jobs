# Research: Update Job Offer Process API

**Feature**: `007-update-job-offer-api`  
**Date**: 2026-03-20

## Research Summary

No additional external research required. Implementation follows established codebase patterns.

## Pattern Analysis

### 1. Existing Endpoint Pattern

From `GET /job-offers` in `src/api/routes.py`:

```python
@router.get(
    "/job-offers",
    response_model=JobOffersListResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Database unavailable"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    tags=["job-offers"],
)
async def get_job_offers(
    limit: int | None = None, offset: int | None = None
) -> JobOffersListResponse:
    """Retrieve job offers with processing metadata."""
    from asyncpg import PostgresError
    from src.services.job_offers import job_offers_service

    try:
        offers = await job_offers_service.get_job_offers(limit=limit, offset=offset)
        return JobOffersListResponse(
            job_offers=[JobOfferWithProcess(**o) for o in offers]
        )
    except PostgresError as e:
        logger.error(f"[job-offers] database_error: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
    except Exception as e:
        logger.error(f"[job-offers] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
```

**Key Observations**:
- Lazy import of `asyncpg` and service inside function
- Typed exception handling for `PostgresError`
- Generic exception catch with `exc_info=True` for logging
- Uses `HTTPException` from FastAPI
- Structured error responses via `ErrorResponse` model

### 2. Existing Schema Pattern

From `src/api/schemas.py`:

```python
class JobOfferProcess(BaseModel):
    model_config = {"extra": "allow"}
    job_offers_id: int | None = None
    research: bool | None = None
    research_email: bool | None = None
    applied: bool | None = None
```

**Key Observations**:
- `extra = "allow"` for flexibility
- Optional fields with `None` defaults
- `Field()` descriptions for API docs

### 3. Database Pattern

From `src/services/job_offers.py`:

```python
async def get_job_offers(
    self, limit: int | None = None, offset: int | None = None
) -> list[dict[str, Any]]:
    if not self._pool:
        raise RuntimeError("Database pool not initialized")

    query = """
        SELECT
            jo.id,
            jo.title,
            jo.url,
            jop.id as process_id,
            jop.job_offers_id,
            jop.research,
            jop.research_email,
            jop.applied
        FROM job_offers jo
        LEFT JOIN job_offers_process jop ON jo.id = jop.job_offers_id
        ORDER BY jo.id ASC
    """

    async with self._pool.acquire() as conn:
        rows = await conn.fetch(query)

    # Process rows into nested structure
    ...
```

**Key Observations**:
- Check for pool initialization
- Parameterized queries with f-strings for LIMIT/OFFSET (acceptable here since values are validated integers)
- Use `conn.fetch()` for SELECT queries
- Return list of dictionaries

## Design Decisions

### Decision 1: Upsert Strategy

**Chosen**: INSERT with ON CONFLICT DO UPDATE

**Rationale**: Single atomic operation that handles both create and update cases. Avoids race conditions from check-then-insert patterns.

**Alternative Rejected**: Check existence, then INSERT or UPDATE separately
- More complex logic
- Potential race condition between check and insert

### Decision 2: Partial Update with COALESCE

**Chosen**: Use SQL `COALESCE(field, $value, field)` pattern

**Rationale**: Allows partial updates where only provided fields are modified. Fields with `None` in request preserve existing values.

**Alternative Rejected**: Build dynamic query
- More error-prone
- Harder to maintain

## Dependencies

- **FastAPI**: Already used for existing endpoints
- **asyncpg**: Already used for database operations
- **Pydantic**: Already used for schema validation

No new external dependencies required.
