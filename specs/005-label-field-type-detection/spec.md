# Feature Specification: Label-Based Field Type Detection

**Feature Branch**: `005-label-field-type-detection`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Enhance extension to use labels (not just input names) to detect field type, enabling better API field classification"

---

## Overview

This specification describes enhancements to the Job Forms Helper extension to extract and transmit **all available signals** from form fields to the backend API. The API will then classify the semantic field type based on these enriched signals, improving the accuracy of resume-to-field matching.

### Current State

The extension currently extracts:
- Label text (via for-id, wrapper, aria, proximity detection)
- Input element type (`text`, `email`, `tel`, `textarea`, etc.)
- Input `name` attribute

The `field_type` parameter sent to the API is just the HTML element type, not a semantic type.

### Proposed Enhancement

Extract **all available signals** from form fields and send them to the API:
- Label text (existing)
- Input `name` attribute (existing)
- Input `id` attribute (existing)
- **NEW**: `placeholder` attribute text
- **NEW**: `aria-label` attribute
- **NEW**: `autocomplete` attribute (standardized hint)
- **NEW**: Associated `<label>` element's additional attributes
- **NEW**: Nearby hint text (descriptive text near the field)

The API will classify the semantic field type (e.g., `first_name`, `email`, `phone`) based on these signals.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1: Improved Email Field Detection (Priority: P1)

As a job applicant, I want the extension to correctly identify email fields even when they have unusual labels like "Your Email Address" or "Contact Email" so that my email is filled correctly.

**Why this priority**: Email is the most critical contact field; incorrect email matching causes application failures.

**Independent Test**: Test on a page with an email field labeled "Your Email Address" with `autocomplete="email"`. Verify the API receives all signals and returns correct email data.

**Acceptance Scenarios**:

1. **Given** a form with `<input type="text" name="user_email" placeholder="Enter your email" autocomplete="email">` and label "Your Email Address", **When** the extension scans the form, **Then** all signals (label="Your Email Address", name="user_email", placeholder="Enter your email", autocomplete="email") are sent to the API.
2. **Given** an email field with only `placeholder="email@domain.com"`, **When** the extension scans the form, **Then** the placeholder text is included as a signal.
3. **Given** an email field with `aria-label="Email Address for Correspondence"`, **When** the extension scans the form, **Then** the aria-label is included as a signal.

---

### User Story 2: Phone Number Field Detection (Priority: P1)

As a job applicant, I want the extension to detect phone fields regardless of labeling variations ("Phone", "Mobile", "Cell Number", "Contact Number") so my phone number is filled correctly.

**Why this priority**: Phone numbers are critical for recruiter contact; misclassification leads to missed opportunities.

**Independent Test**: Test on pages with phone fields labeled variously as "Phone", "Mobile", "Cell", "Contact Number". Verify signals are captured and API returns phone data.

**Acceptance Scenarios**:

1. **Given** a form with `<input type="tel" name="mobile" placeholder="+49..." autocomplete="tel">` and label "Cell Number", **When** the extension scans the form, **Then** all signals are sent to the API including the `tel` input type hint.
2. **Given** a phone field with `name="contact_number"` but no explicit label, **When** the extension scans the form, **Then** the name attribute is included as a signal for type classification.
3. **Given** a phone field with `autocomplete="tel-national"`, **When** the extension scans the form, **Then** the autocomplete attribute signals a phone field type.

---

### User Story 3: Name Field Disambiguation (Priority: P2)

As a job applicant, I want the extension to correctly distinguish between first name, last name, and full name fields based on label context, even when labels are ambiguous.

**Why this priority**: Name fields are on every application; mixing up first/last name causes professional embarrassment.

**Independent Test**: Test on a form with fields labeled "Name", "First Name", "Last Name", "Full Name". Verify signals differentiate them appropriately.

**Acceptance Scenarios**:

1. **Given** a form with two adjacent fields labeled "First Name" and "Last Name", **When** the extension scans the form, **Then** each field's label is sent as a distinct signal allowing API to classify appropriately.
2. **Given** a single field labeled just "Name" with `autocomplete="name"`, **When** the extension scans the form, **Then** the autocomplete attribute signals this is a full name field.
3. **Given** a field labeled "Name" adjacent to "Given Name" and "Family Name" labels in DOM order, **When** the extension scans the form, **Then** DOM context (sibling fields) is NOT required - individual field signals suffice.

---

### User Story 4: URL/Link Field Detection (Priority: P2)

As a job applicant, I want the extension to detect LinkedIn, GitHub, and portfolio URL fields so my professional profiles are filled correctly.

**Why this priority**: Professional links differentiate candidates; wrong URLs or missing links reduce application quality.

**Independent Test**: Test on forms with fields for LinkedIn, GitHub, Portfolio URL. Verify signals capture the specific platform context.

**Acceptance Scenarios**:

1. **Given** a field labeled "LinkedIn Profile" with `placeholder="https://linkedin.com/in/..."`, **When** the extension scans the form, **Then** both label and placeholder signals indicate LinkedIn URL type.
2. **Given** a field labeled "GitHub" with `name="github_url"`, **When** the extension scans the form, **Then** both label and name signals indicate GitHub URL type.
3. **Given** a field labeled "Portfolio/Website" with `type="url"`, **When** the extension scans the form, **Then** the input type `url` is included as a signal.

---

### User Story 5: Work Experience Field Detection (Priority: P3)

As a job applicant, I want the extension to detect fields asking for years of experience, job titles, and company names so my work history is matched correctly.

**Why this priority**: Work experience fields vary greatly; improved signals help but are less critical than contact info.

**Independent Test**: Test on forms with "Years of Experience", "Job Title", "Company" fields. Verify signals capture the context.

**Acceptance Scenarios**:

1. **Given** a field labeled "Years of Experience" with `type="number"`, **When** the extension scans the form, **Then** label and input type signals are sent to API.
2. **Given** a field labeled "Current Job Title" with `autocomplete="organization-title"`, **When** the extension scans the form, **Then** the autocomplete attribute signals job title type.
3. **Given** a field labeled "Company" with `name="employer_name"`, **When** the extension scans the form, **Then** both label and name signals indicate company/employer type.

---

### Edge Cases

- **What happens when a field has no label, no name, no placeholder, no aria-label?** → Use `id` attribute as fallback signal; if no id, generate low-confidence signal based on position/context.
- **What happens when label text contradicts autocomplete attribute?** → Send both signals; let API resolve conflicts (autocomplete is more standardized).
- **What happens with non-English labels?** → Send raw label text; API handles internationalization.
- **What happens with dynamically generated labels (e.g., via JavaScript)?** → Already handled by existing MutationObserver; signals are extracted at scan time.
- **What happens when placeholder contains example text (e.g., "John Doe")?** → Send placeholder as-is; API can interpret example patterns.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Signal Extraction

- **FR-001**: Extension MUST extract the `placeholder` attribute from input elements and include it in API requests.
- **FR-002**: Extension MUST extract the `aria-label` attribute from input elements and include it in API requests.
- **FR-003**: Extension MUST extract the `autocomplete` attribute from input elements and include it in API requests.
- **FR-004**: Extension MUST include the `id` attribute as a signal (already captured but not explicitly sent to API).
- **FR-005**: Extension MUST extract text from associated `<label>` elements including any `title` attribute on the label.
- **FR-006**: Extension MUST extract hint text from sibling elements with common hint classes (e.g., `.hint`, `.help-text`, `.field-description`, `[aria-describedby]` targets).

#### Signal Prioritization

- **FR-007**: Extension MUST assign signal priority weights: `label` (primary), `autocomplete` (high), `aria-label` (high), `placeholder` (medium), `name` (medium), `id` (low).
- **FR-008**: Extension MUST NOT perform semantic classification client-side; all signals are sent to API for classification.
- **FR-009**: Extension MUST include signal source metadata (which attributes were present) for API debugging.

#### Data Model Updates

- **FR-010**: Extension MUST update `FormField` interface to include new signal fields.
- **FR-011**: Extension MUST update `FillRequest` payload to include structured signals object.
- **FR-012**: Extension MUST maintain backward compatibility with existing API contract (signals are optional/additive).

#### Performance

- **FR-013**: Signal extraction MUST NOT add more than 5ms per field to scan time.
- **FR-014**: Signal extraction MUST NOT cause additional DOM reflows (use cached computed styles where possible).
- **FR-015**: Signal extraction MUST gracefully handle missing attributes without errors.

#### Error Handling

- **FR-016**: Extension MUST continue scanning if signal extraction fails on a single field.
- **FR-017**: Extension MUST log signal extraction failures for debugging without blocking user flow.
- **FR-018**: Extension MUST sanitize signal text (trim whitespace, limit length to 500 chars).

---

### Key Entities

#### FieldSignals (NEW)

Represents all extractable signals from a form field for type classification.

```typescript
interface FieldSignals {
  // Primary signal - highest priority
  label: {
    text: string;              // Label text content
    title?: string;            // Label title attribute
    confidence: 'high' | 'medium' | 'low';
    source: 'for-id' | 'wrapper' | 'aria-labelledby' | 'proximity' | 'name-id-fallback';
  } | null;
  
  // High priority signals
  autocomplete?: string;       // autocomplete attribute value
  ariaLabel?: string;          // aria-label attribute
  
  // Medium priority signals
  placeholder?: string;        // placeholder attribute
  name?: string;               // name attribute
  
  // Low priority signals
  id?: string;                 // id attribute
  
  // Contextual signals
  hint?: string;               // Help text from aria-describedby or sibling hint elements
  
  // Metadata
  htmlType: string;            // Original HTML input type (text, email, tel, etc.)
}
```

#### EnhancedFillRequest (UPDATED)

Extended request payload with structured signals.

```typescript
interface EnhancedFillRequest {
  // Original fields (backward compatible)
  label: string;               // Primary label text (for backward compat)
  
  // NEW: Structured signals for API classification
  signals: FieldSignals;
  
  // Optional metadata
  context_hints?: string;
  form_url?: string;
  page_url?: string;
}
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Field type classification accuracy improves by at least 20% (measured by API response `has_data: true` rate for known field types).
- **SC-002**: Signal extraction adds no more than 50ms total scan time for pages with up to 50 form fields.
- **SC-003**: At least 95% of form fields on Indeed and LinkedIn job boards have at least 2 signals extracted (label + one other).
- **SC-004**: Zero regression in existing field detection functionality (all existing tests pass).
- **SC-005**: API can correctly classify field types for 90% of common job application fields (email, phone, name variants, URLs, experience).

### Quality Metrics

- **SC-006**: Signal extraction code coverage ≥ 80%.
- **SC-007**: No console errors during normal scanning operations.
- **SC-008**: Memory usage increase ≤ 5% compared to pre-enhancement baseline.

---

## Assumptions

- The backend API will be updated to process the new `signals` payload structure.
- The API will handle signal prioritization and conflict resolution.
- Job application forms use standard HTML attributes (autocomplete, aria-label, placeholder).
- The API has logic to interpret non-English labels and international phone formats.
- Backward compatibility is required for API version transitions.

---

## Dependencies

### Upstream Dependencies

- **003-form-filler-extension**: Base extension implementation must be stable.
- **002-rag-backend**: API must be updated to accept and process `signals` payload.

### Downstream Impact

- API contract changes require coordinated deployment.
- Popup UI may need updates to display signal information for debugging.

---

## Out of Scope

- Client-side semantic field type classification (remains API responsibility).
- Machine learning or AI-based signal extraction.
- Signal caching or persistence across page navigations.
- Custom signal configuration by end users.
- Signal extraction for non-text inputs (file, color, range).

---

## Implementation Notes

### Signal Extraction Algorithm

```
For each detected form field:
  1. Extract label (existing logic in form-scanner.js)
  2. Extract placeholder attribute
  3. Extract aria-label attribute
  4. Extract autocomplete attribute
  5. Extract name attribute (already captured)
  6. Extract id attribute (already captured)
  7. Find hint text:
     a. Check aria-describedby, resolve target element
     b. Look for sibling with hint classes
  8. Build FieldSignals object
  9. Sanitize all text values
  10. Include in FormField data
```

### Files to Modify

| File | Changes |
|------|---------|
| `extension/content/signal-extractor.js` | NEW: Signal extraction utility functions |
| `extension/content/form-scanner.js` | Add signal extraction functions, update `createFormField()` |
| `extension/content/api-client.js` | Update `fetchToBackend()` to include `signals` payload |
| `extension/content/content.js` | Update `handleDetectFields()` to include signals in response |
| `extension/background/background.js` | Update message handlers to pass `signals` |
| `extension/popup/popup.js` | Optionally display signal info in UI |
| `specs/003-form-filler-extension/data-model.md` | Document new `FieldSignals` interface |

### New Files to Create

| File | Content |
|------|---------|
| `extension/content/signal-extractor.js` | Signal extraction utility functions |
| `specs/005-label-field-type-detection/data-model.md` | Data model documentation |
| `specs/005-label-field-type-detection/checklists/signal-extraction.md` | Implementation checklist |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API not updated to handle signals | Medium | High | Make signals optional in payload; graceful degradation |
| Signal extraction causes performance regression | Low | Medium | Profile and optimize; set strict time budgets |
| Conflicting signals confuse API | Medium | Medium | Include signal priority metadata; API handles resolution |
| Non-standard form structures missing signals | Medium | Low | Fall back to existing label-based detection |

---

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Signal extraction implementation | 2-3 hours | `signal-extractor.js` module |
| Integration with form scanner | 1-2 hours | Updated `form-scanner.js` |
| API client updates | 1 hour | Updated `api-client.js`, `background.js` |
| Testing on job boards | 2 hours | Test results documentation |
| Documentation | 1 hour | Updated data model, README |

**Total Estimated Effort**: 7-9 hours
