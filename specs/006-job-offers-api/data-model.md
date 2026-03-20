# Data Model: Job Offers API

**Feature**: 006-job-offers-api
**Date**: 2026-03-20

## Entity Relationship Diagram

```
┌─────────────────┐          ┌─────────────────────────┐
│   job_offers    │          │  job_offers_process     │
├─────────────────┤          ├─────────────────────────┤
│ id (PK)         │──1:1────▶│ job_offer_id (FK)       │
│ title           │          │ [other columns...]      │
│ url             │          │                         │
└─────────────────┘          └─────────────────────────┘
```

**Relationship**: One-to-one (LEFT JOIN)
- Each `job_offers` record has at most ONE `job_offers_process` record
- Process record may not exist (hence LEFT JOIN)
- Join key: `job_offers.id = job_offers_process.job_offer_id`

## Source Tables

### job_offers (source table)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Primary key, auto-increment |
| `title` | VARCHAR | Job posting title |
| `url` | VARCHAR | URL to job posting |

### job_offers_process (source table)

| Column | Type | Description |
|--------|------|-------------|
| `job_offer_id` | INTEGER (FK) | Foreign key to `job_offers.id` |
| `[other columns]` | TBD | All columns from table (schema discovered at runtime) |

**Note**: Full schema for `job_offers_process` will be discovered from database during implementation.

## Response Models

### JobOfferProcess (Pydantic)

```python
from pydantic import BaseModel
from typing import Optional, Any

class JobOfferProcess(BaseModel):
    """Processing metadata for a job offer. Schema discovered from database."""
    job_offer_id: int
    # Additional fields discovered from database at runtime
    # Using dict to handle dynamic columns
    model_config = {"extra": "allow"}
```

### JobOfferWithProcess (Pydantic)

```python
from pydantic import BaseModel
from typing import Optional

class JobOfferWithProcess(BaseModel):
    """Combined job offer with process metadata."""
    id: int
    title: str
    url: str
    process: Optional[JobOfferProcess] = None  # Null if no process record
```

### JobOffersListResponse (Pydantic)

```python
from pydantic import BaseModel

class JobOffersListResponse(BaseModel):
    """Response envelope for job offers list."""
    job_offers: list[JobOfferWithProcess]
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `id` | Must be positive integer | "id must be a positive integer" |
| `title` | Required, non-empty string | "title is required" |
| `url` | Required, valid URL format | "url must be a valid URL" |
| `process` | Can be null | N/A |

## State Transitions

N/A - This is a read-only endpoint with no state changes.

## Query Pattern

```sql
SELECT 
    jo.id,
    jo.title,
    jo.url,
    jop.*
FROM job_offers jo
LEFT JOIN job_offers_process jop ON jo.id = jop.job_offer_id
ORDER BY jo.id ASC
```

**Rationale for LEFT JOIN**:
- Ensures job offers without process records are still returned
- Process field will be `null` when no matching record exists
- Supports the one-to-one cardinality clarified in specification

## Response Example

```json
{
  "job_offers": [
    {
      "id": 1,
      "title": "Senior Python Developer",
      "url": "https://example.com/jobs/1",
      "process": {
        "job_offer_id": 1,
        "status": "processed",
        "scraped_at": "2026-03-20T10:00:00Z",
        "source": "linkedin"
      }
    },
    {
      "id": 2,
      "title": "Frontend Engineer",
      "url": "https://example.com/jobs/2",
      "process": null
    }
  ]
}
```

## Error Response Models

### ErrorResponse (existing)

```python
class ErrorResponse(BaseModel):
    """Error response payload."""
    detail: str = Field(description="Error message")
```

Used for:
- 503 Service Unavailable (database connection failure)
- 500 Internal Server Error (query failure)
