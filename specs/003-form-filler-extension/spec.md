# Feature Specification: Form Filler Browser Extension

**Feature Branch**: `003-form-filler-extension`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Firefox WebExtension to scrape form labels, POST to API, inject AI responses with proper DOM events"

## Clarifications

### Session 2026-03-08

- Q: What Firefox extension manifest version should be used? → A: `manifest.json v3` (use Manifest V3 for modern Firefox extensions)
- Q: What UI pattern should trigger form filling? → A: `Popup/panel UI` (dedicated panel that appears when activated)
- Q: What fill mode should the extension support? → A: `Batch fill` (fill all detected fields with one action)
- Q: How should the extension detect dynamically loaded forms? → A: `MutationObserver` (detect DOM changes automatically)
- Q: How should the API endpoint URL be configured? → A: `http://localhost:8000` (fixed to match docker-compose config)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fill Single Form Field (Priority: P1)

As a job applicant, I want to click a button next to a form field and have it automatically filled with relevant information from my resume so that I can complete applications faster.

**Why this priority**: This is the core user interaction that delivers immediate value.

**Independent Test**: Navigate to a job application page with a labeled input field, activate the extension, and verify the field is populated with relevant content.

**Acceptance Scenarios**:

1. **Given** a form field with an associated label, **When** the user triggers auto-fill for that field, **Then** the extension extracts the label text and sends it to the API.
2. **Given** the API returns a valid answer, **When** the extension receives the response, **Then** the input field is populated with the answer text.
3. **Given** a populated field on a React/Angular page, **When** the value is set, **Then** the framework's state is updated (field appears filled in UI).

---

### User Story 2 - Batch Fill All Form Fields (Priority: P2)

As a job applicant, I want to fill all form fields on a page at once so that I can complete entire applications with a single action.

**Why this priority**: Batch filling improves efficiency but depends on single-field filling working correctly first.

**Independent Test**: Navigate to a job application form with multiple fields, trigger batch fill, and verify all fields are populated.

**Acceptance Scenarios**:

1. **Given** a page with multiple form fields and labels, **When** the user triggers batch fill, **Then** all labeled fields are identified and queued for filling.
2. **Given** multiple API requests in progress, **When** responses arrive, **Then** each field is populated independently without blocking others.
3. **Given** some fields fail to fill, **When** batch fill completes, **Then** the user is notified of successful and failed fields.

---

### User Story 3 - Handle Complex Form Structures (Priority: P3)

As a job applicant, I want the extension to correctly identify form fields even when labels and inputs are not directly associated so that all relevant fields can be filled.

**Why this priority**: Edge case handling improves reliability but is not essential for MVP.

**Independent Test**: Test on a form with non-standard label-input associations and verify fields are still identified.

**Acceptance Scenarios**:

1. **Given** a label and input connected by `for`/`id` attributes, **When** the extension scans the form, **Then** the pairing is correctly identified.
2. **Given** a label wrapping an input element, **When** the extension scans the form, **Then** the pairing is correctly identified.
3. **Given** a label and input in proximity but not formally associated, **When** the extension scans the form, **Then** a best-guess pairing is made.

---

### Edge Cases

- What happens when a field has no associated label? (Extension MUST skip the field or use placeholder text)
- What happens when the API is unavailable? (Extension MUST display an error message to the user)
- What happens when a field is read-only or disabled? (Extension MUST skip the field)
- What happens when the API response is too long for the field? (Extension MUST truncate to maxlength and show a visual warning indicator next to the field)
- What happens on pages with dynamic form loading? (Extension MUST re-scan when DOM changes are detected)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST scan the current page for form field and label pairings.
- **FR-002**: Extension MUST extract label text from `<label>` elements associated with `<input>`, `<textarea>`, and `<select>` elements.
- **FR-003**: Extension MUST send label text to the backend API via HTTP POST.
- **FR-004**: Extension MUST populate form fields with API responses.
- **FR-005**: Extension MUST dispatch `input` and `change` events with `bubbles: true` after setting values.
- **FR-006**: Extension MUST provide a popup/panel UI for triggering form filling.
- **FR-007**: Extension MUST handle API errors gracefully and notify the user.
- **FR-008**: Extension MUST skip fields that are read-only, disabled, or hidden.
- **FR-009**: Extension MUST work on pages with client-side rendered forms (React, Angular, Vue).
- **FR-010**: Extension MUST only communicate with the configured API endpoint (`http://localhost:8000`).
- **FR-011**: Extension MUST support batch fill mode to fill all detected form fields with one action.
- **FR-012**: Extension MUST use MutationObserver to detect dynamically loaded forms.
- **FR-013**: Extension MUST use Manifest V3 for Firefox extension configuration.

### Key Entities

- **Form Field**: An input element with an associated label that can be auto-filled.
- **Label-Input Pair**: A detected association between a label element and its target input.
- **Fill Request**: A POST request containing the label text sent to the API.
- **Fill Response**: The API response containing the generated answer text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can fill a single form field with one click within 3 seconds.
- **SC-002**: Form fields on React/Angular applications show filled values in the UI after injection.
- **SC-003**: Users are notified within 2 seconds when the API is unavailable.
- **SC-004**: At least 90% of labeled form fields on common job boards are correctly identified.
- **SC-005**: Batch fill completes a 10-field form within 30 seconds.

## Assumptions

- The user has the backend API running and accessible at the configured endpoint.
- Job application forms use standard HTML form elements (not canvas-based inputs).
- The user has permission to install browser extensions in Firefox.
- Form fields accept text input (file uploads and complex widgets are out of scope).
