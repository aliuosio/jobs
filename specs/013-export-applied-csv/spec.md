# Feature Specification: Export Applied Jobs as CSV

**Feature Branch**: `013-export-applied-csv`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "in the extension i need a button to export applied jobs as csv. the button is between the checkbox and the refresh jobs button in the job links tab. the label is Export Applied. the current fastapi endpoint will need a parameter for format allowing json or csv. on a click of the new button the user can download the csv with the naming having current datetime in filename"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Applied Jobs to CSV (Priority: P1)

As a job seeker, I want to export a list of jobs I have applied to as a CSV file, so I can keep a backup record or share my application history with others.

**Why this priority**: Core feature that enables data portability - users need to be able to export their application data for offline tracking and sharing.

**Independent Test**: Can be tested by clicking the "Export Applied" button and verifying the CSV file downloads with correct content and filename.

**Acceptance Scenarios**:

1. **Given** the user is on the Job Links tab with at least one applied job, **When** the user clicks the "Export Applied" button, **Then** a CSV file downloads containing all applied job records with their details
2. **Given** the user is on the Job Links tab with no applied jobs, **When** the user clicks the "Export Applied" button, **Then** a CSV file downloads with headers only (no data rows)
3. **Given** the user clicks the "Export Applied" button, **When** the download completes, **Then** the filename contains the current date and time in ISO 8601 format (e.g., `applied-jobs-2026-03-22T143052.csv`)

---

### User Story 2 - Format Selection via API Parameter (Priority: P1)

As a backend API consumer, I want the job offers endpoint to support a format parameter, so that clients can request data in JSON or CSV format based on their needs.

**Why this priority**: API flexibility - the same endpoint should serve both the native JSON format and CSV for export purposes.

**Independent Test**: Can be tested by calling the API with `?format=csv` and verifying CSV output, and with `?format=json` for standard JSON output.

**Acceptance Scenarios**:

1. **Given** a client requests `GET /job-offers?format=json`, **When** the API processes the request, **Then** it returns standard JSON format matching the existing response structure
2. **Given** a client requests `GET /job-offers?format=csv`, **When** the API processes the request, **Then** it returns CSV content with proper headers and MIME type (`text/csv`)
3. **Given** a client requests `GET /job-offers` without the format parameter, **When** the API processes the request, **Then** it defaults to JSON format (backward compatible)
4. **Given** a client requests `GET /job-offers?format=invalid`, **When** the API processes the request, **Then** it returns a 400 Bad Request error with helpful message

---

### User Story 3 - Button Placement and UI Consistency (Priority: P2)

As a user, I want the "Export Applied" button to be positioned logically between the filter checkbox and the refresh button, so that it fits naturally in the existing interface layout.

**Why this priority**: UX consistency - the button should not disrupt the existing flow and should be easily discoverable.

**Independent Test**: Can be tested by visually verifying the button appears in the correct position within the refresh section of the Job Links tab.

**Acceptance Scenarios**:

1. **Given** the user is on the Job Links tab, **When** the page renders, **Then** the "Export Applied" button appears between the "Show Applied" checkbox and the "Refresh Jobs" button
2. **Given** the button is rendered, **When** the user hovers over it, **Then** it shows the same visual feedback as other buttons in the popup

---

### Edge Cases

- What happens when the API returns an empty job list during CSV export?
- What happens when the user clicks export while the job list is still loading (debounce)?
- What happens when special characters exist in job titles (commas, quotes)?
- What happens when the datetime in the filename conflicts with existing files?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Export Applied" button in the refresh section of the Job Links tab
- **FR-002**: System MUST position the "Export Applied" button between the "Show Applied" checkbox and the "Refresh Jobs" button
- **FR-003**: System MUST call the job offers API with `?format=csv` when the export button is clicked
- **FR-004**: System MUST trigger a file download when the CSV response is received from the API
- **FR-005**: System MUST name the downloaded file with the pattern `applied-jobs-{ISO8601_datetime}.csv`
- **FR-006**: System MUST only include applied jobs (where `applied: true`) in the CSV export
- **FR-007**: System MUST include job details: company, email, company_url, title, url, posted in the CSV (no "applied" column since all exported jobs are applied)
- **FR-008**: API endpoint `GET /job-offers` MUST accept a `format` query parameter with values `json` or `csv`
- **FR-009**: API endpoint MUST return proper CSV content-type header (`text/csv`) when format=csv
- **FR-010**: API endpoint MUST handle CSV escaping properly for fields containing commas or quotes
- **FR-011**: API endpoint MUST default to JSON format when format parameter is omitted (backward compatibility)
- **FR-012**: API endpoint MUST return 400 error for invalid format values

### Key Entities

- **Export Button**: UI element that triggers the CSV download
- **CSV Export Format**: Comma-separated values with headers for: company, email, company_url, title, url, posted (no "applied" column since all exported jobs are applied)
- **Format Parameter**: Query parameter `?format=json|csv` on the job-offers endpoint
- **Filename Pattern**: `applied-jobs-{YYYY-MM-DD}T{HHMMSS}.csv`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can click the "Export Applied" button and receive a CSV file download within 3 seconds
- **SC-002**: CSV file contains accurate data matching the applied jobs from the API - 100% accuracy
- **SC-003**: Downloaded filename includes ISO 8601 datetime stamp - user can identify when export was created
- **SC-004**: API responds to `?format=csv` with valid CSV content (parseable by Excel/Google Sheets)
- **SC-005**: API maintains backward compatibility - existing JSON clients continue to work without modification
- **SC-006**: CSV export handles at least 1000 applied jobs within 5 seconds (no degradation)

## Clarifications

### Session 2026-03-22

- Q: CSV column structure → A: Include all job_offers table fields: company, email, company_url, title, url, posted (note: company, email, company_url, posted may be empty/null if not yet populated)
- Q: Include "applied" column in CSV? → A: No — since we only export applied jobs, the "applied" column is redundant
- Q: DateTime format in filename → A: ISO 8601 format: `applied-jobs-2026-03-22T143052.csv`
- Q: Filter behavior for export → A: Export only applied jobs (applied: true), regardless of current filter setting
- Q: Button state when loading → A: Button should be disabled during API call to prevent double-clicks

## Assumptions

- API base URL: `http://localhost:8000` (same as existing form-fill API)
- CSV encoding: UTF-8 with BOM for Excel compatibility
- CSV delimiter: Comma (`,`)
- CSV escaping: Quotes around fields containing commas or quotes, with double-quotes escaped as `""`
- Column headers: `company,email,company_url,title,url,posted`
- The existing button CSS classes (`.btn`, `.btn-small`) will be reused for styling
- Browser download API (`URL.createObjectURL` + click) will be used for file download in extension
- Button click handler will use `fetch()` to get CSV blob from API, then trigger download
