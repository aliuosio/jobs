# Feature Specification: Generated Button Feedback

**Feature Branch**: `006-generated-button-feedback`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "1. i need a feedback from the now working workflow. the Generate Button should turn to a passive \"Generated\" Button. 2. The Jobs List loading passive and active should also show the passive Generated Button if they already have a cover letter 3. Make sure the counter that is shown while the Letter is generated has a working timer. 4. UPDATE: We have two Generated buttons in the Job list now. I only need a Green 'Generated' button at the end of the row if there is a cover letter. Also fix the copy to clipboard function."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove redundant Generated button, keep only one green "Generated" button (Priority: P1)

Currently there are two Generated indicators in the job list - a badge and a button. The user wants only ONE green "Generated" button at the end of the row (in the cl-actions section), shown ONLY when there is a cover letter generated.

**Why this priority**: Having two "Generated" indicators is redundant and clutters the UI. The user wants a single, clear visual indicator.

**Independent Test**: Can be verified by viewing jobs with `cl_status: 'ready'` - should only see one green "Generated" button, not both a badge AND a button.

**Acceptance Scenarios**:

1. **Given** a job has `cl_status: 'ready'`, **When** the user views the job, **Then** the job shows ONE green "Generated" button in the cl-actions section (end of row)
2. **Given** a job has `cl_status: 'ready'`, **When** the user views the job, **Then** NO "Generated" badge should appear in the badge position (avoid double-indication)
3. **Given** a job has `cl_status: 'none'`, **When** the user views the job, **Then** no "Generated" button appears

---

### User Story 2 - Fix copy to clipboard functionality (Priority: P1)

The copy to clipboard button exists but may not work correctly. When clicked, it should copy the generated cover letter content to the user's clipboard and show feedback.

**Why this priority**: Users need to copy the generated cover letter to paste it elsewhere (into application forms, emails, etc.)

**Independent Test**: Can be tested by clicking the copy button and verifying the cover letter content is in the clipboard.

**Acceptance Scenarios**:

1. **Given** a job has `cl_status: 'ready'` and a generated cover letter, **When** the user clicks the copy button, **Then** the cover letter text is copied to clipboard
2. **Given** the copy was successful, **When** the button is clicked, **Then** the button shows visual feedback (checkmark icon)
3. **Given** the copy was successful, **When** the button is clicked, **Then** the button reverts to normal state after 2 seconds

---

### User Story 3 - Generate button changes to Generated after completion (Priority: P1)

A user clicks Generate to trigger cover letter generation. After the letter is ready, the button should visually indicate completion rather than reverting to the active Generate state.

**Why this priority**: This provides clear visual feedback that the generation completed successfully.

**Independent Test**: Can be tested by clicking Generate for a job with sufficient description, waiting for completion, then verifying the button shows "Generated".

**Acceptance Scenarios**:

1. **Given** a job has `cl_status: 'none'` and sufficient description, **When** the user views the job, **Then** the button shows "Generate" and is enabled
2. **Given** a job has `cl_status: 'generating'`, **When** the user views the job, **Then** the button shows "Generating..." and is disabled
3. **Given** a job has `cl_status: 'ready'`, **When** the user views the job, **Then** the button shows green "Generated" and is disabled (passive state)
4. **Given** a job has `cl_status: 'error'`, **When** the user views the job, **Then** the button shows "Generate" and is enabled (retry allowed)

---

### User Story 4 - Timer shows elapsed time during generation (Priority: P2)

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
- **FR-003**: The "Generated" button MUST be green (visual distinction from Generate button)
- **FR-004**: Jobs List MUST show exactly ONE "Generated" indicator when `cl_status` is 'ready' - the button at end of row, NOT the badge
- **FR-005**: The "Generated" badge MUST NOT appear when `cl_status` is 'ready' (to avoid double-indication)
- **FR-006**: Copy to clipboard button MUST copy the generated cover letter text when clicked
- **FR-007**: Copy to clipboard button MUST show visual feedback (checkmark) on successful copy
- **FR-008**: Copy to clipboard button MUST revert to normal state after 2 seconds
- **FR-009**: The timer MUST display elapsed time when `cl_status` is 'generating' and `cl_start_time` exists
- **FR-010**: The timer MUST update at least every second
- **FR-011**: When `cl_status` changes from 'generating' to 'ready', the timer MUST be replaced with "Generated" button

### Key Entities *(include if feature involves data)*

- **Job Offer**: Existing entity with `cl_status` and `cl_start_time` fields
  - `cl_status`: 'none' | 'saving' | 'generating' | 'saved' | 'ready' | 'error'
  - `cl_start_time`: timestamp when generation started

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of jobs with `cl_status: 'ready'` display ONE green "Generated" button at end of row
- **SC-002**: 0% of jobs with `cl_status: 'ready'` display a "Generated" badge (only the button should appear)
- **SC-003**: Copy to clipboard successfully copies cover letter text for 100% of jobs with `cl_status: 'ready'`
- **SC-004**: Copy button shows feedback within 500ms of click
- **SC-005**: Timer displays within 1 second of generation starting
- **SC-006**: User can identify which jobs have generated cover letters within 2 seconds of viewing the list
- **SC-007**: No button state mismatch - button text always matches `cl_status`

## Assumptions

- The existing `cl_status` API response continues to work
- `cl_start_time` is already being stored when generation starts
- Timer updates in the popup don't cause performance issues
- There is only ONE job list (no "passive" vs "active" separate lists - same UI handles all states)
- The generated cover letter content is stored and accessible via API for clipboard copy
- The copy to clipboard uses the standard Navigator Clipboard API
- The "Generated" button styling is controlled via CSS and can be customized

## Clarifications

### Session 2026-04-18

- Q: Timer format → A: Minutes:seconds (e.g., "1:23")
- Q: Missing cl_start_time → A: Show "Generating..."
- Q: "passive job list view" → A: Just one job list exists - same UI shows Generated for ready status
- Q: Timer overflow → A: Cap at "59:59"
- Q: What happens if generation fails? → A: Button returns to "Generate" state, allowing retry

### Update Session 2026-04-18 (Spec Update #2)

**Reason for update**: User provided additional requirements - reduce to one "Generated" button and fix copy to clipboard

- Q: Why two Generated buttons? → A: Need to remove redundant badge, keep only button at end of row
- Q: Copy button not working? → A: Need to verify API endpoint and ensure proper content retrieval

## TDD Requirements (per Constitution)

Before implementation, tests MUST be written covering:

### Button Display Tests
1. Button shows "Generate" when `cl_status` is 'none' and has description
2. Button shows "Generating..." when `cl_status` is 'generating'
3. Button shows green "Generated" when `cl_status` is 'ready'
4. "Generated" button is disabled
5. Only ONE "Generated" indicator appears (button at end of row, NOT badge)

### Timer Tests
6. Timer displays elapsed time during generation
7. Timer updates every second

### Copy to Clipboard Tests
8. Copy button appears only when `cl_status` is 'ready'
9. Clicking copy button copies cover letter to clipboard
10. Visual feedback shows after successful copy
11. Button reverts to normal state after 2 seconds