# Feature Specification: Form QA Field Testing

**Feature Branch**: 001-form-qa-field-testing
**Created**: 2026-03-19
**Status**: Draft
**Input**: Test form field filling for six specific fields: firstname, lastname, email, city, postcode, and street

## Overview

This feature ensures the Qdrant + FastAPI integration can reliably answer simple form field questions (names, addresses) from the form helper. The system uses a RAG pipeline to match form field labels with resume data stored in a vector database.

## User Scenarios & Testing

### User Story 1 - Fill First Name Field (Priority: P1)
**As a** job applicant, I want to automatically fill the first name field in the form.

**Why this priority**: First name is a basic required field and most commonly encountered in job applications.

**Independent Test**: Submit form field label "First Name" with signals indicating text field type. Verify that the API returns the correct field value from the resume data.

**Acceptance Scenarios**:
1. **Given** resume data exists in Qdrant, **When** user submits form with first name label, **Then** the correct value is returned
2. **Given** no resume data exists, **When** user submits form, **Then** an appropriate fallback message is returned

---

### User Story 2 - Fill Last Name Field (Priority: P1)
**As a** job applicant, I want to automatically fill the last name field in the form.

**Why this priority**: Last name is commonly required along with first name for identity verification.

**Independent Test**: Submit form field label "Last Name" with signals indicating text field type. Verify that the API returns the correct field value from the resume data.

**Acceptance Scenarios**:
1. **Given** resume data exists in Qdrant, **When** user submits form with last name label, **Then** the correct value is returned
2. **Given** no resume data exists, **When** user submits form, **Then** an appropriate fallback message is returned

---

### User Story 3 - Fill Email Field (Priority: P1)
**As a** job applicant, I want to automatically fill the email field in the form.

**Why this priority**: Email is essential for contact information in job applications.

**Independent Test**: Submit form field label "Email" with signals indicating text field type. Verify that the API returns the correct field value from the resume data.

**Acceptance Scenarios**:
1. **Given** resume data exists, **When** user submits form with email label, **Then** the correct value is returned
2. **Given** no resume data exists, **When** user submits form, **Then** an appropriate fallback message is returned

---

### User Story 4 - Fill City Field (Priority: P2)
**As a** job applicant, I want to automatically fill the city field in the form.

**Why this priority**: City is commonly requested but less critical than contact information.

**Independent Test**: Submit form field label "City" with signals indicating text field type. Verify that the API returns the correct field value from the resume data.

**Acceptance Scenarios**:
1. **Given** resume data exists, **When** user submits form with city label, **Then** the correct value is returned
2. **Given** no resume data exists, **When** user submits form, **Then** an appropriate fallback message is returned

---

### User Story 5 - Fill Postcode Field (Priority: P2)
**As a** job applicant, I want to automatically fill the postcode field in the form.

**Why this priority**: Postcode is commonly requested for address verification.

**Independent Test**: Submit form field label "Postcode" with signals indicating text field type. Verify that the API returns the correct field value from the resume data.

**Acceptance Scenarios**:
1. **Given** resume data exists, **When** user submits form with postcode label, **Then** the correct value is returned
2. **Given** no resume data exists, **When** user submits form, **Then** an appropriate fallback message is returned

---

### User Story 6 - Fill Street Field (Priority: P2)
**As a** job applicant, I want to automatically fill the street address field in the form.

**Why this priority**: Street address is commonly requested for location details.

**Independent Test**: Submit form field label "Street" with signals indicating text field type. Verify that the API returns the correct field value from the resume data.

**Acceptance Scenarios**:
1. **Given** resume data exists, **When** user submits form with street label, **Then** the correct value is returned
2. **Given** no resume data exists, **When** user submits form, **Then** an appropriate fallback message is returned

---

## Edge Cases

### Edge Case 1 - Missing Resume Data
- **What happens**: User attempts to fill a form field when no resume data has been ingested into Qdrant
- **Expected behavior**: System returns appropriate error message indicating no data available
- **Test**: Submit form field when Qdrant collection is empty
- **Result**: Error response with helpful message

### Edge Case 2 - Ambiguous Field Labels
- **What happens**: Form field label is ambiguous (e.g., "Address" could mean street, city, or postcode)
- **Expected behavior**: System uses semantic search to determine the most likely field type
- **Test**: Submit form with ambiguous label "Address"
- **Result**: System intelligently infers context and returns most relevant field type

### Edge Case 3 - Invalid Email Format
- **What happens**: Resume data contains an email in invalid format
- **Expected behavior**: System validates email format and returns appropriate error if invalid
- **Test**: Submit email field when resume has malformed email
- **Result**: Validation error with clear message

### Edge Case 4 - Missing Optional Fields
- **What happens**: User submits form with only some fields filled (e.g., first name but not last name)
- **Expected behavior**: System successfully fills available fields, returns partial data indicator
- **Test**: Submit form with only first name and last name
- **Result**: Success response with partial fill status

### Edge Case 5 - Malformed Postcode
- **What happens**: Resume data contains postcode with special characters outside allowed format
- **Expected behavior**: System validates postcode format (alphanumeric with spaces/hyphens)
- **Test**: Submit postcode field when resume has malformed postcode
- **Result**: Validation error with clear format requirements

## Requirements

### Functional Requirements

- **FR-001**: The system MUST accept form field labels and signals as input for the /fill-form endpoint
- **FR-002**: The system MUST validate that all six fields (firstname, lastname, email, city, postcode, street) are present in the request payload
- **FR-003**: The system MUST query Qdrant vector database for matching resume data based on the field type
- **FR-004**: The system MUST extract the correct field value from the resume data payload
- **FR-005**: The system MUST validate email format (standard email format with @ symbol)
- **FR-006**: The system MUST validate postcode format (alphanumeric with spaces and hyphens only)
- **FR-007**: The system MUST return appropriate error messages when data is missing or invalid
- **FR-008**: The system MUST handle ambiguous field labels by inferring field type from context

### Non-Functional Requirements

- **NFR-001**: API response time MUST be under 500ms for 95% of requests
- **NFR-002**: System MUST handle up to 10 concurrent requests without degradation
- **NFR-003**: All error messages MUST be user-friendly and actionable
- **NFR-004**: System MUST log all field extraction attempts for debugging
- **NFR-005**: Resume data MUST be stored in Qdrant with appropriate vector indexing for fast retrieval

## Key Entities

### Field Classification Entity
- **field_type**: Enum (first_name, last_name, email, city, zip, street)
- **signals**: Object containing autocomplete, html_type, input_name, label_text

### Resume Data Entity
- **firstname**: String (required)
- **lastname**: String (required)
- **email**: String (required, validated email format)
- **city**: String (required)
- **postcode**: String (required, validated format: alphanumeric with spaces/hyphens)
- **street**: String (required)

## Success Criteria

### Measurable Outcomes
- **SC-001**: Users can successfully fill all six form fields (firstname, lastname, email, city, postcode, street) with correct data in at least 95% of test cases
- **SC-002**: API responds within 500ms for 95% of requests
- **SC-003**: System correctly validates email format (rejects invalid emails in 100% of test cases)
- **SC-004**: System correctly validates postcode format (alphanumeric with spaces/hyphens) in 100% of test cases
- **SC-005**: System returns appropriate error messages when resume data is missing or invalid in 100% of test cases
- **SC-006**: System handles ambiguous field labels correctly (infers field type from context) in at least 90% of test cases

## Assumptions

- Resume data is stored in Qdrant vector database with proper indexing
- Form field signals (autocomplete, html_type, input_name, label_text) provide sufficient context for field type detection
- Email validation uses standard email format (contains @ symbol)
- Postcode validation allows alphanumeric characters, spaces, and hyphens
- System has access to resume data through the existing RAG pipeline
- Form fields are filled one at a time (no batch filling)
- API response time is acceptable (under 500ms)

## Out of Scope

- Batch form filling (multiple forms at once)
- Form field validation beyond the six specified fields
- Resume data management (CRUD operations)
- User interface or browser extension
- Alternative authentication methods
- Data export/import functionality

## Dependencies

- Qdrant vector database running and accessible
- Mistral API for embeddings and generation
- FastAPI framework for API server
- Python 3.8+ runtime environment

## Risks

- **Risk 1**: Qdrant unavailability - Form filling fails completely
- **Risk 2**: Mistral API rate limits - Embedding generation fails
- **Risk 3**: Invalid user input - Poor user experience, potential confusion
- **Risk 4**: Performance degradation under high load - Slow response times

## Mitigation Strategies

- **Qdrant unavailability**: Implement health checks, fallback to cached data
- **Mistral API limits**: Implement retry logic, use local embedding models as backup
- **Invalid user input**: Comprehensive input validation, clear error messages
- **Performance degradation**: Load testing, performance optimization, caching strategies

## Clarifications

### Session 2026-03-19

- Q1: Payload data model → A: Flat fields at top level (firstname, lastname, email, city, postcode, street)
- Q2: Postcode validation → A: alphanumeric with spaces/hyphens allowed (regex: `^[A-Za-z0-9 \\-]+$`)
- Q3: Required fields policy → A: All six fields required
- Q4: Data retention policy → D: Indefinite retention
