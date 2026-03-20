# Feature Specification: Dynamic Form Field Detection

**Feature Branch**: `002-dynamic-field-detection`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "make the extension also catch dynamically loaded form fields. it does not catch them like on this page: https://apply.proxify.io/?uuid=51379ba3-35c9-4190-b7ad-8a9fd28628d3&step=CurrentlyBasedOn"

## Clarifications

### Session 2026-03-19

- Q1: Latency Target → A: No latency bound
- Q2: onFieldDetected payload → A: C (element + metadata in separate args)
- Q3: Latency boundary → A: No explicit boundary
- Q4: Maximum tracked fields → A: B (enforce a limit, e.g., 200)
- Q5: Dynamically removed fields → A: C (re-scan to reconcile)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Field Detection on SPA Forms (Priority: P1)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Field Detection on SPA Forms (Priority: P1)

A user navigates to a job application page (like Proxify) where form fields are loaded dynamically via JavaScript after the initial page load. The fields appear gradually as the user progresses through multi-step forms or when sections expand. The extension must detect these newly appearing fields automatically without requiring a manual re-scan.

**Why this priority**: This is the core problem - the extension currently misses fields that load after initial scan, making it unusable on modern SPA-style job application forms which are increasingly common.

**Independent Test**: Navigate to a page that loads form fields dynamically (e.g., after clicking a button or after a delay). The extension should detect and highlight these fields within 1 second of their appearance.

**Acceptance Scenarios**:

1. **Given** a page with form fields that load 2 seconds after initial page load, **When** the fields appear in the DOM, **Then** the extension detects them and updates the field count automatically
2. **Given** a multi-step form where new fields appear on each step, **When** the user advances to the next step, **Then** the extension detects the new fields without manual intervention
3. **Given** a page with collapsible sections containing form fields, **When** the user expands a section, **Then** the extension detects the newly visible fields
4. **Given** the Proxify application page at the provided URL, **When** the page loads the "Currently Based On" step, **Then** all dynamically loaded fields are detected and available for filling

---

### User Story 2 - Efficient Mutation Handling (Priority: P2)

The extension must handle dynamic field detection efficiently without causing performance degradation on pages with frequent DOM updates. The existing 300ms debounce mechanism should be leveraged for new field detection.

**Why this priority**: Performance matters - poor implementation could slow down user's browser on complex pages.

**Independent Test**: Load a page with 100+ DOM mutations per second. The extension should maintain responsiveness and not cause noticeable lag.

**Acceptance Scenarios**:

1. **Given** a page with rapid DOM changes, **When** multiple mutations occur within 300ms, **Then** the extension processes them in a single batch after the debounce period
2. **Given** a page with 50 dynamically added fields, **When** all fields appear simultaneously, **Then** the extension processes them in a single scan pass
3. **Given** the extension is running, **When** no new fields are added, **Then** the extension does not trigger unnecessary re-scans

---

### User Story 3 - Duplicate Field Prevention (Priority: P3)

When fields are detected multiple times (e.g., due to DOM re-renders or virtual scrolling), the extension must not create duplicate field entries in its tracking list.

**Why this priority**: Ensures data integrity and prevents confusing UX where the same field appears multiple times.

**Independent Test**: Trigger multiple detection events for the same field element. The field should appear only once in the detected fields list.

**Acceptance Scenarios**:

1. **Given** a field that has already been detected, **When** the same field element triggers another detection event, **Then** the field is not added to the list twice
2. **Given** a virtual scrolling list with form fields, **When** fields are re-rendered as the user scrolls, **Then** each unique field is tracked only once

---

### Edge Cases

- What happens when a field is removed from the DOM after being detected? (Current behavior: field remains in list but may fail on fill - acceptable)
- What happens when a field's visibility changes (hidden/shown) after detection? (Fields marked non-fillable when hidden are not affected by this feature)
- What happens when the same input element is moved to a different container? (WeakSet tracking handles this correctly)
- What happens on pages with infinite scroll loading more form fields? (Each new field batch should be detected as it loads)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST detect individual input, textarea, and select elements that are added to the DOM dynamically, regardless of whether they are inside a `<form>` element
- **FR-002**: The extension MUST process newly detected form fields using the existing 300ms debounce mechanism to batch multiple rapid mutations
- **FR-003**: The extension MUST use the existing WeakSet-based deduplication to prevent the same field element from being tracked multiple times
- **FR-004**: The extension MUST apply all existing label detection strategies (for-id, wrapper, aria-labelledby, proximity, name/id fallback) to newly detected fields
- **FR-005**: The extension MUST notify the popup of updated field counts when new fields are detected
- **FR-006**: The extension MUST add visual indicators (jfh-field-detected class) to newly detected fillable fields
- **FR-007**: The extension MUST respect the existing 10-second maximum wait time for form scanning (FR-019 from original spec)
- **FR-008**: The extension MUST handle fields added to any container type (div, section, article, etc.), not just form elements

### Non-Functional Requirements

- **NFR-001**: Field detection MUST complete within 1 second of field appearance in the DOM
- **NFR-002**: The extension MUST NOT cause more than 50ms of main thread blocking during mutation processing
- **NFR-003**: Memory usage MUST NOT grow unbounded - removed elements should be garbage collected via WeakSet

### Key Entities

- **DetectedField**: Represents a form field with its element reference, label, type, fillability status, and signals. Fields are tracked in a WeakSet for memory-efficient deduplication.
- **MutationBatch**: A collection of DOM mutations accumulated during the debounce period, processed together for efficiency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All dynamically loaded form fields on the Proxify test page are detected within 1 second of their appearance
- **SC-002**: The extension detects fields on at least 95% of tested job application pages with dynamic form loading
- **SC-003**: Users can fill multi-step forms without manually triggering re-scan between steps
- **SC-004**: Field detection adds no more than 100ms latency to page interactions during mutation processing
- **SC-005**: Zero duplicate field entries appear when the same field is re-rendered or moved in the DOM

## Assumptions

- The existing `FormObserver` class structure will be extended rather than replaced
- The existing `scanForm()` function in form-scanner.js can accept any container element, not just form elements
- The existing WeakSet deduplication mechanism is sufficient for preventing duplicate field tracking
- The 300ms debounce period is appropriate for batch-processing individual field additions (same as for form additions)
- Content scripts are already running on all URLs (matches: ["<all_urls>"] in manifest.json)
