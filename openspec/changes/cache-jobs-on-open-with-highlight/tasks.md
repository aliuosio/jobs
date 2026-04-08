## 1. Modify init() to use cache-first loading

- [x] 1.1 In init(), change to call `loadCachedJobLinks()` first instead of `forceRefreshJobLinks()`
- [x] 1.2 Add logic: if cache exists, show it immediately; only fetch fresh if no cache
- [x] 1.3 Keep conditional check (fetch fresh if no cache)

## 2. Add yellow highlight CSS for last-clicked job

- [x] 2.1 Add `.job-link-highlight` class in popup.css with yellow background (`#fef9c3`)
- [x] 2.2 Add yellow border (`#fbbf24`) to make it visually distinct
- [x] 2.3 Ensure text remains readable with yellow background

## 3. Update renderJobLinksList() to apply highlight

- [x] 3.1 In renderJobLinksList(), check for last-clicked job ID from storage
- [x] 3.2 Apply `job-link-highlight` class to the last-clicked job link item
- [x] 3.3 Ensure both visited (gray) and last-clicked (yellow) states can coexist visually

## 4. Test the changes

- [x] 4.1 Load extension in Firefox
- [x] 4.2 Open popup - should show cached jobs from last refresh (no loading spinner)
- [x] 4.3 Click a job link - it should have yellow highlight
- [x] 4.4 Close and reopen popup - the clicked link should still have yellow highlight
- [x] 4.5 Click Refresh button - should fetch fresh and update cache
- [x] 4.6 Verify no regression: job status toggle still works