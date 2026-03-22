# Feature Specification: Job Status List Filtering Fix

**Feature Branch**: `011-job-status-filter-fix`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "fix job status list in extension. on initial load only jobs which have not been applied for are loaded. if i click on applied the icon becomes red and in the background per fastapi the job is shown as applied. if i click on refresh at the buttom only none applied jobs are loaded"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Load Shows Only Non-Applied Jobs (Priority: P1)

As a job seeker using the Firefox extension popup, I want the job list to show only jobs I have not yet applied to when I open the popup, so I can quickly focus on jobs that need action.

**Why this priority**: Core filtering behavior - users expect to see actionable items (non-applied jobs) immediately on popup open.

**Independent Test**: Open the extension popup and verify only non-applied jobs appear in the list. Applied jobs are hidden from view.

**Acceptance Scenarios**:

1. **Given** the extension popup is opened, **When** the job list loads from cache or API, **Then** only jobs with `applied=false` are displayed in the list
2. **Given** there are jobs with `applied=true` in the database, **When** the popup loads, **Then** those applied jobs are NOT shown in the list
3. **Given** there are jobs with `applied=null` (no process record), **When** the popup loads, **Then** those jobs ARE shown (treated as non-applied)

---

### User Story 2 - Toggle Applied Status via Icon Click (Priority: P1)

As a job seeker, I want to click the status icon next to a job to mark it as applied, so I can update my application status directly from the popup.

**Why this priority**: Core interaction that moves jobs from "to apply" to "applied" state. Visual feedback (red icon) confirms the action was registered.

**Independent Test**: Click the status icon on a visible job → icon turns red → job disappears from list → API call updates backend.

**Acceptance Scenarios**:

1. **Given** a non-applied job is displayed in the list, **When** the user clicks the status icon, **Then** the icon turns red immediately (optimistic update)
2. **Given** a non-applied job icon was clicked, **When** the API call succeeds, **Then** the job is removed from the visible list and the applied status is persisted to the backend via `PATCH /job-offers/{id}/process`
3. **Given** a non-applied job icon was clicked, **When** the API call fails, **Then** the icon reverts to its original color and an error message is displayed
4. **Given** a job is in "pending" state (API call in progress), **When** the user clicks the icon again, **Then** the click is ignored (debounced)

---

### User Story 3 - Refresh Shows Only Non-Applied Jobs (Priority: P1)

As a job seeker, I want to click the refresh button to reload the job list, so I can see any new jobs while continuing to focus on non-applied ones.

**Why this priority**: Refresh must maintain the same filtering behavior as initial load - always show non-applied jobs.

**Independent Test**: Click refresh button → job list reloads → only non-applied jobs are displayed.

**Acceptance Scenarios**:

1. **Given** the user clicks the refresh button, **When** the job list reloads, **Then** only jobs with `applied=false` are displayed (consistent with initial load)
2. **Given** the user has marked some jobs as applied via icon clicks, **When** the user clicks refresh, **Then** those jobs are NOT shown in the refreshed list
3. **Given** new jobs were added to the database, **When** the user clicks refresh, **Then** new jobs with `applied=false` appear in the list

---

### User Story 4 - Toggle Applied Jobs Visibility (Priority: P2)

As a job seeker, I want to temporarily view my applied jobs alongside non-applied ones, so I can review my application history without leaving the popup.

**Why this priority**: Adds visibility into applied job history without cluttering the default "to apply" focus.

**Independent Test**: Click "Show Applied" filter → applied jobs appear in list → click again to hide them.

**Acceptance Scenarios**:

1. **Given** the default view shows only non-applied jobs, **When** the user clicks the "Show Applied" toggle/filter, **Then** jobs with `applied=true` appear in the list
2. **Given** the "Show Applied" filter is active, **When** the user clicks it again, **Then** applied jobs are hidden, returning to the default non-applied-only view
3. **Given** the user has filtered to show applied jobs, **When** the user clicks refresh, **Then** the filter state is preserved (applied jobs remain visible after refresh)
4. **Given** applied jobs are visible, **When** the user clicks the status icon on an applied job, **Then** the icon turns green (toggles to non-applied) and the job is removed from the applied view

---

### Edge Cases

- What happens when all jobs have `applied=true`? → Empty list with "No job links available" message
- What happens when the API is unavailable on refresh? → Show error state with retry button, preserve cached data
- What happens when rapid refresh clicks occur? → Debounce refresh button during fetch
- What happens when cached data and API data differ? → API data takes precedence after successful fetch
- What happens when "Show Applied" is active and all applied jobs are unmarked? → List becomes empty, show "No job links available"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST filter job list to show ONLY jobs where `applied=false` or `applied=null` on initial popup load
- **FR-002**: System MUST hide jobs where `applied=true` from the visible list on initial load
- **FR-003**: System MUST send `PATCH /job-offers/{id}/process` with `{applied: true}` when user clicks status icon on a non-applied job
- **FR-004**: System MUST remove a job from the visible list immediately after successful applied status update
- **FR-005**: System MUST revert the icon to original state if the applied status update API call fails
- **FR-006**: System MUST filter job list to show ONLY non-applied jobs on refresh (consistent with initial load behavior)
- **FR-007**: System MUST debounce rapid clicks on status icons to prevent multiple simultaneous toggle requests
- **FR-008**: System MUST display error feedback when applied status update fails
- **FR-009**: System MUST provide a "Show Applied" toggle to temporarily reveal applied jobs in the list
- **FR-010**: System MUST persist the "Show Applied" filter state across refresh operations

### Key Entities

- **Job Offer**: Job posting with id, title, url, and process.applied status
- **Applied Status**: Boolean (`true` = applied/hidden, `false` = not applied/visible, `null` = not applied/visible)
- **Applied Toggle Request**: API call to `PATCH /job-offers/{id}/process` with `{applied: bool}`
- **Filter State**: Toggle state determining whether applied jobs are visible (default: hidden)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On popup open, 100% of displayed jobs have `applied=false` or `applied=null` — no applied jobs visible
- **SC-002**: Clicking status icon on non-applied job triggers API call within 500ms
- **SC-003**: After successful applied toggle, the job disappears from the list within 1 second
- **SC-004**: On refresh, only non-applied jobs are shown (100% consistency with initial load)
- **SC-005**: Failed API calls show error message and revert icon within 3 seconds
- **SC-006**: Rapid clicks on status icon do not trigger multiple API calls (debounce works)
- **SC-007**: "Show Applied" toggle appears within 500ms of user interaction
- **SC-008**: Applied jobs display correctly when "Show Applied" filter is active (green icons)

## Assumptions

- API endpoint 1: `GET /job-offers` — Returns all job offers regardless of applied status
- API endpoint 2: `PATCH /job-offers/{id}/process` — Accepts `{applied: bool}` to update status
- Filtering is done client-side (extension popup), not server-side — all jobs are fetched, then filtered
- Applied status `null` in database means no process record exists — treated as "not applied" (visible)
- Existing code in `popup.js` (`filterNotAppliedLinks()`) handles the filtering logic
- Existing code in `handleStatusClick()` handles the optimistic toggle and API call
- "Show Applied" toggle is a checkbox or button in the popup UI near the job list

## Clarifications

### Session 2026-03-22

- Q: Does initial load filter applied jobs? → A: Yes, only `applied=false` and `applied=null` jobs are shown
- Q: Does clicking the status icon make the job disappear from the list? → A: Yes, job is removed after successful API call (it's now applied)
- Q: Does refresh reload only non-applied jobs? → A: Yes, refresh maintains the same filtering behavior as initial load
- Q: Should users be able to view their list of applied jobs at all, or should applied jobs remain permanently hidden? → A: **Add "Show Applied" toggle** — A button/filter to temporarily show applied jobs alongside non-applied ones.
