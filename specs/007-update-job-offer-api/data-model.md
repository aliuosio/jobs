# Data Model: Update Job Offer Process API

**Feature**: `007-update-job-offer-api`  
**Date**: 2026-03-20

## Entities

### JobOffer (Existing)

| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| title | str | Job posting title |
| url | str | URL to job posting |

### JobOfferProcess (Existing)

| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key (auto-generated) |
| job_offers_id | int | Foreign key to job_offers |
| research | bool | Research completed flag |
| research_email | bool | Research email sent flag |
| applied | bool | Application submitted flag |

### ProcessUpdateRequest (New)

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| research | bool | No | Set research completion status |
| research_email | bool | No | Set research email sent status |
| applied | bool | No | Set application submitted status |

**Validation**: All fields are optional to support partial updates. Empty payload `{}` is valid (no-op).

## Relationships

```
JobOffer (1) ←──→ (0..1) JobOfferProcess
     │
     └── id (PK) ──────── job_offers_id (FK)
```

## State Transitions

The JobOfferProcess follows a simple boolean flag model:

```
research: false → true (once company is researched)
research_email: false → true (once outreach email sent)
applied: false → true (once application submitted)
```

No backward transitions (once marked true, stays true in typical usage).

## API Schemas

### ProcessUpdateRequest (New)

```python
class ProcessUpdateRequest(BaseModel):
    """Request payload for updating job offer process fields."""
    
    research: bool | None = Field(
        default=None,
        description="Whether job research has been completed"
    )
    research_email: bool | None = Field(
        default=None,
        description="Whether research email has been sent"
    )
    applied: bool | None = Field(
        default=None,
        description="Whether job application has been submitted"
    )
```

### JobOfferWithProcess (Existing - unchanged)

```python
class JobOfferWithProcess(BaseModel):
    id: int = Field(description="Job offer primary key")
    title: str = Field(description="Job posting title")
    url: str = Field(description="URL to job posting")
    process: JobOfferProcess | None = Field(
        default=None, 
        description="Processing metadata, null if no process record"
    )
```

## Database Schema

### job_offers (Existing)

```sql
CREATE TABLE job_offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### job_offers_process (Existing)

```sql
CREATE TABLE job_offers_process (
    id SERIAL PRIMARY KEY,
    job_offers_id INTEGER NOT NULL REFERENCES job_offers(id),
    research BOOLEAN DEFAULT FALSE,
    research_email BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_offers_id)
);
```

## Validation Rules

1. **Job Offer ID**: Must be a positive integer (> 0)
2. **Process Fields**: Must be boolean values (True/False/None)
3. **Partial Update**: Fields not provided in request are preserved as-is
