## Why

The Firefox extension currently fetches fresh job data from the API every time the popup opens. This causes unnecessary API calls and slower popup load times. Users expect to see the cached jobs from their last manual "Refresh" action, with the last-clicked link highlighted in yellow for quick reference.

## What Changes

1. **Cache-first loading on startup**: Change popup initialization to show cached jobs from storage instead of always fetching fresh from API
2. **Yellow highlight for last-clicked job**: Add yellow background styling to the job link that was last clicked by the user
3. **Background refresh fallback**: If no cached data exists on first open, fetch fresh data and cache it
4. **Manual refresh still works**: The "Refresh Jobs" button continues to fetch fresh and update the cache

## Capabilities

### New Capabilities
- `job-links-cache-on-open`: Cache job offers from last refresh and display on popup open instead of fetching fresh every time
- `job-links-yellow-highlight`: Highlight the last-clicked job link with yellow background color

### Modified Capabilities
- `job-links-display`: Modified to support yellow highlight state for last-clicked link (visual change only, no new requirements)

## Impact

**Affected files:**
- `extension/popup/popup.js`: Modify init() to use cache-first strategy
- `extension/popup/popup.css`: Add `.job-link-highlight` style for yellow background

**No API changes** - backend remains unchanged.