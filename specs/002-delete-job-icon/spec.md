# Feature Specification: Delete Job Offer Button

**Feature Branch**: `002-delete-job-icon`  
**Created**: 2025-04-17  
**Status**: Draft  
**Input**: User description: "1. i need a delete icon next to each job title in the list 2. This button is used to delete the job offer totally(there is a fastapi endpoint for that already) 3. make the extension abou 20% more wide"

## Clarifications

### Session 2025-04-17

- Q: DELETE API endpoint existence → A: Create the endpoint (doesn't exist yet)
- Q: SQL delete order → A: Delete job_offers_process first due to foreign key constraints, then job_offers
- Q: Remove from extension list → A: Yes, refresh UI after successful delete
- Q: Development approach → A: Use TDD (test-driven development)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Individual Job Offer (Priority: P1)

As a user managing job applications, I want to delete unwanted job offers from my list so that I can keep my job tracking clean and focused.

**Why this priority**: Users need a way to permanently remove job offers they are no longer interested in or that are no longer available. This is a core CRUD operation.

**Independent Test**: Can be tested by opening the extension popup, clicking the delete icon next to any job in the list, and verifying the job is removed from both the UI and database.

**Acceptance Scenarios**:

1. **Given** a job offer is displayed in the list, **When** the user clicks the delete icon, **Then** the job is permanently removed from the list and the API is called to delete from the database
2. **Given** the delete API call fails, **When** the user clicks delete, **Then** an error message is displayed and the job remains in the list
3. **Given** the list is empty, **When** the user opens the popup, **Then** no delete icons are displayed (only empty state message)

---

### User Story 2 - Wider Extension Popup (Priority: P2)

As a user with multiple job applications, I want a wider popup so that I can see more of each job title without excessive truncation.

**Why this priority**: The current 480px width causes job titles to truncate frequently. A 20% increase (to ~576px) will improve readability.

**Independent Test**: Can be verified by measuring the popup width before and after and observing reduced text truncation.

**Acceptance Scenarios**:

1. **Given** the extension is loaded, **When** the popup opens, **Then** the popup width is approximately 576px (20% wider than 480px)
2. **Given** long job titles, **When** displayed in the wider popup, **Then** less truncation occurs and more text is visible

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a delete icon next to each job title in the job links list
- **FR-002**: System MUST call the DELETE API endpoint when the delete icon is clicked to permanently remove the job offer
- **FR-003**: Users MUST be able to delete a job offer with a single click on the delete icon
- **FR-004**: System MUST provide user feedback after delete operation: success shows "Job deleted" message for 3 seconds, error shows "Delete failed. Please try again." message
- **FR-005**: System MUST refresh the job list after successful deletion
- **FR-006**: System MUST increase the popup container width to 576px (±10px tolerance, range 570px-580px)
- **FR-007**: DELETE endpoint MUST delete from job_offers_process table first due to foreign key constraints, then job_offers table
- **FR-008**: Implementation MUST use TDD approach - write tests before implementation

### Key Entities *(include if feature involves data)*

- **JobOffer**: Represents a job posting with id, title, URL, description, and process metadata
- **DeleteAction**: Represents the delete operation with job ID and result status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can delete any job offer in the list with a single click (no confirmation required for speed)
- **SC-002**: Deleted jobs are removed from the list within 2 seconds of clicking the delete button (timing starts when button is clicked, ends when UI updates)
- **SC-003**: Popup width is between 570px and 580px (tolerance: ±10px from target 576px)
- **SC-004**: Error rate for delete operations is less than 5%

## Assumptions

- DELETE endpoint at `/job-offers/{job_offer_id}` needs to be created as part of this feature
- The extension popup width is defined in popup.css and can be modified via CSS
- The delete icon will use an existing icon style (trash/remove icon) consistent with the extension design language
- No confirmation dialog is needed for delete - immediate deletion for streamlined UX
- Implementation follows TDD approach - write failing test first, then implement to pass