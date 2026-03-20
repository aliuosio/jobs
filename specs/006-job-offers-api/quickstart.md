# Quickstart: Job Offers API Implementation

**Feature**: 006-job-offers-api
**Date**: 2026-03-20

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database "n8n" running with `job_offers` and `job_offers_process` tables
- Python 3.11+ (if running locally)

## Quick Implementation Guide

### Step 1: Add Database Configuration

Add to `src/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # PostgreSQL Configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/n8n"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
```

### Step 2: Create Database Service

Create `src/services/job_offers.py`:

```python
"""Database service for job offers data retrieval."""

import logging
from typing import Any

import asyncpg

from src.config import settings

logger = logging.getLogger(__name__)


class JobOffersService:
    """Async PostgreSQL service for job offers data."""

    def __init__(self) -> None:
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Initialize database connection pool."""
        self._pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=1,
            max_size=settings.DATABASE_POOL_SIZE,
        )
        logger.info("Connected to PostgreSQL database 'n8n'")

    async def close(self) -> None:
        """Close database connection pool."""
        if self._pool:
            await self._pool.close()
            logger.info("Closed PostgreSQL connection pool")

    async def get_job_offers(self) -> list[dict[str, Any]]:
        """Retrieve all job offers with process data.
        
        Returns:
            List of job offer dictionaries with nested process data.
        
        Raises:
            asyncpg.PostgresError: Database query failure.
        """
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

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

        # Transform flat rows into nested structure
        result = []
        for row in rows:
            row_dict = dict(row)
            job_offer = {
                "id": row_dict.pop("id"),
                "title": row_dict.pop("title"),
                "url": row_dict.pop("url"),
                "process": row_dict if row_dict.get("job_offer_id") else None,
            }
            result.append(job_offer)

        logger.info(f"Retrieved {len(result)} job offers")
        return result


# Singleton instance
job_offers_service = JobOffersService()
```

### Step 3: Add Response Schemas

Add to `src/api/schemas.py`:

```python
from typing import Any


class JobOfferProcess(BaseModel):
    """Processing metadata for a job offer."""
    model_config = {"extra": "allow"}
    job_offer_id: int | None = None


class JobOfferWithProcess(BaseModel):
    """Combined job offer with process metadata."""
    id: int
    title: str
    url: str
    process: JobOfferProcess | None = None


class JobOffersListResponse(BaseModel):
    """Response for job offers list endpoint."""
    job_offers: list[JobOfferWithProcess]
```

### Step 4: Add Route Handler

Add to `src/api/routes.py`:

```python
from src.api.schemas import JobOffersListResponse
from src.services.job_offers import job_offers_service


@router.get(
    "/job-offers",
    response_model=JobOffersListResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Database unavailable"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    tags=["job-offers"],
)
async def get_job_offers() -> JobOffersListResponse:
    """Retrieve all job offers with processing metadata."""
    from asyncpg import PostgresError

    try:
        offers = await job_offers_service.get_job_offers()
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

### Step 5: Update Application Lifespan

Modify `src/main.py`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    from src.services.retriever import retriever
    from src.services.job_offers import job_offers_service  # NEW

    logger.info("Starting RAG Backend API...")

    await retriever.connect()
    logger.info("Connected to Qdrant")

    await job_offers_service.connect()  # NEW
    logger.info("Connected to PostgreSQL")

    yield

    await job_offers_service.close()  # NEW
    await retriever.close()
    logger.info("Shutting down RAG Backend API...")
```

### Step 6: Test the Endpoint

```bash
# Start the API
docker-compose up api-backend

# Test the endpoint
curl http://localhost:8000/job-offers | jq

# Expected response:
# {
#   "job_offers": [
#     {
#       "id": 1,
#       "title": "Senior Developer",
#       "url": "https://...",
#       "process": { ... }
#     }
#   ]
# }
```

## Files Modified/Created

| Action | File |
|--------|------|
| Modified | `src/config.py` |
| Modified | `src/api/schemas.py` |
| Modified | `src/api/routes.py` |
| Modified | `src/main.py` |
| Created | `src/services/job_offers.py` |
| Created | `tests/integration/test_job_offers.py` |

## Verification Checklist

- [ ] `GET /job-offers` returns 200 status
- [ ] Response contains `job_offers` array
- [ ] Each offer has `id`, `title`, `url`, `process` fields
- [ ] Offers without process data have `process: null`
- [ ] Results ordered by `id` ascending
- [ ] Database errors return 503 status
