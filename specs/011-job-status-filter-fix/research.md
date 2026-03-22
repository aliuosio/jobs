# Research: Job Status List Filtering Fix

**Feature**: 011-job-status-filter-fix  
**Date**: 2026-03-22

## Decision: Client-Side Filtering Approach

**Chosen**: Client-side filtering in popup.js (extension)

**Rationale**: 
- The `GET /job-offers` API returns all jobs regardless of applied status
- Client-side filtering allows dynamic Show Applied toggle without backend changes
- Existing code already implements `filterNotAppliedLinks()` for this pattern

**Alternatives considered**:
- Server-side filtering with `?applied=false` query param — rejected because backend doesn't support filtering and this would require API changes
- LocalStorage for applied job IDs only — rejected because the existing implementation caches full job objects

---

## Decision: Filter State Persistence

**Chosen**: Store `showAppliedFilter` in browser.storage.local alongside existing jobOffers

**Rationale**:
- Consistent with existing storage pattern (jobOffers, jobOffersTimestamp)
- Persists across popup open/close
- Simple boolean toggle state

**Alternatives considered**:
- URL hash parameter — rejected (popup doesn't have URL context)
- Session-only (memory) — rejected because user expects filter to persist on popup close/reopen

---

## Decision: Toggle UI Placement

**Chosen**: Checkbox toggle in job-links-section header area, above the list

**Rationale**:
- Standard UX pattern for list filters
- Visible but unobtrusive
- Matches existing stale-indicator placement

**Alternatives considered**:
- Button in refresh-section — rejected (confuses refresh with filter)
- Dropdown filter — rejected (overkill for binary toggle)

---

## Implementation Pattern: Existing Code Reuse

The existing code in `popup.js` already implements most requirements:

1. `filterNotAppliedLinks()` — filters jobs where `applied=false`
2. `handleStatusClick()` — toggles status, removes from list after success
3. `loadJobLinks()` — calls filter on both initial load and refresh
4. `handleUpdateApplied()` in background.js — sends PATCH to FastAPI

**New code required**:
1. `showAppliedFilter` state variable
2. Toggle UI element (checkbox)
3. Modified `renderJobLinksList()` to conditionally filter based on toggle
4. Filter state persistence in storage

---

## Browser Extension Storage Pattern

From existing code analysis:
- Uses `browser.storage.local` (not sync)
- Pattern: `await saveStateToStorage({ [KEY]: value })`
- Keys stored in `STORAGE_KEYS` constant

**Storage additions needed**:
- `SHOW_APPLIED_FILTER`: boolean (default: false)
