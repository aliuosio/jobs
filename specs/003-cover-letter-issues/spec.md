# Feature Specification: Cover Letter Generation Issues

**Feature Branch**: `003-cover-letter-issues`  
**Created**: 2025-04-17  
**Status**: Draft  
**Input**: Code review of cover letter generation feature + new webhook configuration for cover letter generation

**Implementation Requirements**:
- Use Docker to run backend services and tests
- Write tests before implementation (TDD approach)
- Run tests via `docker compose exec` commands

**Webhook Configuration**:
- **Host URL**: `http://localhost:5678/webhook-test/writer`
- **Container URL**: `http://n8n:5678/webhook-test/writer`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Letter Status Check (Priority: P1)

As a user generating a cover letter, I want to receive accurate status information so that I know when my cover letter is ready.

**Why this priority**: Users rely on the status check to know when to view their generated cover letter. Incorrect status information leads to confusion and poor user experience.

**Independent Test**: Can be verified by making a status check request for a non-existent job offer ID and confirming the system returns appropriate feedback.

**Acceptance Scenarios**:

1. **Given** a user requests letter status for a valid job offer with a generated letter, **When** the status check is called, **Then** the system returns `{"letter_generated": true}`
2. **Given** a user requests letter status for a valid job offer without a generated letter, **When** the status check is called, **Then** the system returns `{"letter_generated": false}`
3. **Given** a user requests letter status for a non-existent job offer, **When** the status check is called, **Then** the system returns a 404 error (not found) instead of misleading `false`

---

### User Story 2 - Cache Synchronization (Priority: P2)

As a user who just triggered cover letter generation, I want the system to reflect the correct status so that I don't have to manually refresh.

**Why this priority**: Users expect immediate feedback after triggering generation. Stale cached values create confusion about whether generation started.

**Independent Test**: Can be verified by triggering generation and immediately checking if the status reflects the correct state without manual cache clearing.

**Acceptance Scenarios**:

1. **Given** a user triggers cover letter generation, **When** the generation starts, **Then** the status cache is invalidated or refreshed to reflect the correct state
2. **Given** a user polls for completion after triggering generation, **When** polling occurs, **Then** the system fetches fresh status instead of using stale cached values

---

### User Story 3 - Error Visibility (Priority: P2)

As a user experiencing a problem with cover letter generation, I want to see error feedback so that I know something went wrong.

**Why this priority**: Silent failures leave users confused about why their cover letter isn't generating. Visible errors help users understand when to retry or seek help.

**Independent Test**: Can be verified by simulating a polling failure and confirming error state is displayed to the user.

**Acceptance Scenarios**:

1. **Given** the status polling fails after multiple retries, **When** the error occurs, **Then** the user sees a visual indication that something went wrong (error badge or message)
2. **Given** the status polling recovers after a failure, **When** recovery occurs, **Then** the error indicator is cleared and normal status is displayed

---

### User Story 4 - Webhook URL Environment Selection (Priority: P2)

The application automatically selects the appropriate webhook URL based on whether it's running on the host or inside a container to ensure connectivity works in both development and production environments.

**Why this priority**: The feature needs to work both locally (host) and in containerized environments with different network configurations.

**Independent Test**: Can be verified by running the application in both host mode and container mode, confirming the correct URL is used.

**Acceptance Scenarios**:

1. **Given** the application runs outside a container, **When** cover letter generation is triggered, **Then** the system uses `http://localhost:5678/webhook-test/writer`
2. **Given** the application runs inside a container, **When** cover letter generation is triggered, **Then** the system uses `http://n8n:5678/webhook-test/writer`

---

### Edge Cases

- What happens when the webhook times out?
- How does the system handle malformed responses from the webhook?
- What if both host and container URLs are unreachable?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Status check endpoint MUST return 404 when the job offer doesn't exist (consistent with other endpoints like DELETE and PATCH)
- **FR-002**: Status cache MUST be invalidated or refreshed when cover letter generation is triggered
- **FR-003**: Polling for completion status MUST fetch fresh data from the API instead of relying on potentially stale cache
- **FR-004**: Polling failures after multiple retries MUST display error state in the UI (error badge or message)
- **FR-005**: The `job_applications` table schema MUST include a `content` column for the letter content query to work correctly
- **FR-006**: Cover letter generation webhook MUST use `http://localhost:5678/webhook/writer` when running on the host machine
- **FR-007**: Cover letter generation webhook MUST use `http://n8n:5678/webhook/writer` when running inside a container
- **FR-008**: The system MUST detect environment (host vs container) to select the appropriate webhook URL

### Non-Functional Requirements

- **NFR-001**: Status check response time MUST be under 500ms (user-perceived latency)
- **NFR-002**: Cache invalidation MUST happen immediately when generation is triggered (no delay)

### Key Entities *(include if feature involves data)*

- **JobOffer**: Represents a job posting with id, title, URL, description
- **JobApplication**: Represents an application with content (cover letter) linked to job_offer
- **LetterStatus**: Represents the current state of cover letter generation (generated/not generated)
- **WebhookConfig**: Configuration defining the webhook URLs for different environments

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Non-existent job offer ID returns 404 (not `{"letter_generated": false}`) - verified by API test
- **SC-002**: Status cache is cleared within 100ms of triggering generation - verified by timing test
- **SC-003**: Poll failures after 3 consecutive errors show error state to user - verified by UI test
- **SC-004**: Database query for letter status works correctly - verified by schema validation test
- **SC-005**: System correctly uses host or container webhook URL based on environment - verified by environment test
- **SC-006**: Cover letter generation completes within 60 seconds - verified by API test

## Assumptions

- Implementation uses Docker to run backend services and execute tests
- Tests are written first (TDD approach) before implementation
- Tests run via `docker compose exec api-backend pytest` commands
- The `job_applications` table has a `content` column that stores the generated cover letter text
- The existing n8n workflow integration remains unchanged - only fixing frontend/backend issues
- Error badge display follows existing UI patterns in the extension
- Partial test coverage exists and will be extended to cover these fixes
- The application can detect whether it's running inside a container (e.g., via environment variables)

---

## Clarifications

### From Code Review Analysis

The following issues were identified in the code review that this specification addresses:

1. **MEDIUM** - Letter status endpoint doesn't validate job offer exists (returns `false` instead of 404)
2. **MEDIUM** - `job_applications` table schema not verified (potential missing `content` column)
3. **LOW** - `letterStatusCache` may become stale after generation triggered
4. **LOW** - Polling failures not surfaced to user (silent warnings only)
5. **LOW** - Description field not required in API validation (works as intended, no change needed)

### Webhook Configuration

6. **HIGH** - Configure webhook URLs for host and container environments:
   - Host: `http://localhost:5678/webhook-test/writer`
   - Container: `http://n8n:5678/webhook-test/writer`

---

## Out of Scope

- Adding new n8n workflow endpoints or changing the workflow itself
- Modifying the job offer creation or update flow beyond status checks