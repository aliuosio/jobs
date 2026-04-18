# Feature Specification: Generated Button Feedback

**Feature Branch**: `006-generated-button-feedback`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "1. i need a feedback from the now working workflow. the Generate Button should turn to a passive \"Generated\" Button. 2. The Jobs List loading passive and active should also show the passive Generated Button if they already have a cover letter 3. Make sure the counter that is shown while the Letter is generated has a working timer"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate button changes to Generated after completion (Priority: P1)

A user clicks Generate to trigger cover letter generation. After the letter is ready, the button should visually indicate completion rather than reverting to the active Generate state.

**Why this priority**: This provides clear visual feedback that the generation completed successfully - the current workflow shows "Generate" even after the letter exists, which is confusing.

**Independent Test**: Can be tested by clicking Generate for a job with sufficient description, waiting for completion, then verifying the button shows "Generated" instead of "Generate".

**Acceptance Scenarios**:

1. **Given** a job has `cl_status: 'none'`, **When** the user views the job, **Then** the button shows "Generate" and is enabled
2. **Given** a job has `cl_status: 'generating'`, **When** the user views the job, **Then** the button shows "Generating..." and is disabled
3. **Given** a job has `cl_status: 'ready'`, **When** the user views the job, **Then** the button shows "Generated" and is disabled (passive state)
4. **Given** a job has `cl_status: 'error'`, **When** the user views the job, **Then** the button shows "Generate" and is enabled (retry allowed)

---

### User Story 2 - Jobs List shows Generated button for existing letters (Priority: P1)

The user views the Jobs List and sees which jobs already have cover letters generated without needing to expand each job.

**Why this priority**: The user should be able to identify at a glance which jobs have generated cover letters.

**Independent Test**: Can be verified by checking the job links list shows "Generated" for jobs with `cl_status: 'ready'`.

**Acceptance Scenarios**:

1. **Given** the job links list is displayed, **When** a job has `cl_status: 'ready'`, **Then** the job shows the "Generated" passive button
2. **Given** the job links list is displayed, **When** a job has `cl_status: 'none'`, **Then** the job shows "Generate" button

---

### User Story 3 - Timer shows elapsed time during generation (Priority: P2)

The user starts cover letter generation and wants to know how long it's been running.

**Why this priority**: Provides feedback during the generation process - currently there's no indication of time elapsed.

**Independent Test**: Can be tested by triggering generation and verifying the timer increments.

**Acceptance Scenarios**:

1. **Given** a job has `cl_status: 'generating'` and `cl_start_time` is set, **When** the UI renders, **Then** a timer shows elapsed time since `cl_start_time`
2. **Given** the timer is displayed, **When** time elapses, **Then** the timer updates every second
3. **Given** generation completes (`cl_status` changes to 'ready'), **When** the UI updates, **Then** the timer is replaced with "Generated" button

---

### Edge Cases

- What happens if `cl_start_time` is missing during 'generating' status? → Show "Generating..." (fall back without timer)
- How does the timer format display? → Minutes:seconds (e.g., "1:23")
- Timer overflow (>60 min)? → Cap at "59:59"
- What happens if generation fails - does the timer stop or show an error state? → Timer stops, button returns to "Generate" state (retry allowed)
- Does the timer continue if the popup is closed and reopened? → No (timer resets on popup open)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Generate button MUST display "Generated" when `cl_status` is 'ready'
- **FR-002**: The "Generated" button MUST be disabled (non-clickable, passive state)
- **FR-003**: Jobs List MUST show "Generated" for jobs with `cl_status: 'ready'`
- **FR-004**: The timer MUST display elapsed time when `cl_status` is 'generating' and `cl_start_time` exists
- **FR-005**: The timer MUST update at least every second
- **FR-006**: When `cl_status` changes from 'generating' to 'ready', the timer MUST be replaced with "Generated" button

### Key Entities *(include if feature involves data)*

- **Job Offer**: Existing entity with `cl_status` and `cl_start_time` fields
  - `cl_status`: 'none' | 'saving' | 'generating' | 'saved' | 'ready' | 'error'
  - `cl_start_time`: timestamp when generation started

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of jobs with `cl_status: 'ready'` display "Generated" button (not "Generate")
- **SC-002**: Timer displays within 1 second of generation starting
- **SC-003**: User can identify which jobs have generated cover letters within 2 seconds of viewing the list
- **SC-004**: No button state mismatch - button text always matches `cl_status`

## Assumptions

- The existing `cl_status` API response continues to work
- `cl_start_time` is already being stored when generation starts
- Timer updates in the popup don't cause performance issues
- The passive job list view uses the same rendering logic as the main list

## Clarifications

### Session 2026-04-18

- Q: Timer format → A: Minutes:seconds (e.g., "1:23")
- Q: Missing cl_start_time → A: Show "Generating..."
- Q: "passive job list view" → A: Just one job list exists - same UI shows Generated for ready status
- Q: Timer overflow → A: Cap at "59:59"
- Q: What happens if generation fails? → A: Button returns to "Generate" state, allowing retry

## TDD Requirements (per Constitution)

Before implementation, tests MUST be written covering:
1. Button shows "Generate" when `cl_status` is 'none'
2. Button shows "Generating..." when `cl_status` is 'generating'
3. Button shows "Generated" when `cl_status` is 'ready'
4. "Generated" button is disabled
5. Timer displays elapsed time during generation
6. Timer updates every second
7. Both active and passive lists show "Generated" for `cl_status: 'ready'`