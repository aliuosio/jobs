# Feature Specification: Copy Cover Letter to Clipboard

**Feature Branch**: `005-copy-cover-letter`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "optimise feedback with extension after generation. if one has been generated it has an extra icon on which when clicked the cover letter is copied to memory so i can paste it"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Copy generated cover letter to clipboard (Priority: P1)

A user who has already generated a cover letter for a job wants to quickly copy that letter to paste it into an application form or email.

**Why this priority**: This is the core value proposition - enabling users to reuse generated cover letters without re-reading or re-copying manually.

**Independent Test**: Can be tested by generating a cover letter for any job, then clicking the copy icon and pasting the content elsewhere to verify it matches.

**Acceptance Scenarios**:

1. **Given** a job has a generated cover letter, **When** the user clicks the copy icon, **Then** the cover letter content is copied to the system clipboard
2. **Given** a job has no cover letter generated, **When** the user views the job list, **Then** the copy icon is not visible for that job

---

### User Story 2 - Visual indication that cover letter exists (Priority: P2)

A user wants to quickly identify which jobs already have cover letters generated without checking each one individually.

**Why this priority**: Reduces cognitive load and helps users prioritize which jobs to apply to.

**Independent Test**: Can be verified by checking that jobs with generated letters show a distinct icon, while jobs without letters show a different state.

**Acceptance Scenarios**:

1. **Given** a job has a generated cover letter, **When** the user views the job list, **Then** a copy icon is displayed next to that job
2. **Given** a job has no cover letter, **When** the user views the job list, **Then** the copy icon is not displayed

---

### User Story 3 - Feedback on successful copy (Priority: P3)

A user wants confirmation that the copy action succeeded so they know they can paste the content.

**Why this priority**: Provides user confidence that the action completed successfully.

**Independent Test**: Can be verified by clicking the copy icon and observing the feedback.

**Acceptance Scenarios**:

1. **Given** the user clicks the copy icon, **When** the copy succeeds, **Then** a brief visual feedback appears (icon change or toast)
2. **Given** the copy fails (e.g., browser permission denied), **When** the user clicks the copy icon, **Then** an error message or fallback behavior occurs

---

### Edge Cases

- What happens when the cover letter content is too long for clipboard?
- How does the system handle clipboard access being denied by the browser?
- What if multiple jobs have cover letters - does clicking the icon copy the correct one?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST display a copy icon next to jobs that have a generated cover letter
- **FR-002**: The extension MUST NOT display the copy icon for jobs without a generated cover letter
- **FR-003**: Clicking the copy icon MUST copy the cover letter content to the system clipboard
- **FR-004**: After copying, the system MUST provide visual feedback confirming the copy action
- **FR-005**: The system MUST handle clipboard access failures gracefully with appropriate user feedback

### Key Entities *(include if feature involves data)*

- **Job Offer**: Existing entity representing a job posting, now with additional state for whether a cover letter exists
- **Cover Letter**: The generated content stored in job_applications table, retrieved via existing API

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can copy a generated cover letter with a single click, reducing manual copy-paste time to under 3 seconds
- **SC-002**: 95% of copy actions complete successfully with positive user feedback
- **SC-003**: Users can identify which jobs have cover letters within 2 seconds of viewing the list

## Assumptions

- The existing API endpoint `/job-offers/{id}/letter-status` will continue to work and return whether a letter exists
- The extension uses standard browser Clipboard API for copying
- Visual feedback will be non-intrusive (icon animation or brief toast) to avoid interrupting user workflow
- The copy functionality works across all Firefox versions supported by the extension