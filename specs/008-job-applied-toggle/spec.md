# Feature Specification: Job Applied Status Toggle

**Feature Branch**: `008-job-applied-toggle`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "make the firefox extension work with the two new api points. it gets a list for the job link list . the ones where i have applied have the green icon on the left like now. if not applied its red. i can click on the icon on the left to change staus of applied or not."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Job Links with Applied Status (Priority: P1)

As a job seeker using the Firefox extension, I want to see a list of job links in the popup with visual indicators showing which jobs I have already applied to, so I can quickly track my application progress.

**Why this priority**: Core functionality that provides immediate value - users can see their job application status at a glance without leaving the popup.

**Independent Test**: Can be tested by opening the popup and verifying the job list displays with correct green/red icons based on applied status from the API.

**Acceptance Scenarios**:

1. **Given** the extension popup is open, **When** the job links API returns a list of jobs with applied status, **Then** each job link displays with a colored icon on the left indicating applied (green) or not applied (red)
2. **Given** the extension popup is open, **When** the job links API is unavailable or returns an error, **Then** the user sees an appropriate error message and the job links section shows a graceful fallback message

---

### User Story 2 - Toggle Applied Status by Clicking Icon (Priority: P1)

As a job seeker, I want to click the status icon next to a job link to toggle its applied status, so I can quickly mark jobs as applied or unapplied without navigating away.

**Why this priority**: Essential interaction that completes the core workflow - users need to be able to update their status, not just view it.

**Independent Test**: Can be tested by clicking the status icon and verifying the visual change and API call to update status.

**Acceptance Scenarios**:

1. **Given** a job link is displayed with a red (not applied) icon, **When** the user clicks the icon, **Then** the icon changes to green and the applied status is sent to the API
2. **Given** a job link is displayed with a green (applied) icon, **When** the user clicks the icon, **Then** the icon changes to red and the not-applied status is sent to the API
3. **Given** the user clicks the status icon, **When** the API call succeeds, **Then** the new status persists and the icon reflects the updated state
4. **Given** the user clicks the status icon, **When** the API call fails, **Then** the icon reverts to its original state and an error message is displayed

---

### User Story 3 - Navigate to Job Page (Priority: P2)

As a job seeker, I want to click on the job link title to open the job page, so I can view full job details and apply.

**Why this priority**: Secondary navigation - users need to access the actual job posting to apply or learn more. The clickable area should be clearly separated from the status toggle.

**Independent Test**: Can be tested by clicking the job title and verifying the link opens in a new tab.

**Acceptance Scenarios**:

1. **Given** a job link is displayed, **When** the user clicks the job title (not the icon), **Then** the job URL opens in a new browser tab

---

### Edge Cases

- What happens when the job links API returns an empty list?
- What happens when the API response contains malformed data (missing fields)?
- What happens when the user clicks the icon rapidly multiple times (debounce)?
- What happens when network connectivity is lost during status toggle?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch job links from the jobs list API endpoint and display them in the popup
- **FR-002**: System MUST display a green icon for jobs where the user has applied (applied: true)
- **FR-003**: System MUST display a red icon for jobs where the user has not applied (applied: false)
- **FR-004**: System MUST send a toggle request to the applied status API when the user clicks the status icon
- **FR-005**: System MUST update the icon color immediately after a successful status toggle
- **FR-006**: System MUST revert the icon to its original state if the API call fails
- **FR-007**: System MUST display a clickable status indicator that is visually distinct from the job title
- **FR-008**: System MUST handle API errors gracefully with user-visible feedback
- **FR-009**: System MUST debounce rapid icon clicks to prevent multiple simultaneous toggle requests

### Key Entities

- **Job Link**: Represents a job posting with id, title, url, and applied status
- **Applied Status**: Boolean indicator (true = applied/green, false = not applied/red)
- **Toggle Request**: API call to update applied status for a specific job

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view job links list within 2 seconds of opening the popup
- **SC-002**: Applied jobs display green icon, non-applied jobs display red icon - 100% accuracy
- **SC-003**: Clicking the status icon toggles the applied status with visual feedback within 500ms
- **SC-004**: Failed API calls show error message within 3 seconds and revert icon to original state
- **SC-005**: Job links are clickable and open the job URL in a new tab (independent of status toggle)
- **SC-006**: Extension remains functional for form filling even if job links API is unavailable

## Clarifications

### Session 2026-03-20

- Q: API endpoint structure → A: `GET /job-offers` (list with `process.applied` bool) + `PATCH /job-offers/{id}/process` with `{applied: bool}` body
- Q: Toggle interaction behavior → A: Optimistic — icon changes immediately; reverts if API fails
- Q: Loading state for job links → A: Skeleton placeholders — 3-5 grey rows while fetching, fade-in when data arrives
- Q: Error state when job links API fails → A: Error banner with retry — inline error message with retry button inside job links section

## Assumptions

- API endpoint 1: `GET /job-offers` — Returns list of `JobOfferWithProcess` objects each containing `{id, title, url, process: {applied: bool|null}}`
- API endpoint 2: `PATCH /job-offers/{job_offer_id}/process` — Accepts body `{applied: bool}` to update applied status; returns updated `JobOfferWithProcess`
- API base URL: `http://localhost:8000` (same as existing form-fill API)
- Job link data from API: id (int), title (str), url (str), process.applied (bool or null)
- When `process` is null or `process.applied` is null, treat as "not applied" (red icon)
- The existing popup CSS `.job-status-*` classes will be reused/extended
- The status icon clickable area is distinct from the job title link to prevent accidental navigation
