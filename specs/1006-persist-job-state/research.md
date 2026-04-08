# Research: Persist Job State on Extension Open

**Phase**: 0 - Outline & Research

## Technical Approach

### Decision: Load Cached Data First, Then Optionally Refresh

**Rationale**: The existing code already caches job data in `browser.storage.local` via `cacheJobOffers()`. The key change is to modify the `init()` function to:
1. First load cached data from storage
2. Display cached data immediately
3. Optionally trigger background refresh (only if user clicks refresh or after initial delay)

**Alternative approaches evaluated**:
- **Always fetch fresh**: Current behavior - causes delay on every open, fails when offline
- **Load cached, then refresh**: Selected approach - provides instant display, works offline, freshens when online
- **Hybrid with timestamp**: Show cached with "last updated X ago" indicator - could be added later

### Storage Keys (Already Exist)

| Key | Purpose | Already Implemented |
|-----|---------|---------------------|
| JOB_OFFERS | Cached job list | ✅ Yes |
| JOB_OFFERS_TIMESTAMP | Cache freshness | ✅ Yes |
| VISITED_LINKS | Visited job IDs | ✅ Yes |

### Additional Storage Key Needed

| Key | Purpose | New/Existing |
|-----|---------|---------------|
| LAST_CLICKED_JOB_LINK | Last clicked job ID | **NEW** |

### Yellow Highlight Implementation

The CSS already has `.job-link-visited` class that applies yellow background. Need to:
1. Add storage key for LAST_CLICKED_JOB_LINK
2. On job link click, save job ID to storage
3. On init, check storage for last clicked and apply visited class

---

## Findings Summary

- **Technology**: browser.storage.local (Firefox Extension API)
- **Storage pattern**: Already established in popup.js
- **Visited links**: Already tracked via VISITED_LINKS
- **Yellow highlight**: CSS class `.job-link-visited` already exists
- **No external libraries needed**: Pure browser.* APIs

**Conclusion**: No NEEDS CLARIFICATION required. Implementation is straightforward using existing storage infrastructure.
