# Feature Specification: Refresh Jobs Fix

**Feature Branch**: `014-refresh-jobs-fix`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "the refresh jobs function is not working here"

## Problem Analysis

### Root Cause

The `handleRefreshLinksClick()` function calls `loadJobLinks()`, which implements a cache-first strategy:

```javascript
// In loadJobLinks()
if (cachedOffers.length > 0) {
  jobLinks = cachedOffers;
  hideLoading();
  renderJobLinksList(filteredLinks);
  
  if (isStale) {
    updateStaleIndicator(true);
    fetchAndCacheJobOffers();  // ⚠️ NOT awaited - fire-and-forget
  }
}
```

**Issues:**
1. `fetchAndCacheJobOffers()` is not awaited - the refresh completes before fresh data arrives
2. No visual feedback during background refresh
3. Refresh button doesn't distinguish between "load from cache" and "force fresh fetch"
4. `loadJobLinks()` always uses cache-first logic, even when user explicitly requests refresh

### Expected Behavior

When user clicks "Refresh Jobs":
1. Show loading state (skeleton)
2. Fetch fresh data from API (bypass cache)
3. Update UI with fresh data
4. Cache the fresh data

### Current Behavior

When user clicks "Refresh Jobs":
1. If cache exists → show cached data immediately
2. If cache is stale → start background fetch (not awaited)
3. User sees old data, doesn't know when/if fresh data arrives

## Clarifications

### Session 2026-03-27

- Q: Should the refresh button bypass cache entirely or still show cached data while fetching? → A: Bypass cache, show loading state, fetch fresh data
- Q: Should there be visual feedback during refresh (e.g., spinner on button)? → A: Yes, disable button and show "Refreshing..." text
- Q: What happens if refresh fails while having cached data? → A: Show error message, keep cached data displayed
- Q: Should auto-refresh on popup open use cache or fetch fresh? → A: Cache-first is fine for auto-load; refresh button should force fresh fetch

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Refresh Fetches Fresh Data (Priority: P0)

As a user, I want the "Refresh Jobs" button to fetch fresh data from the API so that I can see the latest job offers and status changes.

**Why this priority**: This is the core bug - the refresh button doesn't actually refresh.

**Independent Test**: Can be tested by:
1. Loading the extension popup (cache gets populated)
2. Modifying data via API or database
3. Clicking "Refresh Jobs"
4. Verifying the UI shows the updated data

**Acceptance Scenarios**:

1. **Given** cached job offers exist in storage, **When** user clicks "Refresh Jobs", **Then** the system shows loading state, fetches fresh data from API, and updates the UI with fresh data.

2. **Given** the API is unavailable, **When** user clicks "Refresh Jobs", **Then** the system shows an error message and retains any previously displayed cached data.

3. **Given** the refresh is in progress, **When** user clicks "Refresh Jobs" again, **Then** the second click is ignored (button is disabled during refresh).

### User Story 2 - Visual Feedback During Refresh (Priority: P1)

As a user, I want visual feedback when the refresh is in progress so that I know the system is working.

**Why this priority**: Without feedback, users may click multiple times or think the button is broken.

**Independent Test**: Can be tested by clicking "Refresh Jobs" and verifying button state changes.

**Acceptance Scenarios**:

1. **Given** the user clicks "Refresh Jobs", **When** the refresh starts, **Then** the button is disabled and shows "Refreshing..." text.

2. **Given** the refresh completes (success or failure), **When** the refresh finishes, **Then** the button is re-enabled and shows "Refresh Jobs" text.

### User Story 3 - Auto-Load Uses Cache-First (Priority: P2)

As a user, I want the extension to load quickly on popup open using cached data, with background refresh if stale.

**Why this priority**: Fast initial load improves UX; stale indicator informs user of data freshness.

**Independent Test**: Can be tested by opening popup with cached data and verifying immediate display.

**Acceptance Scenarios**:

1. **Given** cached job offers exist and are fresh (< 1 hour old), **When** the popup opens, **Then** cached data is displayed immediately without API call.

2. **Given** cached job offers exist but are stale (> 1 hour old), **When** the popup opens, **Then** cached data is displayed immediately with stale indicator, and background refresh is triggered.

3. **Given** no cached data exists, **When** the popup opens, **Then** loading skeleton is shown while fetching from API.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `handleRefreshLinksClick()` function MUST bypass cache and fetch fresh data from the API.
- **FR-002**: The refresh button MUST be disabled and show "Refreshing..." text during API fetch.
- **FR-003**: The refresh function MUST show loading skeleton while fetching fresh data.
- **FR-004**: The refresh function MUST update the UI with fresh data after successful API response.
- **FR-005**: The refresh function MUST cache fresh data after successful API response.
- **FR-006**: If refresh fails and cached data exists, the system MUST show error message but retain cached data display.
- **FR-007**: The auto-load on popup open MUST continue to use cache-first strategy for fast initial load.
- **FR-008**: The auto-load MUST trigger background refresh (non-blocking) if cache is stale.

### Non-Functional Requirements

- **NFR-001**: Refresh operation MUST complete within 10 seconds (API timeout).
- **NFR-002**: Button state MUST update immediately on click (no delay).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking "Refresh Jobs" always fetches fresh data from API (100% of successful requests).
- **SC-002**: Button shows "Refreshing..." and is disabled during refresh (100% of refresh operations).
- **SC-003**: Fresh data is displayed within 10 seconds of clicking refresh (when API is available).
- **SC-004**: Error message is shown within 10 seconds if API is unavailable.
- **SC-005**: Auto-load on popup open displays cached data immediately (< 100ms) when cache exists.

## Assumptions

- The existing `fetchJobOffers()` function correctly fetches data from the background script.
- The background script's `handleGetJobOffers()` correctly fetches from the API.
- The existing caching mechanism via `cacheJobOffers()` and `loadStateFromStorage()` works correctly.
- The skeleton loading state (`showSkeleton()`, `hideLoading()`) works correctly.

## Edge Cases

- What happens if user rapidly clicks refresh multiple times? → Button is disabled during refresh, subsequent clicks are ignored.
- What happens if popup is closed during refresh? → Operation continues in background, result is cached for next open.
- What happens if cache is corrupted? → Treated as no cache, fresh fetch is performed.
- What happens if API returns empty array? → Show "No job links available" message.

## Implementation Notes

### Proposed Solution

Create a new function `forceRefreshJobLinks()` that:
1. Shows loading skeleton
2. Fetches fresh data from API (via `fetchJobOffers()`)
3. Updates UI with fresh data
4. Caches fresh data
5. Handles errors gracefully

Modify `handleRefreshLinksClick()` to call `forceRefreshJobLinks()` instead of `loadJobLinks()`.

```javascript
async function forceRefreshJobLinks() {
  const btn = elements.refreshLinksBtn;
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Refreshing...';
  showSkeleton();
  
  try {
    const links = await fetchJobOffers();
    jobLinks = links;
    hideLoading();
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filteredLinks);
    await cacheJobOffers();
    updateStaleIndicator(false);
  } catch (err) {
    console.error('[Popup] forceRefreshJobLinks error:', err);
    // If we have cached data, show it with error
    if (jobLinks.length > 0) {
      hideLoading();
      showToggleError('Failed to refresh: ' + err.message);
    } else {
      showJobError('Failed to load jobs: ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}
```

### Files to Modify

- `extension/popup/popup.js` - Add `forceRefreshJobLinks()`, modify `handleRefreshLinksClick()`

## Out of Scope

- SSE real-time updates (covered in spec 012-job-status-sync)
- Export functionality
- Status toggle functionality
- Form scanning/filling functionality