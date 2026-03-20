# Research: Job Applied Status Toggle

## Research Question 1: API Contract Analysis

### GET /job-offers

**Endpoint**: `GET http://localhost:8000/job-offers`

**Query Parameters**:
| Param | Type | Required | Default |
|-------|------|----------|---------|
| `limit` | int | No | None (no pagination) |
| `offset` | int | No | None |

**Response Schema** (`JobOffersListResponse`):
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

**Source**: `src/api/routes.py` lines 207–234, `src/api/schemas.py` lines 119–131

**Decision**: Use the full response as-is. Map `process?.applied ?? false` to UI state.

---

### PATCH /job-offers/{id}/process

**Endpoint**: `PATCH http://localhost:8000/job-offers/{job_offer_id}/process`

**Path Parameters**:
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `job_offer_id` | int | Yes | Must be > 0 |

**Request Body** (`ProcessUpdateRequest`):
```json
{
  "applied": true
}
```
Note: Only `applied` field needed for this feature. `research` and `research_email` are optional and ignored.

**Response Schema** (`JobOfferWithProcess`):
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
| Status | When |
|--------|------|
| 400 | `job_offer_id <= 0` |
| 404 | Job offer not found |
| 500 | Internal server error |
| 503 | Database unavailable |

**Source**: `src/api/routes.py` lines 237–297, `src/api/schemas.py` lines 134–145

**Decision**: Only send `applied` in request body. Ignore `research`/`research_email`.

---

## Research Question 2: Extension Message-Passing Patterns

### Existing Pattern: Popup → Background → API

From `extension/background/background.js`:

```javascript
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => sendResponse({ success: false, error: { code: '...', message: error.message } }));
  return true; // Keep channel open for async
});
```

**Decision**: Follow the exact same pattern for new message types. Add `GET_JOB_OFFERS` and `UPDATE_APPLIED` to the switch statement.

---

### Existing Pattern: Fetch with Timeout

From `extension/background/background.js`:
```javascript
const response = await fetch(`${API_ENDPOINT}/fill-form`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  signal: AbortSignal.timeout(10000)
});
```

**Decision**: Use same 10s timeout for job-offers endpoints. Same pattern for error handling.

---

## Research Question 3: Applied Status Icon Logic

**Existing CSS** in `extension/popup/popup.css`:
- `.job-status-new` → `background: #22c55e` (green)
- `.job-status-viewed` → `background: #9ca3af` (gray)
- `.job-status-saved` → `background: #3b82f6` (blue)

**Required mapping**:
- `applied: true` → green icon → reuse class `.job-status-new` (already green)
- `applied: false` OR `process === null` OR `process.applied === null` → red icon → **new class needed**

**Decision**: Add `.job-status-applied` with red background (`#ef4444`). Keep `.job-status-new` for green. The applied icon uses its own class name for semantic clarity.

---

## Research Question 4: Optimistic Update with Revert

**Pattern**: React/Redux-style optimistic UI
1. User clicks icon → immediately flip `applied` in local state
2. Fire API request in background
3. On success → confirm state (already correct)
4. On failure → revert `applied` to previous value, show error

**Debounce**: Prevent rapid clicks using a per-item pending flag. While `pending=true`, ignore additional clicks on same item.

**Decision**: Store `pending: boolean` and `applied: boolean` per job link in popup state. Debounce on pending flag, not on timer.

---

## Research Question 5: Skeleton Loading State

**CSS Pattern** from existing codebase: None for skeletons. But popup.css already has:
- `.job-link-item` structure
- `.field-item` with placeholder-style styling

**Decision**: Create skeleton rows using CSS animation on `.job-link-item`-like elements with `background: linear-gradient animation` for shimmer effect. 3-5 rows, matching exact dimensions of real items.

---

## Alternatives Considered

1. **Store applied status in browser.storage.local** (client-side only)
   - Rejected: Status would not sync across devices/sessions; the backend is the source of truth

2. **Use PATCH with toggle endpoint** (`POST /jobs/{id}/toggle`)
   - Rejected: Backend uses `PATCH /jobs/{id}/process` with explicit boolean value

3. **Full page refresh on toggle**
   - Rejected: Bad UX. Optimistic update with revert is smoother

4. **Debounce with timer (300ms)**
   - Rejected: Pending flag per item is cleaner and more explicit
