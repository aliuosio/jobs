# API Contracts: Job Offers Endpoints

These contracts document the existing backend API endpoints used by the Firefox extension feature. No changes to backend required.

---

## Contract 1: List Job Offers

### GET /job-offers

Fetches all job offers with processing metadata including applied status.

**URL**: `http://localhost:8000/job-offers`  
**Method**: `GET`  
**Authentication**: None (existing setup)  
**Content-Type**: N/A (no body)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | — | Maximum number of results |
| `offset` | integer | No | — | Number of results to skip |

**Success Response** (200 OK):
```json
{
  "job_offers": [
    {
      "id": 1,
      "title": "Senior Frontend Developer",
      "url": "https://example.com/jobs/1",
      "process": {
        "job_offers_id": 1,
        "research": false,
        "research_email": false,
        "applied": true
      }
    },
    {
      "id": 2,
      "title": "Full Stack Engineer",
      "url": "https://example.com/jobs/2",
      "process": null
    }
  ]
}
```

**Error Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 503 | `{"detail": "Database temporarily unavailable"}` | PostgreSQL connection failed |
| 500 | `{"detail": "Internal server error"}` | Unexpected error |

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `job_offers[].id` | int | Job offer primary key |
| `job_offers[].title` | string | Job posting title |
| `job_offers[].url` | string | URL to job posting |
| `job_offers[].process` | object\|null | Processing metadata |
| `job_offers[].process.applied` | bool\|null | User applied status; null when no process record |

**Extension Mapping**:
- `process?.applied === true` → Green icon (applied)
- `process?.applied === false` → Red icon (not applied)
- `process === null || process.applied === null` → Red icon (not applied)

---

## Contract 2: Update Applied Status

### PATCH /job-offers/{job_offer_id}/process

Updates the applied status for a specific job offer. Supports partial updates.

**URL**: `http://localhost:8000/job-offers/{job_offer_id}/process`  
**Method**: `PATCH`  
**Authentication**: None (existing setup)  
**Content-Type**: `application/json`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_offer_id` | integer | Yes | Job offer primary key |

**Request Body**:
```json
{
  "applied": true
}
```

All fields are optional. Only `applied` is used by this feature.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applied` | boolean | No | Whether job application has been submitted |

**Success Response** (200 OK):
```json
{
  "id": 1,
  "title": "Senior Frontend Developer",
  "url": "https://example.com/jobs/1",
  "process": {
    "job_offers_id": 1,
    "research": false,
    "research_email": false,
    "applied": true
  }
}
```

**Error Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{"detail": "Job offer ID must be a positive integer"}` | `job_offer_id <= 0` |
| 404 | `{"detail": "Job offer not found"}` | No matching job offer |
| 500 | `{"detail": "Internal server error"}` | Unexpected error |
| 503 | `{"detail": "Database temporarily unavailable"}` | PostgreSQL connection failed |

**Extension Handling**:
- Timeout: 10 seconds (same as existing fill-form timeout)
- On timeout/error: Revert optimistic UI update, show error message
- On 404: Revert optimistic UI update, show "Job not found"

---

## Usage in Extension

```javascript
// Fetch job offers
const res = await fetch(`${API_ENDPOINT}/job-offers`);
const { job_offers } = await res.json();

// Toggle applied status
const res = await fetch(`${API_ENDPOINT}/job-offers/${id}/process`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ applied: newValue }),
  signal: AbortSignal.timeout(10000)
});
const updated = await res.json();
```
