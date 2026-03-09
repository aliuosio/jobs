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
- Q: How should password fields be handled? → A: Skip password fields entirely (security - avoid credential exposure)
- Q: What fill order/concurrency strategy for batch fills? → A: Sequential with 50-100ms delay (stability - avoid overwhelming forms/API)
- Q: What is the API request timeout? → A: 10 seconds (balanced - allows RAG processing while maintaining responsiveness)
- Q: How should select/checkbox/radio fields be handled? → A: Skip these fields (MVP scope - focus on text-based inputs)

### Session 2026-03-09 (Checklist Resolution)

- Q: What confidence levels for each detection method? → A: `for-id=high, wrapper=high, aria=high, proximity=medium` (explicit mapping)
- Q: What exact delay between batch fills? → A: `75ms` (mid-range of 50-100ms for stability)
- Q: What percentile for 3-second fill timing? → A: `P95` (95% of fills complete within 3 seconds)
- Q: Which job boards for 90% detection testing? → A: `Indeed + LinkedIn` (two largest platforms)
- Q: How to handle `has_data: false` API responses? → A: Show 'no data' visual indicator on field
- Q: How to handle truncated values exceeding maxlength? → A: Append ⚠ warning icon after field value
- Q: How to handle fields with no label but with name/id attribute? → A: Use name/id as fallback label text
- Q: How to handle `contenteditable` elements? → A: Fill with innerText and dispatch input event
- Q: How to handle API errors during batch fill? → A: Show toast notification and continue with remaining fields
- Q: Maximum wait time for dynamic form detection? → A: 10 seconds before considering scan complete
- Q: How to handle select dropdowns? → A: Match option text to API response (case-insensitive substring)

---

## User Stories *(mandatory)*

### User Story 1: Fill Single Form Field (Priority: P1) 🎯 MVP

As a job applicant, I want to automatically fill a single form field with relevant information from my resume so that I can quickly complete job applications.

**Acceptance Scenarios:**
1. **Given** a page with a labeled input field, **When** I activate the extension, **Then** the field is populated with relevant content.
2. **Given** a filled field, **When** the extension populates it, **Then** the value is visible in the UI (not just in the DOM).
3. **Given** a React/Angular form field, **When** the extension fills it, **Then** the framework's state is updated correctly.

### User Story 2: Batch Fill All Form Fields (Priority: P2)

As a job applicant, I want to fill all form fields on a page at once so that I can complete applications efficiently.

**Acceptance Scenarios:**
1. **Given** a page with multiple form fields, **When** I trigger batch fill, **Then** all fields are populated independently without blocking.
2. **Given** a batch fill in progress, **When** API responses arrive, **Then** each field is populated as soon as its response is received.
3. **Given** some fields fail to fill, **When** batch fill completes, **Then** I am notified of successful and failed fields.

### User Story 3: Handle Complex Form Structures (Priority: P3)

As a job applicant, I want the extension to correctly identify form fields even when labels and inputs are not directly associated so that I can fill non-standard forms.

**Acceptance Scenarios:**
1. **Given** a form with labels using `for`/`id` attributes, **When** the extension scans the form, **Then** all pairings are correctly identified.
2. **Given** a form with labels wrapping inputs, **When** the extension scans the form, **Then** all pairings are correctly identified.
3. **Given** a form with no standard label association, **When** the extension scans the form, **Then** best-guess pairing is attempted.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST scan the current page for form field and label pairings.
- **FR-002**: Extension MUST extract label text from `<label>` elements associated with `<input type="text">`, `<input type="email">`, `<input type="tel">`, `<input type="url">`, `<input type="number">`, and `<textarea>` elements.
- **FR-003**: Extension MUST send label text to the backend API via HTTP POST.
- **FR-004**: Extension MUST populate form fields with API responses.
- **FR-005**: Extension MUST dispatch `input` and `change` events with `bubbles: true` after setting values.
- **FR-006**: Extension MUST provide a popup/panel UI for triggering form filling.
- **FR-007**: Extension MUST handle API errors gracefully and notify the user.
- **FR-008**: Extension MUST skip fields that are read-only, disabled, hidden, or password type.
- **FR-009**: Extension MUST work on pages with client-side rendered forms (React, Angular, Vue).
- **FR-010**: Extension MUST only communicate with the configured API endpoint (`http://localhost:8000`).
- **FR-011**: Extension MUST support batch fill mode to fill all detected form fields with one action.
- **FR-012**: Extension MUST use MutationObserver to detect dynamically loaded forms.
- **FR-013**: Extension MUST use Manifest V3 for Firefox extension configuration.
- **FR-014**: Extension MUST fill fields sequentially in DOM order with 75ms delay between fills during batch operations.
- **FR-015**: Extension MUST timeout API requests after 10 seconds with no retry, and notify the user of the failure.
- **FR-016**: Extension MUST support `<select>` dropdowns by matching option text to API response (case-insensitive substring match).
- **FR-017**: Extension MUST use a maximum distance of 50 pixels for proximity-based label detection.
- **FR-018**: Extension MUST assign confidence levels: high (for-id, wrapper, aria-labelledby), medium (proximity, name/id fallback).
- **FR-019**: Extension MUST use a 10-second maximum wait time for dynamic form detection before considering scan complete.
- **FR-020**: Extension MUST display a 'no data' indicator on fields where API returns `has_data: false`.
- **FR-021**: Extension MUST append a ⚠ warning icon after field values that were truncated due to maxlength.
- **FR-022**: Extension MUST support `contenteditable` elements by setting innerText and dispatching input event.
- **FR-023**: Extension MUST show a toast notification for API errors during batch fill and continue with remaining fields.
- **FR-024**: Extension MUST use the `name` or `id` attribute as fallback label text when no label element is associated.

### Key Entities

- **Form Field**: An input element with an associated label that can be auto-filled.
- **Label-Input Pair**: A detected association between a label element and its target input.
- **Fill Request**: A POST request containing the label text sent to the API.
- **Fill Response**: The API response containing the generated answer text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can fill a single form field with one click within 3 seconds (P95).
- **SC-002**: Form fields on React/Angular applications show filled values in the UI after injection.
- **SC-003**: Users are notified within 2 seconds when the API is unavailable.
- **SC-004**: At least 90% of labeled form fields on Indeed and LinkedIn job boards are correctly identified.
- **SC-005**: Batch fill completes a 10-field form within 30 seconds (P95).

## Assumptions

- The user has the backend API running and accessible at the configured endpoint.
- Job application forms use standard HTML form elements (not canvas-based inputs).
- The user has permission to install browser extensions in Firefox.
- Form fields accept text input (file uploads and complex widgets are out of scope).
