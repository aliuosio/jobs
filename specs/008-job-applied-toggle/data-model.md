# Data Model: Job Applied Status Toggle

## Extension UI State

### JobLinkState (popup.js)

The in-memory state driving the popup UI. Stored as a module-level array.

```typescript
/**
 * @typedef {Object} JobLinkState
 * @property {number} id - Job offer ID (from API)
 * @property {string} title - Job posting title
 * @property {string} url - URL to job posting
 * @property {boolean} applied - Whether user has applied (derived: process?.applied ?? false)
 * @property {boolean} pending - True during in-flight toggle request
 * @property {boolean} error - True if last toggle failed (triggers revert + message)
 */

/** @type {JobLinkState[]} */
let jobLinks = [];
```

### State Transitions

```
Initial Load:
  null → [fetching] → [JobLinkState array] OR [error state]

Toggle (optimistic):
  JobLinkState.applied = !JobLinkState.applied  ← immediate
  JobLinkState.pending = true
  → API call →
    Success: pending = false, applied stays (already flipped)
    Failure: pending = false, applied = oldValue (revert)
```

---

## API Response Shapes

### GET /job-offers Response

```typescript
// Source: src/api/schemas.py → JobOffersListResponse
interface JobOffersListResponse {
  job_offers: JobOfferWithProcess[];
}

interface JobOfferWithProcess {
  id: number;           // Job offer primary key
  title: string;        // Job posting title
  url: string;           // URL to job posting
  process: JobOfferProcess | null;
}

interface JobOfferProcess {
  job_offers_id: number;
  research: boolean | null;
  research_email: boolean | null;
  applied: boolean | null;   // null when no process record exists
}
```

### Mapping: API → UI State

```typescript
/**
 * @param {JobOfferWithProcess} offer
 * @returns {JobLinkState}
 */
function mapOfferToState(offer) {
  return {
    id: offer.id,
    title: offer.title,
    url: offer.url,
    applied: offer.process?.applied ?? false,  // null → false
    pending: false,
    error: false
  };
}
```

---

## Background ↔ Popup Message Contracts

### GET_JOB_OFFERS

**Popup → Background**:
```typescript
{
  type: 'GET_JOB_OFFERS',
  data: { limit?: number, offset?: number }
}
```

**Background → Popup** (success):
```typescript
{
  success: true,
  job_offers: JobOfferWithProcess[]  // Raw API response
}
```

**Background → Popup** (failure):
```typescript
{
  success: false,
  error: {
    code: 'API_TIMEOUT' | 'API_UNAVAILABLE' | 'API_ERROR',
    message: string
  }
}
```

### UPDATE_APPLIED

**Popup → Background**:
```typescript
{
  type: 'UPDATE_APPLIED',
  data: { job_offer_id: number, applied: boolean }
}
```

**Background → Popup** (success):
```typescript
{
  success: true,
  job_offer_id: number,
  applied: boolean
}
```

**Background → Popup** (failure):
```typescript
{
  success: false,
  error: {
    code: 'API_TIMEOUT' | 'API_UNAVAILABLE' | 'API_ERROR' | 'NOT_FOUND',
    message: string
  }
}
```

---

## Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| `job_offer_id` | Must be positive integer (> 0) | Backend validation |
| `applied` | Must be boolean | Frontend enforced |
| `title` | Non-empty string | Backend guaranteed |
| `url` | Valid URL string | Backend guaranteed |
| Rapid clicks | Debounced via `pending` flag per item | Frontend enforced |

---

## Error Handling Matrix

| Error Condition | UI Response | User Feedback |
|-----------------|-------------|---------------|
| GET timeout (10s) | Error banner + retry button | "Failed to load jobs" |
| GET network error | Error banner + retry button | "Failed to load jobs" |
| GET 503 | Error banner + retry button | "Database unavailable" |
| PATCH timeout (10s) | Revert icon + error message | Per-item error message |
| PATCH 404 | Revert icon + error message | "Job not found" |
| PATCH 500/503 | Revert icon + error message | "Update failed" |
| Malformed API response | Skip malformed items, render rest | Console warning |
