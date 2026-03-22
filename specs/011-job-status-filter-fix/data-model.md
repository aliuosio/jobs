# Data Model: Job Status List Filtering Fix

**Feature**: 011-job-status-filter-fix  
**Date**: 2026-03-22

## Entities

### JobOffer (from existing API contract)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| title | string | Job posting title |
| url | string | URL to job posting |
| process | JobOfferProcess \| null | Processing metadata |

### JobOfferProcess (from existing API contract)

| Field | Type | Description |
|-------|------|-------------|
| job_offers_id | integer | Foreign key reference |
| research | boolean \| null | Research completion status |
| research_email | boolean \| null | Research email sent status |
| applied | boolean \| null | Application submitted status |

### JobLinkState (client-side model)

| Field | Type | Description |
|-------|------|-------------|
| id | number | Job offer ID |
| title | string | Job title |
| url | string | Job URL |
| applied | boolean | Derived from process.applied |
| pending | boolean | Toggle in progress |
| error | boolean | Toggle failed |

### FilterState (client-side model)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| showApplied | boolean | false | Whether to show applied jobs |

## Validation Rules

- Job is considered "applied" if `applied === true`
- Job is considered "not applied" if `applied === false` OR `applied === null`
- Filter state persists in browser.storage.local

## State Transitions

### Job Applied Status

```
Not Applied (false/null) → Applied (true)
    via: Click status icon
    triggers: PATCH /job-offers/{id}/process {applied: true}

Applied (true) → Not Applied (false)  
    via: Click status icon (when Show Applied active)
    triggers: PATCH /job-offers/{id}/process {applied: false}
```

### Filter Visibility

```
Hidden Applied Jobs (default)
    toggle ON → Shows all jobs including applied

Shown Applied Jobs
    toggle OFF → Shows only non-applied jobs
```
