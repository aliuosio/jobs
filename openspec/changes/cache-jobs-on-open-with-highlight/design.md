## Context

The Firefox extension's popup currently uses an API-first loading strategy. When the popup opens:

1. `init()` calls `loadJobLinks()` which delegates to `forceRefreshJobLinks()`
2. This fetches fresh data from the API every time
3. Then caches the result to storage

This means:
- Every popup open causes an API call
- User sees loading spinner while waiting for API
- The last-clicked link has purple styling (`.job-link-visited`), not yellow

**Storage keys in use:**
- `jobOffers`: Cached job offers array
- `jobOffersTimestamp`: Timestamp of last cache update
- `lastClickedJobLink`: ID of last clicked job link (already stored)

## Goals / Non-Goals

**Goals:**
- Show cached jobs from last manual "Refresh" when popup opens (no loading spinner)
- Add yellow background highlight to the last-clicked job link
- If no cache exists, fetch fresh and cache on first open
- "Refresh" button still fetches fresh and updates cache

**Non-Goals:**
- Modify job status toggle behavior
- Change SSE/real-time sync behavior
- Modify the API or backend

## Decisions

**Decision 1: Change init() to use cache-first approach**
- Current: `loadJobLinks()` → `forceRefreshJobLinks()` (always fetches)
- New: Call `loadCachedJobLinks()` first to show cached data immediately
- Only fetch fresh if no cache exists (first-time user)
- Rationale: Much faster popup open, matches user expectation of "what I saw last"

**Decision 2: Change last-clicked highlight from purple to yellow**
- Current: `.job-link-visited` gives purple color (`#6366f1`)
- New: Add `.job-link-highlight` with yellow background (`#fef9c3` / `#fbbf24`)
- Keep `.job-link-visited` for actually-visited links (gray)
- Rationale: User explicitly requested yellow, matches "worked before" description

**Decision 3: Preserve manual refresh behavior**
- Refresh button continues to call `forceRefreshJobLinks()`
- This fetches fresh and updates the cache
- Rationale: User can always get latest data when they want it

## Risks / Trade-offs

**Risk**: Users might miss updates if they don't manually refresh
- **Mitigation**: Add a small "last updated" indicator showing when cache was last refreshed
- User can still click refresh to get latest

**Risk**: Old cached data might be very stale
- **Mitigation**: Keep the existing stale indicator logic for cache age > 5 minutes

**Risk**: API failure means user sees old data with no indication
- **Mitigation**: The stale indicator already handles this case

## Migration Plan

1. Modify `init()` in `popup.js` to call `loadCachedJobLinks()` instead of `forceRefreshJobLinks()`
2. Add `.job-link-highlight` CSS class with yellow styling
3. Update `renderJobLinksList()` to apply both `job-link-visited` (for visited) and `job-link-highlight` (for last-clicked) classes
4. Test: Open popup → should show cached jobs with yellow highlight on last-clicked
5. Test: Refresh button → should fetch fresh and update cache