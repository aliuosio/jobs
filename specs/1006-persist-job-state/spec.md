# Feature Specification: Persist Job State on Extension Open

**Feature Branch**: `1006-persist-job-state`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "now that refresh button is working i want to see jobs from the last refresh button data pull wh3n open the extenstion. the kink i clicked last has to be highligted in yellow as it worked before. most test. most use docker. most use gitlow. use ulw"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Load Last Refreshed Jobs on Extension Open (Priority: P1)

As a user, I want to see the jobs from my last data refresh immediately when I open the extension, so that I don't have to click refresh every time I open the extension.

**Why this priority**: This is the primary feature request - users should not need to manually refresh every time they open the extension. The data from the last refresh should be persisted and displayed immediately.

**Independent Test**: Can be tested by:
1. Clicking refresh button to load jobs
2. Closing the extension
3. Opening the extension again
4. Verifying jobs are displayed without needing to refresh

**Acceptance Scenarios**:

1. **Given** the user has previously clicked the refresh button and loaded jobs into the extension, **When** the user opens the extension after closing it, **Then** the previously loaded jobs are displayed immediately without requiring another refresh.

2. **Given** the user has never clicked refresh (first time use), **When** the user opens the extension, **Then** an empty state or "Click refresh to load jobs" message is displayed.

3. **Given** the user has previously loaded jobs, **When** the user opens the extension while offline or the backend is unavailable, **Then** the cached jobs from the last successful refresh are still displayed.

---

### User Story 2 - Highlight Last Clicked Job Link (Priority: P1)

As a user, I want the job link I clicked last to remain highlighted in yellow when I open the extension, so that I can easily track which jobs I've already viewed.

**Why this priority**: This restores previously working behavior that was lost. Users need visual confirmation of which job links they've interacted with.

**Independent Test**: Can be tested by:
1. Clicking on any job link in the list
2. Closing the extension
3. Opening the extension again
4. Verifying the same job link is still highlighted in yellow

**Acceptance Scenarios**:

1. **Given** the user has previously clicked on a job link, **When** the user opens the extension after closing it, **Then** that same job link is displayed with a yellow highlight.

2. **Given** the user has clicked multiple job links, **When** the extension is reopened, **Then** only the most recently clicked job link is highlighted (not all clicked links).

3. **Given** the user has no previously clicked job link, **When** the user opens the extension, **Then** no job link is highlighted.

---

### User Story 3 - Clear Persisted State (Priority: P3)

As a user, I want the ability to clear the persisted job data, so that I can start fresh if needed.

**Why this priority**: Provides a way to reset state when users want to clear their cached data.

**Independent Test**: Can be tested by:
1. Loading jobs via refresh
2. Clicking on a job link
3. Using a "Clear Cache" or reset option
4. Verifying jobs are cleared and highlight is removed

**Acceptance Scenarios**:

1. **Given** the user has persisted job data and a highlighted link, **When** the user clears the cache, **Then** the job list is cleared and no link is highlighted.

---

### Edge Cases

- What happens when the backend data has changed since last refresh? (Should show cached data with indication it's from previous refresh)
- What happens when the last clicked job link no longer exists in the refreshed data? (Should not highlight any link)
- How does the system handle storage quota limits? (Should handle gracefully, possibly by clearing old data)
- What happens on extension update/reinstall? (Data may be cleared - acceptable)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist job data to browser local storage when refresh button is clicked and data is successfully fetched from the backend
- **FR-002**: System MUST load persisted job data from browser local storage when the extension popup is opened
- **FR-003**: System MUST persist the ID or URL of the last clicked job link to browser local storage
- **FR-004**: System MUST highlight the persisted last-clicked job link in yellow when the extension popup is opened
- **FR-005**: System MUST clear persisted data gracefully when the user explicitly requests a cache clear
- **FR-006**: System MUST handle offline/unavailable backend by displaying cached data from last successful refresh

### Key Entities *(include if feature involves data)*

- **Job Data Cache**: The persisted list of job offers fetched from the backend, including job ID, URL, title, company, and status
- **Last Clicked Link**: The job link that was most recently clicked by the user, identified by job ID or URL
- **Cache Metadata**: Timestamp of when the data was last refreshed, used to indicate data freshness

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their last refreshed job list immediately upon opening the extension (target: < 500ms display time)
- **SC-002**: The last clicked job link remains highlighted in yellow after closing and reopening the extension (100% persistence)
- **SC-003**: 95% of users successfully complete the primary user journey without errors (refresh → close → open → see jobs)
- **SC-004**: System gracefully handles backend unavailability by showing cached data without errors
