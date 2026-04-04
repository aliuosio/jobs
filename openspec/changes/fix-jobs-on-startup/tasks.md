## 1. Modify popup.js init to fetch fresh jobs on startup

- [x] 1.1 In init() function, replace `loadJobLinks()` call with `forceRefreshJobLinks()` to always fetch fresh from API
- [x] 1.2 Remove or comment out the `loadJobLinks()` function since it's no longer needed (cache-first strategy replaced)
- [x] 2.1 Remove `isStale` variable and `isCacheStale()` function usage in job loading (not needed when always fetching fresh)
- [x] 2.2 Remove `updateStaleIndicator()` call in `loadJobLinks` function (no longer needed)
- [x] 2.3 Remove `fetchAndCacheJobOffers()` function if it's only called from `loadJobLinks` (dead code after change)

## 3. Keep cache as fallback only

- [x] 3.1 Verify `forceRefreshJobLinks()` shows cached data when API fetch fails (existing behavior - already implemented)
- [x] 3.2 Ensure `cacheJobOffers()` still saves job offers after successful fetch (for offline fallback)

## 4. Test the changes

- [ ] 4.1 Load extension in Firefox
- [ ] 4.2 Open popup - should show loading state, then fetch and display jobs from API
- [ ] 4.3 Verify jobs shown match what refresh button would show
- [ ] 4.4 Test error case: disconnect API, open popup - should show cached jobs with error indicator
- [ ] 4.5 Test refresh button still works correctly
