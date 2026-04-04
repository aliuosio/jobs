## Context

The Firefox extension's popup currently uses a cache-first loading strategy in `loadJobLinks()`. When the popup opens:
1. It first loads cached job offers from `browser.storage.local`
2. Then checks if the cache is stale (> 1 hour old) and fetches new data in background

This causes users to see stale/old job data when they reopen the extension, even though clicking the "Refresh Jobs" button would fetch fresh data from the API.

## Goals / Non-Goals

**Goals:**
- Make jobs show fresh from API on every popup open (matching refresh button behavior)
- If API fetch fails, fall back to cached jobs with error indicator
- Ensure users always see current job listings

**Non-Goals:**
- Change API endpoint or data format
- Modify background script behavior
- Add new UI elements or features

## Decisions

**Decision 1: Use forceRefreshJobLinks() as startup behavior**
- The existing `forceRefreshJobLinks()` function already does exactly what's needed: fetches fresh from API, shows loading state, handles errors
- Simply call this function on init instead of `loadJobLinks()`
- Rationale: Reuses existing battle-tested code instead of creating new logic

**Decision 2: Keep cached jobs as fallback only**
- If API fetch fails, show cached jobs (if available) with an error message
- Rationale: Better UX than showing empty state when API is temporarily unavailable
- Cache is updated on successful fetch

**Decision 3: Remove isStale check**
- The stale indicator logic becomes unnecessary since we're always fetching fresh
- Rationale: Simplifies code, removes dead logic

## Risks / Trade-offs

- **Risk**: More frequent API calls on every popup open
- **Mitigation**: API is fast, and this is the expected user experience. Caching happens after successful fetch.

- **Risk**: Longer initial load time (need to wait for API response)
- **Mitigation**: Show skeleton loading state during fetch, same as refresh button does now

- **Risk**: Users with slow API connection will see loading on every popup open
- **Mitigation**: Add small cache threshold (e.g., 30 seconds) to prevent rapid re-fetches while popup is open
