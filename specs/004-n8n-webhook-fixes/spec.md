# Feature Specification: n8n Webhook Fixes - Job Application Writer

**Feature Branch**: `004-n8n-webhook-fixes`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: Code review of n8n "Job Application Writer" workflow issues

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Targeted Cover Letter Generation (Priority: P1)

As a system invoking the webhook, I want the workflow to process only the specific job offer requested so that cover letters are generated for the correct position.

**Why this priority**: The webhook receives a specific `job_offers_id` parameter but the workflow ignores it and processes all jobs without letters, causing incorrect behavior.

**Independent Test**: Can be verified by sending a webhook request with a specific job ID and confirming only that job is processed.

**Acceptance Scenarios**:

1. **Given** a webhook request includes `job_offers_id` in the request body, **When** the workflow executes, **Then** the SQL query filters by that specific ID
2. **Given** a webhook request is made for a job that already has a cover letter, **When** the workflow executes, **Then** no duplicate application is created
3. **Given** a webhook request is made for a non-existent job ID, **When** the workflow executes, **Then** the system returns an appropriate error response

---

### User Story 2 - Synchronous Response Handling (Priority: P1)

As a system invoking the webhook, I want to receive the final response only after processing completes so that I know the outcome of the operation.

**Why this priority**: The webhook currently returns immediately ("No item to return was found") before AI processing completes, leaving the caller with incomplete information.

**Independent Test**: Can be verified by triggering the webhook and measuring that the response is only received after the cover letter is saved to the database.

**Acceptance Scenarios**:

1. **Given** a valid webhook request is made, **When** AI processing begins, **Then** the webhook response is delayed until processing completes
2. **Given** the workflow fails during processing, **When** the response is returned, **Then** it contains appropriate error information
3. **Given** the workflow succeeds, **When** the response is returned, **Then** it contains the success status and generated application details

---

### User Story 3 - Clean Workflow Configuration (Priority: P2)

As a workflow maintainer, I want the workflow to have no unused nodes so that the workflow executes cleanly without warnings.

**Why this priority**: The log shows "Unused Respond to Webhook node found in the workflow" which indicates configuration issues.

**Independent Test**: Can be verified by checking workflow execution logs for the unused node warning.

**Acceptance Scenarios**:

1. **Given** the workflow is executed, **When** processing completes, **Then** no "Unused Respond to Webhook" warning appears in the logs
2. **Given** a response is needed, **When** the workflow completes, **Then** the response is sent through the proper mechanism (webhook response mode, not a separate node)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow MUST filter the job offer query by `job_offers_id` from the incoming webhook request body
- **FR-002**: The webhook response mode MUST be configured to wait for full workflow execution before returning ("last node" or "response" mode)
- **FR-003**: The "Respond to Webhook" node MUST either be properly connected in the execution flow or removed from the workflow
- **FR-004**: The webhook MUST properly handle the case when no matching job is found (return appropriate error, not empty success)
- **FR-005**: The workflow MUST create a job application record with the generated cover letter content in the `job_applications` table

### Non-Functional Requirements

- **NFR-001**: Webhook response time MUST include full AI processing time (no premature response)
- **NFR-002**: Generated cover letter content MUST be properly saved to the database with correct encoding

### Key Entities *(include if feature involves data)*

- **WebhookRequest**: Contains `job_offers_id` parameter
- **JobOffer**: The job posting being processed (id, company, email, title, description)
- **JobApplication**: The generated application with cover letter content

---

## Success Criteria *(mandurable)*

### Measurable Outcomes

- **SC-001**: POST request to webhook with specific job_offers_id processes only that job - verified by workflow execution trace
- **SC-002**: Webhook response is only received after database save completes - verified by timing observation
- **SC-003**: No "Unused Respond to Webhook" warnings in workflow execution logs - verified by log inspection
- **SC-004**: Cover letter is saved to job_applications.content for the correct job offer ID - verified by database query

---

## Assumptions

- The n8n workflow is already imported and available in the n8n instance
- Database schema for job_offers and job_applications tables exists and is accessible
- Mistral AI credentials are configured for the workflow
- IMAP credentials are configured for email draft creation
- The webhook endpoint path `/webhook/writer` is available

---

## Out of Scope

- Adding new webhook endpoints
- Modifying the cover letter generation prompt logic
- Changing the frontend that calls the webhook
- Adding new database tables or schema changes

---

## Implementation Notes

### Workflow JSON Analysis

The n8n workflow JSON file (`n8n-workflows/3.Job Application Writer.json`) was analyzed using the n8n workflow JSON schema:

**Structure Validation**: ✅ Valid JSON structure with all required properties

**Identified Issues in Current Workflow**:

1. **Webhook Response Mode Not Set**
   - Current: `responseMode` not configured (defaults to "onReceive")
   - This causes Issue 2: "Webhook returns before processing complete"
   - Fix: Add `"responseMode": "lastNode"` to webhook options

2. **SQL Query Ignores job_offers_id**
   - Current query fetches ALL jobs without applications
   - This causes Issue 1: "Workflow ignores input parameter"
   - Fix: Modify query to accept `job_offers_id` as parameter using `$1` placeholder

3. **Respond to Webhook Partially Connected**
   - Connected from "Loop Over Items" but not from "If1" (true branch)
   - This causes Issue 3: "Unused Respond to Webhook node found"
   - Fix: Either remove the node or ensure all execution paths connect to it properly

### VS Code Integration

Created `.vscode/` configuration for n8n workflow validation:
- `n8n-workflow-schema.json`: JSON Schema for n8n workflows (sourced from n8n-schema-generator)
- `settings.json`: VS Code JSON schema associations
- `n8n.code-snippets`: n8n node code snippets (pre-generated)