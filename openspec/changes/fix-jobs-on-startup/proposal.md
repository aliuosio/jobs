## Why

Currently, the Firefox extension shows cached jobs from browser.storage.local on popup startup. This means users see stale/old job data if the extension was previously used and then closed. The user expects jobs to be fetched fresh on every popup open (like clicking the refresh button), ensuring the displayed jobs are always current and match what the refresh button would show.

## What Changes

- Modify `popup.js` init logic to fetch fresh job offers on every popup open instead of loading from cache first
- The refresh button behavior (force fresh fetch from API) becomes the default startup behavior
- If API fetch fails, fall back to cached jobs with an error indicator
- Remove cache-first loading strategy - always fetch from API first

## Capabilities

### New Capabilities
- `fresh-job-load-on-startup`: Jobs are always fetched fresh from the API when the popup opens, ensuring users see current data on every interaction

### Modified Capabilities
- None - this is a bugfix implementation change, not a requirement change

## Impact

- **Files Modified**: `extension/popup/popup.js`
- **API Calls**: More frequent API calls (on every popup open instead of only on refresh)
- **User Experience**: Users will always see current job listings, no more stale cached data on startup
- **Storage**: Cached jobs still stored but only used as fallback when API unavailable
