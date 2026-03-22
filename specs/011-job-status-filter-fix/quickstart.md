# Quickstart: Job Status List Filtering Fix

**Feature**: 011-job-status-filter-fix  
**Date**: 2026-03-22

## Overview

This feature adds a "Show Applied" toggle to the Firefox extension popup that allows users to temporarily view their applied jobs alongside non-applied ones.

## Manual Testing Checklist

### Prerequisites
- [ ] Firefox browser running
- [ ] Extension loaded (`about:debugging#/runtime/this-firefox`)
- [ ] Backend API running (`docker-compose up` or `uvicorn`)
- [ ] Database has job offers with mixed applied statuses

### User Story 1: Initial Load (Non-Applied Only)

1. Open the extension popup
2. Navigate to Job Links tab
3. Verify only non-applied jobs are shown
4. Applied jobs should be hidden by default

### User Story 2: Toggle Applied Status

1. Click the status icon (green dot) next to a visible job
2. Icon should turn red immediately (optimistic update)
3. Job should disappear from list after ~500ms
4. Verify via direct API: `curl http://localhost:8000/job-offers`
5. Applied status should show as `true` in the API response

### User Story 3: Refresh Maintains Filter

1. Click "Refresh Jobs" button
2. Verify only non-applied jobs are shown
3. Previously applied jobs remain hidden

### User Story 4: Show Applied Toggle ⭐ NEW

1. **Enable**: Click the "Show Applied" checkbox/toggle
2. Applied jobs should appear in the list (with red icons)
3. Non-applied jobs remain visible
4. **Disable**: Click the toggle again
5. Applied jobs should disappear, returning to default view
6. **Persist**: Close popup, reopen, toggle should remember state
7. **Refresh**: With toggle active, click refresh — applied jobs should remain visible

### Edge Cases

- [ ] Empty list when all jobs are applied (default view)
- [ ] API failure shows error with retry button
- [ ] Rapid toggle clicks are debounced

## Verification Commands

```bash
# Check API is running
curl http://localhost:8000/health

# View job offers with applied status
curl http://localhost:8000/job-offers | jq '.job_offers[] | {id, title, applied: .process.applied}'

# Manually update applied status (for testing)
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{"applied": false}'
```

## Files to Test

| File | What to Test |
|------|--------------|
| popup.html | Toggle element renders correctly |
| popup.css | Toggle styling matches design |
| popup.js | Filter logic, state persistence |

## Debugging

```javascript
// In browser console (popup)
console.log('jobLinks:', jobLinks);
console.log('showAppliedFilter:', showAppliedFilter);

// Check storage
await browser.storage.local.get(['showAppliedFilter', 'jobOffers']);
```
