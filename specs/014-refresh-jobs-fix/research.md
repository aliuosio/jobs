# Research: Refresh Jobs Fix

## Problem Statement

The "Refresh Jobs" button in the extension popup does not working as expected - it does not fetch fresh data from the API when user clicks it it.

## Investigation

### Code Analysis

**File**: `extension/popup/popup.js`

#### Current Implementation

```javascript
async function handleRefreshLinksClick() {
  await loadJobLinks();
}
```

This calls `loadJobLinks()` which has cache-first logic:

#### Problem in `loadJobLinks()`

```javascript
async function loadJobLinks() {
  showSkeleton();
  
  try {
    const state = await loadStateFromStorage();
    const cachedOffers = state[STORAGE_KEYS.JOB_OFFERS] || [];
    const cachedTimestamp = state[STORAGE_KEYS.JOB_OFFERS_TIMESTAMP] || 0;
    const isStale = isCacheStale(cachedTimestamp);
    
    if (cachedOffers.length > 0) {
      jobLinks = cachedOffers;
      hideLoading();
      const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(filteredLinks);
      
      if (isStale) {
        updateStaleIndicator(true);
        fetchAndCacheJobOffers();  // ⚠️ NOT AWAITED
      }
    } else {
      // No cache case fetch from API
      const links = await fetchJobOffers();
      jobLinks = links;
      hideLoading();
      const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(filteredLinks);
      await cacheJobOffers();
    }
  } catch (err) {
    showJobError('Failed to load jobs: ' + err.message);
  }
}
```

**Issue**: `fetchAndCacheJobOffers()` is called but NOT awaited, so the UI shows cached data and the function returns immediately. Fresh data loads in background but UI is never updated.

### Root Cause

1. **Cache-first logic always executes** - even when user explicitly requests refresh
2. **Background fetch not awaited** - user doesn't know when fresh data arrives
3. **No visual distinction** between auto-load and manual refresh

4. **No button state feedback** during refresh

## Solution Design

### Approach: Force Refresh

Create a new function `forceRefreshJobLinks()` that:
1. Always shows loading skeleton
2. Always fetches from API (bypasses cache)
3. Updates UI with fresh data
4. Caches fresh data
5. Provides button state feedback (disabled, text change)
6. Handles errors gracefully (with fallback to cached data if available)

### Modified Function

```javascript
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}
```

## Alternative Approaches Considered

### Approach A: Clear Cache + Refresh
- Clear storage before refresh
- Call existing `loadJobLinks()`
- Pros: Simpler change
- Cons: Unnecessary cache clearing, creates brief flash of empty state

### Approach B: Add Force Parameter
- Add `force: boolean` parameter to `loadJobLinks()`
- Pros: Minimal code change
- Cons: More complex function signature, API change

### Approach C: New Function (Selected)
- Clean separation of concerns
- Explicit intent (force refresh)
- Better testability
- Follows single responsibility principle

## Decision

**Selected Approach C: New Function** because:
1. Clear separation of auto-load and manual refresh behavior
2. Better testability (isolated function)
3. Single responsibility (force refresh)
4. Maintains existing cache-first logic for auto-load

## Implementation Details

### Function: `forceRefreshJobLinks()`

**Purpose**: Force fresh fetch from API, bypassing cache

**Flow**:
1. Disable button, show "Refreshing..."
2. Show loading skeleton
3. Fetch from API via `fetchJobOffers()`
4. On success: Update UI, cache data, hide stale indicator
5. On error with cached data: Show error, keep cached data
6. On error without cached data: Show full error
7. Re-enable button

### Button State Management

| State | Button Disabled | Button Text |
|------|------------------|-------------------|
| Idle            | No                  | "Refresh Jobs"     |
| Refreshing   | Yes                 | "Refreshing..."  |
| Complete     | No                  | "Refresh Jobs"     |

### Error Handling Strategy

| Scenario | Has Cached Data | Action |
|-----------|------------------|--------|
| API fails | Yes | Show error, keep cached data |
| API fails | No | Show full error |

## Testing Strategy

### Unit Tests
- Test `forceRefreshJobLinks()` directly with mocked dependencies
- Verify button state management
- Verify loading state display
- Verify API calls

### Integration Tests
- Test refresh button click handler with real API
- Verify full user flow

### Manual Testing
- Open popup in browser
- Click "Refresh Jobs"
- Verify loading state is shown
- Verify fresh data is fetched and displayed