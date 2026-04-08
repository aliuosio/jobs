# Feature Specification: Fix Job Listing Bug

**Feature Branch**: `1005-fix-job-listing`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "fix the job listing bug. it should load jobs as soon as the extension is openend. the refresh button pullling jobs has to work. this all used to work so check the git logs. creta a new git flow branch for the fix. use SOLID, DRY and YAGNI principles, Before building new check for old artifacts that can be reused form the git log. test the new funcions before marking them as finished using test from the test folder. use ulw"

## Background Analysis

### Git History Review

Recent commits show:
- `eb15a7c fix: fetch fresh job listings every time extension popup is opened`
- `f0f5f0d fix(extension): restore cache-first job loading for instant startup and persistence`
- `d1290c9 refactor: update API endpoint and change job loading to API-first strategy`

The code already has a `forceRefreshJobLinks()` function implemented, but there's a critical bug: **the click handler references a non-existent function**.

### Root Cause Analysis

**The Bug**: In `extension/popup/popup.js` at line 211:
```javascript
elements.refreshLinksBtn.addEventListener('click', handleRefreshLinksClick);
```

The event listener is attached to `handleRefreshLinksClick`, but **this function is never defined** in the file. The intended functionality exists in `forceRefreshJobLinks()` (lines 263-296), but it's not being called when the refresh button is clicked.

Additionally, the `loadJobLinks()` function (lines 294-296) calls `forceRefreshJobLinks()` directly for initial load on popup open, which is correct.

### Current Working Code

1. **Auto-load on popup open**: Works correctly - `init()` calls `loadJobLinks()` which calls `forceRefreshJobLinks()`
2. **Refresh button click**: **BROKEN** - references undefined function `handleRefreshLinksClick`

## User Scenarios & Testing

### User Story 1 - Refresh Button Works (Priority: P1)

As a user, I want clicking the "Refresh Jobs" button to fetch fresh job data from the API so that I can see the latest job listings.

**Why this priority**: This is the core bug - the refresh button doesn't work because it references a non-existent function.

**Independent Test**: Can be tested by:
1. Opening the extension popup
2. Clicking "Refresh Jobs" button
3. Verifying the jobs list updates with fresh data

**Acceptance Scenarios**:

1. **Given** the extension popup is open, **When** the user clicks "Refresh Jobs", **Then** the system fetches fresh data from the API and updates the display.

2. **Given** the refresh button is clicked, **When** the API is unavailable, **Then** an error message is displayed while keeping any previously cached data.

3. **Given** the refresh button is clicked, **When** the refresh is in progress, **Then** the button is disabled and shows "Refreshing..." text.

---

### User Story 2 - Jobs Load on Popup Open (Priority: P1)

As a user, I want the job listings to load automatically when I open the extension popup so that I see current data immediately.

**Why this priority**: This is the second part of the bug - jobs should load on popup open.

**Independent Test**: Can be tested by opening the extension popup and verifying jobs are displayed.

**Acceptance Scenarios**:

1. **Given** the extension popup is opened, **When** the popup opens, **Then** job listings are fetched and displayed automatically.

2. **Given** the API is unavailable on popup open, **When** the popup opens, **Then** cached job offers are displayed if available, or an error message if no cache exists.

---

## Requirements

### Functional Requirements

- **FR-001**: The refresh button click event MUST trigger a fresh data fetch from the API.
- **FR-002**: The refresh button MUST be disabled and show "Refreshing..." text during the fetch operation.
- **FR-003**: On successful refresh, the UI MUST display the newly fetched job listings.
- **FR-004**: On refresh failure with existing cache, the system MUST show an error message while retaining cached data display.
- **FR-005**: On popup open, the system MUST automatically load job listings.
- **FR-006**: On popup open with no network and no cache, the system MUST show an error message.

### Key Entities

- **Job Offer**: Represents a job listing with id, title, url, and applied status
- **Job Links Cache**: Browser local storage containing cached job offers and timestamp

## Success Criteria

### Measurable Outcomes

- **SC-001**: Clicking "Refresh Jobs" fetches fresh data from API (100% of clicks trigger fetch attempt).
- **SC-002**: Refresh button shows "Refreshing..." and is disabled during refresh (100% of refresh operations).
- **SC-003**: Job listings load automatically on popup open (100% of popup opens).
- **SC-004**: Error message displays within 10 seconds if API is unavailable.

## Assumptions

- The `forceRefreshJobLinks()` function correctly implements the refresh behavior
- The API endpoint at `http://localhost:8000/job-offers` is accessible
- The background script's `handleGetJobOffers()` correctly fetches from the API

## Edge Cases

- What happens if user rapidly clicks refresh multiple times? → Button is disabled during refresh, subsequent clicks are ignored
- What happens if popup is closed during refresh? → Operation may complete, result is cached for next open
- What happens if API returns empty array? → Show "No job links available" message
- What happens if background script is not responding? → Show appropriate error message

## Implementation Notes

### Proposed Solution

The fix is straightforward:

1. **Option A**: Change the event listener to call `forceRefreshJobLinks()` directly:
   ```javascript
   elements.refreshLinksBtn.addEventListener('click', forceRefreshJobLinks);
   ```

2. **Option B**: Create a wrapper function `handleRefreshLinksClick` that calls `forceRefreshJobLinks()`:
   ```javascript
   async function handleRefreshLinksClick() {
     await forceRefreshJobLinks();
   }
   ```

**Recommendation**: Option B is preferred as it follows the existing pattern and allows for future extension of the click handler logic.

### Files to Modify

- `extension/popup/popup.js` - Fix the event listener reference

## Out of Scope

- SSE real-time updates
- Export functionality improvements
- Status toggle functionality improvements
- Form scanning/filling functionality
