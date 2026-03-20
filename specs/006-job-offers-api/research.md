# Research: Job Offers API Endpoint

**Feature**: 006-job-offers-api
**Date**: 2026-03-20

## Research Questions

### Q1: Database Driver Choice

**Decision**: asyncpg (direct)

**Rationale**:
- Existing codebase uses direct async clients (AsyncQdrantClient, AsyncOpenAI) without ORM
- asyncpg provides the best performance for read-heavy queries
- No existing SQLAlchemy setup in the project
- Simpler than adding SQLAlchemy dependency

**Alternatives Considered**:
- SQLAlchemy 2.0 (AsyncSession): More abstraction, adds complexity
- asyncpg directly: Chosen - matches existing patterns, minimal overhead
- psycopg3 async: Slower than asyncpg for read operations

### Q2: Connection Pooling Pattern

**Decision**: Use asyncpg.create_pool() with singleton service pattern

**Rationale**:
- Matches existing `RetrieverService` pattern with connect/close lifecycle
- Pool managed in `src/main.py` lifespan context
- Environment variables from `src/config.py` for connection settings

**Implementation Pattern** (from existing codebase):
```python
# src/services/retriever.py pattern
class RetrieverService:
    def __init__(self) -> None:
        self._client: AsyncQdrantClient | None = None

    async def connect(self) -> None:
        self._client = AsyncQdrantClient(...)

    async def close(self) -> None:
        if self._client:
            await self._client.close()

retriever = RetrieverService()  # Singleton
```

### Q3: Configuration Pattern

**Decision**: Extend `src/config.py` with PostgreSQL settings

**Rationale**:
- Follows existing pattern for QDRANT_URL, MISTRAL_API_KEY
- pydantic-settings handles .env loading automatically
- Consistent with how other services configure themselves

**Implementation**:
```python
# Add to src/config.py
class Settings(BaseSettings):
    # ... existing ...
    
    # PostgreSQL Configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/n8n"
    DATABASE_POOL_MIN: int = 1
    DATABASE_POOL_MAX: int = 10
```

### Q4: Query Pattern for LEFT JOIN

**Decision**: Use parameterized query with asyncpg.fetch()

**Rationale**:
- No user input parameters for this endpoint (read-only, no filtering)
- asyncpg.fetch() returns Record objects that convert to dict
- LEFT JOIN ensures job offers without process records are included

**Implementation**:
```python
async def get_job_offers(self) -> list[dict[str, Any]]:
    async with self._pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT 
                jo.id,
                jo.title,
                jo.url,
                jop.*
            FROM job_offers jo
            LEFT JOIN job_offers_process jop ON jo.id = jop.job_offer_id
            ORDER BY jo.id ASC
        """)
    return [dict(row) for row in rows]
```

### Q5: Error Handling Pattern

**Decision**: Catch asyncpg.PostgresError for 503, generic Exception for 500

**Rationale**:
- Matches existing error handling in `/fill-form` endpoint
- PostgresError indicates database connectivity issues (503 appropriate)
- Generic catch-all for unexpected errors (500)

**Implementation** (from existing routes.py pattern):
```python
from asyncpg import PostgresError

try:
    offers = await job_offers_service.get_job_offers()
    return JobOffersListResponse(job_offers=[...])
except PostgresError as e:
    logger.error(f"[job-offers] database_error: {e}")
    raise HTTPException(status_code=503, detail="Database temporarily unavailable")
except Exception as e:
    logger.error(f"[job-offers] unexpected_error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Q6: Response Transformation

**Decision**: Transform flat query results to nested structure in service layer

**Rationale**:
- SQL LEFT JOIN returns flat rows with NULL values for missing process data
- Transformation to nested structure happens after fetch
- Keeps SQL simple and transformation logic testable

**Implementation**:
```python
def _transform_row_to_nested(row: dict) -> dict:
    """Transform flat JOIN result to nested structure."""
    job_offer = {
        "id": row["id"],
        "title": row["title"],
        "url": row["url"],
        "process": None
    }
    
    # Check if process data exists (job_offer_id will be non-null)
    if row.get("job_offer_id") is not None:
        # Extract process columns (everything except id, title, url)
        process_data = {k: v for k, v in row.items() 
                       if k not in ("id", "title", "url")}
        job_offer["process"] = process_data
    
    return job_offer
```

## Existing Codebase Patterns (from exploration)

### Service Singleton Pattern
- Location: `src/services/retriever.py`, `src/services/embedder.py`
- Pattern: Class with connect/close methods, module-level singleton instance
- Usage: Import singleton in routes, call async methods

### Configuration Pattern
- Location: `src/config.py`
- Pattern: pydantic-settings BaseSettings with env_file support
- Usage: Import `settings` object, access attributes

### Lifespan Management
- Location: `src/main.py`
- Pattern: `@asynccontextmanager` with yield, connect services before yield
- Usage: Add new service connect/close calls

### Response Models
- Location: `src/api/schemas.py`
- Pattern: Pydantic BaseModel with Field validators
- Usage: Define new response models for endpoint

### Error Handling
- Location: `src/api/routes.py`
- Pattern: Try/except with HTTPException, logger.error with context
- Usage: Wrap service calls, return appropriate status codes

## Dependencies to Add

None required - asyncpg is likely already available in the Docker image `osioaliu/job-api-backend:latest`.

If not, add to Docker image:
```
asyncpg>=0.29.0
```

## Outstanding Research Items

- [ ] Full schema of `job_offers_process` table (discover at runtime)
- [ ] Confirm asyncpg is available in Docker image
