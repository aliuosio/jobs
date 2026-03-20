# Feature Specification: Persist Extension State

**Feature Branch**: `009-persist-extension-state`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "theextension shoud not loose state if it closes. the state in jorm form helper and job list"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restore Job List After Extension Reopens (Priority: P1)

A user has the extension open, browses through job links, and may have marked some as applied. When they close and reopen the extension popup, they expect to see the same job list with the same applied/not applied status — without needing to re-fetch from the API.

**Why this priority**: This is the core issue — users lose their job application tracking when the popup closes. Without this, users cannot effectively track which jobs they've applied to across browsing sessions.

**Independent Test**: Open extension → view job list → mark a job as applied → close popup → reopen popup → verify job still shows as applied.

**Acceptance Scenarios**:

1. **Given** the extension fetches job offers and displays them, **When** the user marks a job as applied and closes the extension, **Then** reopening the extension shows the job as applied without re-fetching
2. **Given** the extension displays a job list, **When** the extension is closed and reopened, **Then** the same jobs are displayed in the same order
3. **Given** the extension has cached job data, **When** the user clicks refresh, **Then** fresh data is fetched from the API

---

### User Story 2 - Preserve Form Scan Results (Priority: P2)

A user scans a page and sees detected fields. They close the extension popup but stay on the same page. When they reopen the popup, they expect to see the same detected fields without needing to re-scan.

**Why this priority**: Scanning takes time and may trigger API calls. Re-scanning the same page is wasteful and creates unnecessary load on the backend.

**Independent Test**: Open extension → scan page → view detected fields → close popup → reopen popup → verify same fields are displayed.

**Acceptance Scenarios**:

1. **Given** a page has been scanned and fields detected, **When** the extension is closed and reopened on the same page, **Then** the previously detected fields are restored without re-scanning
2. **Given** fields were detected on a previous page, **When** the user navigates to a different URL, **Then** the extension does not restore old field data (clears on navigation)

---

### User Story 3 - Preserve Last Selected Tab (Priority: P3)

A user prefers the "Links" tab. They switch to it, close the extension, and reopen it. They expect to see the Links tab still selected, not the default Forms tab.

**Why this priority**: Minor convenience — avoids extra clicks for users who consistently use one tab over the other.

**Independent Test**: Open extension → switch to Links tab → close popup → reopen popup → verify Links tab is still active.

**Acceptance Scenarios**:

1. **Given** the user has selected a tab (Forms or Links), **When** the extension closes and reopens, **Then** the same tab is displayed

---

### Edge Cases

- What happens when storage is corrupted or exceeds quota?
- How does the system handle version mismatches (old stored state vs new extension version)?
- What happens when the API fetch fails — should cached data still be displayed?
- Should state be cleared when the extension is updated or reinstalled?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist job offers data to browser storage when fetched from API
- **FR-002**: System MUST restore job offers from storage on extension open if available
- **FR-003**: System MUST persist applied/not applied status for each job
- **FR-004**: System MUST persist detected form fields with their page URL
- **FR-005**: System MUST persist user's last active tab preference
- **FR-006**: System MUST clear cached fields when user navigates to a different domain
- **FR-007**: System MUST implement storage versioning to handle format changes
- **FR-008**: System MUST gracefully degrade when storage is full or unavailable

### Key Entities

- **JobOffer**: Represents a job listing with id, title, url, and applied status
- **DetectedField**: Represents a scanned form field with id, label, type, and page URL
- **UserPreferences**: Stores last selected tab and other UI preferences
- **StorageVersion**: Tracks the format version of stored data for migrations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can reopen the extension within 500ms and see their previous job list (no API call required for cached data)
- **SC-002**: 100% of job application status changes persist across extension restarts
- **SC-003**: Detected form fields are restored without requiring re-scan when returning to the same URL within 24 hours
- **SC-004**: Tab preference persists across all extension sessions until explicitly changed

## Assumptions

- Browser storage.local API is available and functional in Firefox
- Storage quota is sufficient (typical job list is < 100KB)
- Users want fast restoration even if API data may be stale (show stale indicator if > 1 hour old)
- No sensitive data is being stored (job data is not personal)
