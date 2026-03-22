# Feature Specification: Job Status Sync

**Feature Branch**: `012-job-status-sync`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "the jobs links in the extensions do not reflect the status in the table job_offers_process. check if the api is treiggreed right and the data is reflected in the db. also check if the connections between api and extension works"

## Clarifications

### Session 2026-03-22

- Q: How should the extension obtain updated job status data from the backend API? → A: WebSocket/Server-Sent Events
- Q: What should happen when the backend API is unavailable or returns an error? → A: Show Empty State with Retry
- Q: What are the columns and data types for the job_offers_process table? → A: id (integer PK), job_offer_id (integer FK), research (boolean), research_email (boolean), applied (boolean), created_at (timestamp), updated_at (timestamp)
- Q: How should the extension visually represent the three status flags (research, research_email, applied) for each job offer? → A: color code single flag (only applied status shown; green for not applied, red for applied)
- Q: What is the SSE endpoint URL and message format for job status updates? → A: Endpoint: /api/v1/stream, Message: JSON array of all job offers with process data
- Q: How should concurrent updates to the same job offer process be handled? → A: Last-write-wins (overwrite with latest timestamp)
- Q: What are the reliability/availability expectations for the backend API? → A: Best effort (no SLA)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Job Status in Extension (Priority: P1)

As a user, I want to see the correct applied status (color‑coded) for each job listing in the Firefox extension so that I can track whether I've applied to jobs accurately.

**Why this priority**: Without accurate status display, users cannot rely on the extension to reflect their true application state, leading to missed opportunities or duplicate efforts.

**Independent Test**: Can be fully tested by verifying that the extension displays the correct status flags for a set of job offers stored in the database, without requiring any other feature to be implemented.

**Acceptance Scenarios**:

1. **Given** a job offer exists in the database with a corresponding process record indicating `applied=false`, **When** the user opens the extension and views the job list, **Then** the job entry shows the applied status as not applied (green).
2. **Given** a job offer exists in the database with a corresponding process record indicating `applied=true`, **When** the user opens the extension and views the job list, **Then** the job entry shows the applied status as applied (red).

### User Story 2 - API Returns Process Data (Priority: P1)

As a user, I want the backend API to include the process status (research, research_email, applied) when returning job offer data so that the extension can display accurate information.

**Why this priority**: If the API does not return the process data, the extension cannot display it regardless of its implementation, making this a prerequisite for correct status display.

**Independent Test**: Can be fully tested by sending a request to the `/job-offers` endpoint and verifying that the response includes the process object with the correct fields for each job offer, without requiring the extension to be involved.

**Acceptance Scenarios**:

1. **Given** the database contains a job offer with an associated process record, **When** a GET request is made to `/job-offers`, **Then** the response includes a process object for that job offer with the correct values for research, research_email, and applied.
2. **Given** the database contains a job offer without an associated process record, **When** a GET request is made to `/job-offers`, **Then** the response includes a null process object for that job offer.

### User Story 3 - Extension API Connection Works (Priority: P2)

As a user, I want the extension to successfully connect to the backend API and receive job offer data so that the extension can function as intended.

**Why this priority**: If the extension cannot connect to the API, no data can be displayed, rendering the extension useless.

**Independent Test**: Can be fully tested by verifying that the extension can make a successful HTTP request to the backend API's `/job-offers` endpoint and receive a valid response, without requiring the data to be processed or displayed.

**Acceptance Scenarios**:

1. **Given** the backend API is running and accessible, **When** the extension attempts to fetch job offers, **Then** the request completes successfully and returns a 200 OK response.
2. **Given** the backend API is not running, **When** the extension attempts to fetch job offers, **Then** the extension handles the error gracefully (e.g., shows an error message or retry option).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST return process status data (research, research_email, applied) for each job offer when retrieving job offers via the API.
- **FR-002**: System MUST handle cases where a job offer has no associated process record by returning a null process field.
- **FR-003**: Extension MUST display the applied status flag (color‑coded: #22C55E green for not applied, #EF4444 red for applied) for each job offer in the job list. Research and research_email flags are not displayed.
- **FR-004**: Extension MUST establish a Server-Sent Events (SSE) connection to the backend endpoint `/api/v1/stream` to receive immediate updates when job offer process data changes.
- **FR-005**: Extension MUST show an empty state with a retry button when the backend API is unavailable or returns an error.
- **FR-006**: Extension MUST update the displayed status in real-time (≤1 second per SC-003) when the process data in the database changes via the SSE connection to `/api/v1/stream`.

### Key Entities

- **Job Offer**: Represents a job listing with attributes such as title, URL, and foreign key to process data.
- **Job Offer Process**: Represents the processing status of a job offer with boolean flags for research completion, research email sent, and application submitted.

### Data Model

**job_offers_process table**:
- `id` (integer, primary key)
- `job_offer_id` (integer, foreign key to job_offers.id)
- `research` (boolean, default false)
- `research_email` (boolean, default false)
- `applied` (boolean, default false)
- `created_at` (timestamp, default current_timestamp)
- `updated_at` (timestamp, default current_timestamp, auto‑updated on change)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the correct applied status (color‑coded) for at least 95% of job offers in the extension without manual refresh.
- **SC-002**: The API returns process data for 100% of job offers that have an associated process record in the database.
- **SC-003**: The extension establishes a real-time SSE connection to `/api/v1/stream` and receives process updates within 1 second of database changes.
- **SC-004**: When the backend API is unavailable, the extension shows an empty state with retry option within 2 seconds of detection.
- **SC-005**: When process data is updated in the database, the extension displays the updated status within 1 second of receiving the real-time update.

## Assumptions

- The extension currently fetches job offers from the `/job-offers` endpoint but does not display or utilize the process data.
- The backend API already implements the `/job-offers` endpoint and returns basic job offer data (id, title, url) but may not include the process object.
- The database schema includes a `job_offers_process` table with foreign key to `job_offers` and boolean columns for research, research_email, and applied.
- The extension has the capability to make HTTP requests to the backend API and parse JSON responses.
- Users refresh the extension's job list periodically (e.g., on extension popup open or via a manual refresh button).
- The backend API operates on a best‑effort basis with no formal SLA or uptime guarantee.

## Edge Cases

- What happens when the database is temporarily unavailable during API requests?
- How does the extension handle malformed or incomplete JSON responses from the API?
- What occurs when a job offer process record exists but references a non-existent job offer?
- How are concurrent updates to the same job offer process handled? → **Resolution**: Last-write-wins (overwrite with latest timestamp).