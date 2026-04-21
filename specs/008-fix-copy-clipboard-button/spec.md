# Feature Specification: Fix Copy to Clipboard Button

**Feature Branch**: `[008-fix-copy-clipboard-button]`
**Created**: 2026-04-21
**Status**: Implemented
**Input**: User description: "the copy to clipborad buttin in the extenion 1. Gives not optical feedback 2. onClick the job application letter is not copied to clipboard"

## Clarifications

### Session 2026-04-21 (Initial Clarifications)

- Q: How should the extension handle insecure (non-HTTPS) contexts? → A: Graceful degradation; detect context type and show clear error with instructions to use HTTPS
- Q: What is the complete state machine for cover letter generation? → A: 3-state model: `null` → `generating` → `ready` (errors handled via retry flag)
- Q: How should rapid clicks be handled? → A: Debounce: disable button during copy, re-enable after completion

### Session 2026-04-21 (Clarify Phase)

- Q: What field name does the backend API return for cover letter content? → A: Field is `content`
- Q: Which status value should be checked for "ready to copy"? → A: Use `completed` - matches existing API response
- Q: Should copy button have keyboard accessibility? → A: No - Keyboard nav handled at popup level
- Q: Where to display error messages? → A: Show in message area below job link - uses existing extension pattern
- Q: Error message display duration? → A: Use 2 seconds for both success and error - consistent UX

### Implementation Update (2026-04-21)

**API Response States Verified:**
- `status: 'completed'` - Cover letter is ready, content available in `status.content` field
- `status: 'processing'` - Cover letter generation in progress
- `status: 'none'` - No job application exists for this job offer

**Implementation Details:**
- Uses `showToggleError()` to display error messages (existing extension pattern)
- Button state tracked via `copyButtonState` Map (per-button state)
- Visual states: `.copied` (success green), `.copying` (disabled gray), `.copy-error` (error red)

### Extended Requirement: Pre-existing Cover Letters (2026-04-21)

**New Requirement**: When fetching job offers, the system MUST check if a job application with cover letter already exists. If it does, the copy button MUST display in "generated" state (green) immediately without requiring user to regenerate.

**Implementation Approach**:
- Fetch job offers AND associated job applications in one call, OR
- Batch check job applications after fetching job offers
- Mark jobs with existing `job_applications` entries as having `cl_status: 'ready'`

**User Flow**:
1. User opens popup
2. System fetches job offers
3. For each job offer, check if corresponding job application exists with content
4. If content exists, set button to "Generated" (green) state
5. User can click to copy immediately

### UI Layout Update: Notification Area Position (2026-04-21)

**Current Behavior**: Error/success messages appear ABOVE job listing (`elements.jobLinksList.parentElement.insertBefore(msgEl, elements.jobLinksList)`)

**Required Behavior**: Messages should appear BELOW job listing for better visibility after user actions

**Implementation Change**:
- Instead of `parentElement.insertBefore(msgEl, elements.jobLinksList)`, use `parentElement.insertBefore(msgEl, null)` or append to job list container
- Alternative: Show messages below the last job item in the list

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Copy Cover Letter to Clipboard (Priority: P1)

As a user who has generated a cover letter for a job application, I want to copy the cover letter to my clipboard with a single click so that I can easily paste it into application forms or emails.

**Why this priority**: This is the core functionality of the copy button - users cannot complete their job application workflow without being able to copy the generated cover letter.

**Independent Test**: Can be fully tested by:
1. Having a job with generated cover letter (cl_status = 'ready')
2. Clicking the copy button
3. Verifying the content is in clipboard (paste elsewhere to verify)

**Acceptance Scenarios**:

1. **Given** a job has a generated cover letter, **When** user clicks the copy button, **Then** the cover letter text should be copied to system clipboard and visual feedback should appear
2. **Given** a job does NOT have a generated cover letter, **When** user clicks the copy button, **Then** the button should not be visible (covered by FR-002)
3. **Given** copy is in progress, **When** user clicks the copy button again, **Then** the action should be prevented or debounced
4. **Given** clipboard API fails or is denied, **When** user clicks the copy button, **Then** an error message should be displayed
5. **Given** a job already has a cover letter from previous generation, **When** popup loads, **Then** the copy button should show in "generated" (green) state immediately
6. **Given** a copy action succeeds, **When** user sees feedback, **Then** the message appears below the job list, not above

---

### User Story 2 - Visual Feedback on Copy (Priority: P1)

As a user clicking the copy button, I want to see clear visual confirmation that the copy was successful so that I know I can proceed to paste the content.

**Why this priority**: Without feedback, users cannot confirm the copy action completed successfully.

**Independent Test**: Can be fully tested by clicking copy and observing button state change for 2 seconds.

**Acceptance Scenarios**:

1. **Given** copy is initiated, **When** user clicks copy button, **Then** button should immediately show success indicator (checkmark)
2. **Given** copy succeeded, **When** 2 seconds pass, **Then** button should revert to original state
3. **Given** copy failed, **When** error occurs, **Then** error message should be displayed for 2 seconds

---

### Edge Cases

- **Non-HTTPS context**: Detected and handled via graceful degradation with error message
- **Very long cover letters (>10KB)**: Copy should complete; if API limits, truncate with "..." indicator
- **Rapid clicks**: Button disabled during copy operation, re-enabled after completion
- **Processing state**: When `status.status === 'processing'`, show hourglass and wait message
- **Button state persistence**: Each job link has independent button state via Map

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to copy generated cover letter text to system clipboard when `status.status` is 'completed'
- **FR-002**: System MUST only show copy button when cover letter has been generated (cl_status = 'ready')
- **FR-003**: System MUST provide immediate visual feedback when copy button is clicked (success indicator)
- **FR-004**: System MUST display error message when clipboard copy fails or API returns error
- **FR-005**: System MUST retrieve cover letter content from `/job-applications?job_offer_id={id}` endpoint
- **FR-006**: System MUST handle 'processing' state with visual indicator (hourglass) and wait message
- **FR-007**: System MUST disable button during copy operation to prevent rapid clicks
- **FR-008**: System MUST check for pre-existing cover letters when loading jobs and show copy button in "generated" state if cover letter exists
- **FR-009**: System MUST display success/error messages below the job listing, not above it

### Key Entities *(include if feature involves data)*

- **Cover Letter**: Generated text content for a job application, stored in the backend
- **Job Offer**: The job posting entry that may have an associated cover letter
- **Copy Button**: UI element in the extension popup that triggers clipboard copy

### State Machine *(explicit)*

| State | Transition Trigger | Next State |
|-------|-------------------|------------|
| `null` | Generation requested | `generating` |
| `generating` | Generation complete | `ready` |
| `generating` | Generation failed | `null` (retry flag set) |
| `ready` | User requests regeneration | `generating` |

- **Copy Button Visibility**: Only visible when `cl_status === 'ready'`

### API Response State Machine *(verified implementation)*

| status.status Value | Meaning | User Feedback |
|------------------|---------|-------------|
| `'completed'` | Letter ready in `status.content` | Green checkmark, enable paste |
| `'processing'` | Still generating | Hourglass, "still generating" message |
| `'none'` | No application yet | No button shown |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully copy cover letter to clipboard in 100% of attempts when letter is generated
- **SC-002**: Visual feedback appears within 200ms of button click
- **SC-003**: Error feedback appears within 1 second when copy fails
- **SC-004**: 95% of users successfully copy cover letter on first attempt without errors

## Assumptions

- Backend will provide valid cover letter content via existing or new endpoint
- Extension runs in context where navigator.clipboard.writeText is permitted

## Security & Privacy

- **Context Detection**: Extension MUST detect if running in secure (HTTPS) or insecure (HTTP) context
- **Insecure Handling**: When insecure context is detected:
  1. Copy button SHOULD still be visible (not hidden)
  2. On click, display clear error message: "Clipboard access requires a secure connection. Please ensure you're accessing this page over HTTPS."
  3. Provide instruction link or tooltip explaining how to verify/use HTTPS
- **Graceful Degradation**: Never fail silently; always provide actionable feedback