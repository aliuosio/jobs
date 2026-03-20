# Feature Specification: Update Job Offer Process API

**Feature Branch**: `007-update-job-offer-api`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "create api endpoint to update a job offer process."

## Clarifications

### Session 2026-03-20

- Q: Who can update job offer processes? → A: Assumed authenticated users with valid session (API is internal, behind existing auth layer)
- Q: How to handle concurrent updates? → A: Last-write-wins with optimistic approach (database-level handling sufficient for this use case)
- Q: How to handle empty payload `{}`? → A: Return 200 with current state unchanged (no-op update)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Update Job Offer Process Status (Priority: P1)

As a user tracking job applications, I want to update the processing status of a job offer (research completed, email sent, application submitted) so that I can track my job search progress.

**Why this priority**: This is the core functionality requested. Without it, users cannot track their job application pipeline.

**Independent Test**: Can be fully tested by sending a PATCH request with process fields and verifying the updated values are persisted.

**Acceptance Scenarios**:

1. **Given** a job offer with ID 123 exists in the system, **When** I send a PATCH request to update the process with `{"research": true}`, **Then** the process record is updated and `{"id": 123, "process": {"research": true, ...}}` is returned.

2. **Given** a job offer with ID 123 exists but has no process record, **When** I send a PATCH request with `{"applied": true}`, **Then** a new process record is created and linked to the job offer.

3. **Given** a job offer with ID 999 does not exist, **When** I send a PATCH request, **Then** I receive a 404 error with an appropriate message.

---

### User Story 2 - Partial Process Update (Priority: P2)

As a user, I want to update only specific process fields without affecting others, so that I can mark individual milestones independently.

**Why this priority**: Allows granular tracking without requiring full process state on each update.

**Independent Test**: Can be tested by updating one field and verifying other fields remain unchanged.

**Acceptance Scenarios**:

1. **Given** a job offer has a process record with `{"research": true, "applied": false}`, **When** I send a PATCH request with `{"research_email": true}`, **Then** the result shows `{"research": true, "research_email": true, "applied": false}`.

2. **Given** a job offer has a process record with all fields set, **When** I send a PATCH request with `{"applied": true}`, **Then** all other fields retain their original values.

---

### User Story 3 - Batch Status Retrieval After Update (Priority: P3)

As a user, I want to retrieve the full job offer with updated process status after an update, so that I can confirm the change and see the complete record.

**Why this priority**: Provides confirmation of successful updates without requiring a separate GET request.

**Independent Test**: Can be tested by updating and verifying the response contains the full updated record.

**Acceptance Scenarios**:

1. **Given** a successful update, **When** I receive the response, **Then** it includes the complete job offer with all process fields populated.

---

### Edge Cases

- **No existing process record**: System creates a new process record linked to the job offer (upsert behavior)
- **Concurrent updates**: Last-write-wins with optimistic approach (sufficient for job tracking use case)
- **Empty update payload `{}`**: Returns 200 with current state unchanged (no-op update)
- **Invalid job offer ID format**: Returns 400 Bad Request for non-integer IDs

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an HTTP PATCH endpoint at `/job-offers/{id}/process` to update job offer processing metadata
- **FR-002**: System MUST return the updated job offer with process data in the response
- **FR-003**: System MUST create a new process record if one does not exist for the given job offer
- **FR-004**: System MUST return HTTP 404 when the specified job offer ID does not exist
- **FR-005**: System MUST support partial updates (only update provided fields, preserve others)
- **FR-006**: System MUST validate that job offer ID is a positive integer
- **FR-007**: System MUST return appropriate error responses for invalid requests
- **FR-008**: Process fields MUST include: `research` (boolean), `research_email` (boolean), `applied` (boolean)

### Key Entities

- **JobOffer**: Job posting record containing id, title, url
- **JobOfferProcess**: Processing metadata linked to a JobOffer, containing boolean flags for `research`, `research_email`, and `applied`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can update any process field and receive confirmation within 500ms under normal load
- **SC-002**: 100% of valid update requests return successful responses with updated data
- **SC-003**: 100% of requests for non-existent job offers return 404 errors
- **SC-004**: System correctly preserves unmodified process fields during partial updates
