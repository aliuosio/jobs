# Feature Specification: Extension Refactoring — Remove Dead Code & Apply SOLID Principles

**Feature Branch**: `1000-extension-refactor`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "refactor @extension/ folder removing obsolete and unused files and functions or vars. refactor following SOLID principles"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extension Functionality Preserved After Refactoring (Priority: P1)

The extension continues to detect form fields, fill them via the backend API, and manage job links without any regression in behavior.

**Why this priority**: Refactoring must not break existing user-facing functionality. This is the primary validation gate.

**Independent Test**: After each refactoring change, load the extension in Firefox, scan a test form page, verify fields are detected and fillable, and confirm the popup displays job links correctly.

**Acceptance Scenarios**:

1. **Given** a job application form page, **When** the user clicks "Scan Page" in the extension popup, **Then** all fillable form fields are detected with correct labels and signals.
2. **Given** detected fields, **When** the user clicks "Fill All Fields", **Then** fields are filled with API responses and visual indicators update correctly.
3. **Given** the popup is open, **When** the user switches to the "Job Links" tab, **Then** job links are listed and clicking a link navigates to that job page.
4. **Given** the extension is running, **When** a job's applied status is toggled in the popup, **Then** the status persists across popup restarts.

---

### User Story 2 - Dead Code Removed (Priority: P2)

Unused files, functions, and variables are identified and removed, reducing the codebase footprint and improving maintainability.

**Why this priority**: Dead code creates confusion for future developers, increases cognitive load during code review, and may hide real bugs.

**Independent Test**: Static code analysis (grep for function names) confirms removed code is not referenced anywhere in the extension.

**Acceptance Scenarios**:

1. **Given** the refactored extension, **When** `grep -r "getDummyJobLinks" extension/` is run, **Then** no matches are found.
2. **Given** the refactored extension, **When** `grep -r "getAllJobLinks" extension/` is run, **Then** no matches are found.
3. **Given** the refactored extension, **When** `grep -r "filterNotAppliedLinks" extension/` is run, **Then** no matches are found.
4. **Given** the refactored extension, **When** `grep -r "getJobOffersFromMap" extension/` is run, **Then** no matches are found.
5. **Given** the refactored extension, **When** `grep -r "handleScanPage" extension/` is run, **Then** no matches are found.
6. **Given** the refactored extension, **When** `grep -r "handleFieldFilled" extension/` is run, **Then** no matches are found outside the message handler switch case stub.
7. **Given** the refactored extension, **When** the file `extension/content/api-client.js` is checked, **Then** it no longer exists.
8. **Given** the refactored extension, **When** `grep -r "migrateStorageIfNeeded" extension/popup/popup.js` is run, **Then** no matches are found.

---

### User Story 3 - SOLID Principles Applied (Priority: P3)

The codebase is restructured to follow SOLID principles, reducing duplication, improving cohesion, and clarifying responsibilities.

**Why this priority**: Better code organization makes future feature development faster and less error-prone. Reduces risk of bugs from duplicated logic.

**Independent Test**: Code review confirms no duplicated logic patterns and each module has a clear single responsibility.

**Acceptance Scenarios**:

1. **Given** the refactored extension, **When** `getFieldType()` is needed in the content scripts, **Then** it is defined once in a shared utility location and imported by all consumers (not duplicated in both `form-scanner.js` and `signal-extractor.js`).
2. **Given** the refactored extension, **When** `isElementFillable()` is needed across modules, **Then** it is defined once and reused (not duplicated in both `form-scanner.js` and `form-observer.js`).
3. **Given** the refactored extension, **When** the SSE endpoint is configured, **Then** it uses the correct path `/job-offers/stream` matching the backend API.

---

### Edge Cases

- What happens when a developer adds a new feature that depends on removed dead code? — Pre-commit hooks or ESLint rules should flag unused exports.
- How does the refactoring affect the extension's backward compatibility with stored data? — Migration logic for `browser.storage.local` is preserved if it existed; dead migration helpers are removed.
- What if the SSE endpoint path fix breaks an older backend version? — The SSE feature is optional (real-time sync); if the stream endpoint is unreachable, the extension falls back to polling via `GET_JOB_OFFERS`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST retain all currently working functionality (form scanning, field filling, job link display, applied status toggle) after refactoring.
- **FR-002**: The extension MUST NOT include any file that is never imported or executed at runtime.
- **FR-003**: The extension MUST NOT include any named function that is never called by any other function.
- **FR-004**: Each content script module (form-scanner, field-filler, signal-extractor, form-observer, content) MUST have a single, focused responsibility.
- **FR-005**: Shared utility logic (getFieldType, isElementFillable, generateSelector) MUST be defined once and reused across modules.
- **FR-006**: Any hardcoded API paths in the extension MUST match the actual backend API routes.
- **FR-007**: Removed code MUST be confirmed unreachable via grep before deletion.

### Key Entities *(include if feature involves data)*

- **Extension Manifest**: `manifest.json` — Declares which JS files load. Updated to remove references to deleted files.
- **Content Scripts**: `content.js`, `form-scanner.js`, `field-filler.js`, `signal-extractor.js`, `form-observer.js` — Core form automation logic.
- **Background Script**: `background.js` — Message routing, API calls, SSE, storage.
- **Popup UI**: `popup.js`, `popup.html`, `popup.css` — User interface.
- **Shared Utilities**: A new or existing shared module for duplicated helpers (getFieldType, isElementFillable).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Extension bundle size decreases by at least 10KB (removal of `api-client.js` ~5KB + unused function code).
- **SC-002**: Zero dead code detection: no unused files, no uncalled exported functions, no unaccessed variables — verified via grep and manual review.
- **SC-003**: No duplication of `getFieldType()`, `isElementFillable()`, or `generateSelector()` across content script modules.
- **SC-004**: SSE endpoint path is corrected to `/job-offers/stream` in `background.js`.
- **SC-005**: All existing user flows (scan page, fill forms, job links, applied toggle) continue to work as verified by manual smoke test.
- **SC-006**: No new ESLint warnings introduced by refactoring (if ESLint is configured).

---

## Assumptions

- The `api-client.js` file in `extension/content/` is a legacy module that was never wired into the extension's message-passing architecture. The background script makes all API calls directly via `fetch()`.
- The SSE endpoint `SSE_ENDPOINT` in `background.js` using `/api/v1/stream` is incorrect — the backend uses `/job-offers/stream`. This is a bug fix, not dead code removal, but it is included in the refactoring scope since it requires no new feature work.
- Functions like `getDummyJobLinks()`, `getAllJobLinks()`, and `filterNotAppliedLinks()` in `popup.js` were scaffolding code that was never connected to the UI.
- `migrateStorageIfNeeded()` in `popup.js` was written for a future migration that never happened.
- `handleFieldFilled()` in `background.js` is a no-op handler that was never meant to do anything meaningful beyond acknowledging receipt.
- `handleScanPage()` in `background.js` simply forwards to the content script — the content script does the actual scanning. The background handler adds no value.
- `getJobOffersFromMap()` in `background.js` was intended for a caching strategy that was replaced by direct storage-based caching.
- The duplicate `getFieldType()` function exists in both `form-scanner.js` and `signal-extractor.js` because they were developed independently. The signal-extractor's version is more complete (handles contenteditable edge cases) and should become the canonical implementation.
- The duplicate `isElementFillable()` function exists in both `form-scanner.js` and `form-observer.js` with identical logic. The form-scanner's version should become the canonical implementation.
- The duplicate `generateSelector()` function exists in both `form-scanner.js` and `form-observer.js`. The form-scanner's version should become the canonical implementation.

---

## Refactoring Inventory

The following items were identified for removal or consolidation:

### Files to Delete

| File | Reason |
|------|--------|
| `extension/content/api-client.js` | Never imported in manifest.json content_scripts list or referenced anywhere. Background makes direct fetch calls. |

### Functions to Remove from `popup/popup.js`

| Function | Reason |
|----------|--------|
| `getDummyJobLinks()` | Scaffolding data, never called |
| `getAllJobLinks()` | Trivial identity function, never called |
| `filterNotAppliedLinks()` | Redundant with `filterJobLinks(links, false)`, never called |
| `migrateStorageIfNeeded()` | Written for future migration, never invoked anywhere |

### Functions to Remove from `background/background.js`

| Function | Reason |
|----------|--------|
| `getJobOffersFromMap()` | SSE in-memory map is populated but never consumed via this function |
| `handleScanPage()` | Stub that just forwards to content script; content script is already called directly from popup |
| `handleFieldFilled()` | No-op acknowledgment handler; no side effects beyond updating stats in storage |
| `handleFillError()` | Logs the error but returns `success: true` with no meaningful recovery action |

### Duplicated Logic to Consolidate

| Pattern | Location A | Location B | Solution |
|---------|-----------|-----------|---------|
| `getFieldType()` | `form-scanner.js` line 87 | `signal-extractor.js` line 250 | Remove from form-scanner.js; signal-extractor's version is more complete (handles contenteditable). Keep in signal-extractor. |
| `isElementFillable()` | `form-scanner.js` line 39 | `form-observer.js` line 204 | Remove from form-observer.js; keep in form-scanner.js and expose via module export if needed. |
| `generateSelector()` | `form-scanner.js` line 106 | `form-observer.js` line 173 | Remove from form-observer.js; keep in form-scanner.js and expose via module export if needed. |

### Bug Fix (included in refactoring scope)

| Issue | Location | Fix |
|-------|----------|-----|
| Wrong SSE endpoint path | `background.js` line 9: `SSE_ENDPOINT = \`${API_ENDPOINT}/api/v1/stream\`` | Change to `${API_ENDPOINT}/job-offers/stream` to match backend |
