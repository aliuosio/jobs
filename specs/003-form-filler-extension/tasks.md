# Tasks: Form Filler Browser Extension

**Input**: Design documents from `/specs/003-form-filler-extension/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/message-contract.md

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Extension root**: `extension/` at repository root
- **Content scripts**: `extension/content/`
- **Background script**: `extension/background/`
- **Popup UI**: `extension/popup/`
- **Icons**: `extension/icons/`

---

## Phase 1: Setup (Extension Structure)

**Purpose**: Create extension directory structure and manifest configuration

- [X] T001 Create `extension/` directory structure with `popup/`, `content/`, `background/`, `icons/`, `tests/fixtures/` subdirectories
- [X] T002 Create `extension/manifest.json` with Manifest V3 configuration (permissions: activeTab, storage, scripting)
- [X] T003 [P] Create `extension/content/content.css` for content script styles (field highlighting, indicators)
- [X] T004 [P] Create extension icons: `extension/icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`
- [X] T005 [P] Create `extension/tests/fixtures/sample-form.html` for testing various form structures
---

## Phase 2: Foundational (Background Script & API Client)

**Purpose**: Core messaging infrastructure that MUST be complete before content scripts

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create `extension/background/background.js` with browser.runtime.onMessage listener for message routing
- [ ] T007 Create `extension/content/api-client.js` with `fetchToBackend()` function for POST to `http://localhost:8000/fill-form` with 10s timeout
- [ ] T008 Add error handling for API_UNAVAILABLE, API_ERROR, INVALID_RESPONSE in `extension/content/api-client.js`
- [ ] T009 Implement `handleFillForm()` in `extension/background/background.js` to call backend API and return FillResponse
- [ ] T010 Implement `handleGetStatus()` in `extension/background/background.js` to check API connectivity

**Checkpoint**: Background messaging ready - content script implementation can begin

---

## Phase 3: User Story 1 - Fill Single Form Field (Priority: P1) 🎯 MVP

**Goal**: Automatically fill a single form field with relevant information from resume when triggered.

**Independent Test**: Navigate to a job application page with a labeled input field, activate the extension, and verify the field is populated with relevant content and visible in the UI.

### Form Scanner (Label Detection)

- [ ] T011 [US1] Create `extension/content/form-scanner.js` with `detectForIdLabels()` function for explicit for/id association (confidence: high)
- [ ] T012 [US1] Add `detectWrapperLabels()` function for label wrapping input pattern in `extension/content/form-scanner.js` (confidence: high)
- [ ] T013 [US1] Add `detectAriaLabels()` function for aria-labelledby detection in `extension/content/form-scanner.js` (confidence: high)
- [ ] T014 [US1] Add `detectProximityLabels()` function for proximity heuristic with 50px max distance in `extension/content/form-scanner.js` (confidence: medium)
- [ ] T015 [US1] Add `getNameIdFallback()` function to use name or id attribute as fallback label text when no label element in `extension/content/form-scanner.js`
- [ ] T016 [US1] Implement `scanForm()` function to detect all form fields and return FormField[] with confidence levels in `extension/content/form-scanner.js`
- [ ] T017 [US1] Add field skip logic for readonly, disabled, hidden, password fields in `extension/content/form-scanner.js` (FR-008)
- [ ] T018 [US1] Add support for text, email, tel, url, number input types and textarea in `extension/content/form-scanner.js` (FR-002)

### Field Filler (Value Injection)

- [ ] T019 [US1] Create `extension/content/field-filler.js` with `setFormValue()` using native setter pattern from prototype
- [ ] T020 [US1] Implement `fillField()` function that dispatches input and change events with `bubbles: true` in `extension/content/field-filler.js` (FR-005)
- [ ] T021 [US1] Handle React's `_valueTracker` in `setFormValue()` to prevent React state issues in `extension/content/field-filler.js`
- [ ] T022 [US1] Add support for `contenteditable` elements with innerText + input event dispatch in `extension/content/field-filler.js` (FR-022)
- [ ] T023 [US1] Implement 'no data' visual indicator on fields where API returns `has_data: false` in `extension/content/field-filler.js` (FR-020)
- [ ] T024 [US1] Implement ⚠ warning icon appended after field values truncated due to maxlength in `extension/content/field-filler.js` (FR-021)

### Select Dropdown Support

- [ ] T025 [US1] Implement select dropdown handling with case-insensitive substring match to option text in `extension/content/field-filler.js` (FR-016)

### Content Script Integration

- [ ] T026 [US1] Create `extension/content/content.js` main content script with browser.runtime.onMessage listener
- [ ] T027 [US1] Implement `FILL_FIELD` message handler to fill single field with value in `extension/content/content.js`
- [ ] T028 [US1] Implement `DETECT_FIELDS` message handler to scan page and return field list in `extension/content/content.js`
- [ ] T029 [US1] Implement `FIELD_FILLED` notification to background when fill completes in `extension/content/content.js`

### Popup UI

- [ ] T030 [P] [US1] Create `extension/popup/popup.html` with basic UI (Fill button, Scan button, status display, field count)
- [ ] T031 [P] [US1] Create `extension/popup/popup.css` with popup styling (buttons, status indicators)
- [ ] T032 [US1] Create `extension/popup/popup.js` with Fill button click handler that sends FILL_FORM message
- [ ] T033 [US1] Implement SCAN_PAGE message to scan current tab from popup in `extension/popup/popup.js`
- [ ] T034 [US1] Implement GET_STATUS message to check API connectivity and display status in `extension/popup/popup.js`

**Checkpoint**: At this point, User Story 1 should be fully functional - single field can be detected and filled

---

## Phase 4: User Story 2 - Batch Fill All Form Fields (Priority: P2)

**Goal**: Fill all form fields on a page at once with a single action.

**Independent Test**: Navigate to a job application form with multiple fields, trigger batch fill, and verify all fields are populated sequentially.

### Batch Fill Implementation

- [ ] T035 [US2] Add `FILL_ALL_FORMS` message handler in `extension/background/background.js` to orchestrate batch fills
- [ ] T036 [US2] Implement batch fill logic with sequential API calls and 75ms delay between fills in `extension/content/content.js` (FR-014)
- [ ] T037 [US2] Sort fields by DOM order before batch fill in `extension/content/content.js`
- [ ] T038 [US2] Implement progress tracking (total, completed, failed, current field) in `extension/content/content.js`
- [ ] T039 [US2] Show toast notification for API errors during batch fill and continue with remaining fields in `extension/content/content.js` (FR-023)

### Popup Progress UI

- [ ] T040 [US2] Update popup UI to show fill progress bar and completion status in `extension/popup/popup.html`
- [ ] T041 [US2] Add progress update listener in `extension/popup/popup.js` to display real-time fill status
- [ ] T042 [US2] Implement batch fill completion notification showing success/failed counts in `extension/popup/popup.js`
- [ ] T043 [US2] Add SCAN_RESULT message handler to update detected field count in popup in `extension/popup/popup.js`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - batch fill operational

---

## Phase 5: User Story 3 - Handle Complex Form Structures (Priority: P3)

**Goal**: Correctly identify form fields even when labels and inputs are not directly associated.

**Independent Test**: Test on a form with non-standard label-input associations (wrapper, proximity, aria) and verify fields are still identified.

### Enhanced Form Detection

- [ ] T044 [US3] Implement confidence level assignment (high: for-id/wrapper/aria, medium: proximity/name-id fallback) in `extension/content/form-scanner.js` (FR-018)
- [ ] T045 [US3] Add 10-second maximum wait time for dynamic form detection before considering scan complete in `extension/content/form-scanner.js` (FR-019)

### MutationObserver for Dynamic Forms

- [ ] T046 [US3] Create `FormObserver` class with MutationObserver for dynamic form detection in `extension/content/form-observer.js`
- [ ] T047 [US3] Implement debounced mutation handling (300ms) to prevent excessive processing in `extension/content/form-observer.js`
- [ ] T048 [US3] Add WeakSet tracking for processed forms to prevent duplicates and memory leaks in `extension/content/form-observer.js`
- [ ] T049 [US3] Integrate FormObserver into content script initialization in `extension/content/content.js` (FR-012)
- [ ] T050 [US3] Implement automatic re-scan notification when new forms detected in `extension/content/content.js`

**Checkpoint**: All user stories should now be independently functional with complex form support

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, error handling, and documentation

### Error Handling & UX

- [ ] T051 [P] Add user notification for API unavailable errors (toast in popup) in `extension/popup/popup.js` (FR-007)
- [ ] T052 [P] Add visual feedback when fields are skipped (readonly/disabled/hidden/password) in `extension/content/content.css`
- [ ] T053 [P] Implement error code mapping to user-friendly messages in `extension/background/background.js`

### Validation & Testing

- [ ] T054 Verify extension loads in Firefox (about:debugging → Load Temporary Add-on → manifest.json)
- [ ] T055 Test on Indeed job application pages and verify form field detection
- [ ] T056 Test on LinkedIn job application pages and verify form field detection
- [ ] T057 Verify 90% field detection rate on Indeed + LinkedIn (SC-004)

### Performance Validation

- [ ] T058 Verify single field fill completes within 3 seconds P95 (SC-001)
- [ ] T059 Verify error notification displays within 2 seconds of API failure (SC-003)
- [ ] T060 Verify batch fill of 10-field form completes within 30 seconds P95 (SC-005)
- [ ] T061 Verify React/Angular forms show filled values in UI after injection (SC-002)

### Documentation

- [ ] T062 [P] Update quickstart.md with installation and usage instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 is the core - must complete first
  - US2 extends US1 - depends on single field fill working
  - US3 can partially parallelize with US2 - extends form detection only
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P2)**: Depends on US1 fill logic being complete (T019-T025)
- **User Story 3 (P3)**: Can partially overlap with US2 - only extends form-scanner.js

### Within Each User Story

- Form scanner before field filler
- Field filler before content script integration
- Content script before popup UI
- Core functionality before error handling

### Parallel Opportunities

- T003, T004, T005 can all run in parallel (different files)
- Within US1: T011-T015 (scanner functions) can be done together
- Within US1: T019-T025 (field filler functions) can be done together
- Within US1: T030-T031 (popup files) can be done together
- T046-T048 (FormObserver methods) can be done together
- T051, T052, T053, T062 can run in parallel (different files)

---

## Parallel Example: User Story 1 Core Components

```bash
# These scanner tasks can be done together:
Task: "Create detectForIdLabels() in form-scanner.js"
Task: "Create detectWrapperLabels() in form-scanner.js"
Task: "Create detectAriaLabels() in form-scanner.js"
Task: "Create detectProximityLabels() in form-scanner.js"
Task: "Create getNameIdFallback() in form-scanner.js"

# These popup files can be created in parallel:
Task: "Create extension/popup/popup.html"
Task: "Create extension/popup/popup.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (15 min)
2. Complete Phase 2: Foundational (20 min)
3. Complete Phase 3: User Story 1 - Single Field (75 min)
4. **STOP and VALIDATE**: Test on job application page, fill single field
5. Extension can detect and fill individual form fields - MVP delivered

### Core Functionality (US1 + US2)

1. Complete Setup + Foundational → Messaging ready
2. Add User Story 1 → Single field fill works
3. Add User Story 2 → Batch fill works
4. Test batch fill on multi-field form
5. Core value delivered: one-click form completion

### Full Feature (All Stories)

1. Complete US1 + US2 → Basic form filling
2. Add User Story 3 → Complex form detection + dynamic forms
3. Test on various job boards (Indeed, LinkedIn)
4. All stories complete - robust form filling

### Single Developer Strategy

Recommended order for one developer:

1. T001-T005: Setup (15 min)
2. T006-T010: Foundational (25 min)
3. T011-T034: User Story 1 - Single Field (75 min)
4. T035-T043: User Story 2 - Batch Fill (35 min)
5. T044-T050: User Story 3 - Complex Forms (30 min)
6. T051-T062: Polish & Validation (25 min)

**Total estimated time**: ~205 minutes (~3.5 hours)

---

## Requirements Coverage Matrix

| Requirement | Task(s) |
|-------------|---------|
| FR-001: Scan page for form fields | T016, T028 |
| FR-002: Extract labels from text/email/tel/url/number/textarea | T018 |
| FR-003: Send label to backend API | T007, T009 |
| FR-004: Populate fields with API responses | T019-T022 |
| FR-005: Dispatch input/change events with bubbles:true | T020 |
| FR-006: Popup/panel UI for triggering | T030-T034 |
| FR-007: Handle API errors gracefully | T008, T051 |
| FR-008: Skip readonly/disabled/hidden/password | T017 |
| FR-009: Work with React/Angular/Vue | T019, T021, T061 |
| FR-010: Only communicate with localhost:8000 | T007 |
| FR-011: Batch fill mode | T035-T038 |
| FR-012: MutationObserver for dynamic forms | T046-T049 |
| FR-013: Manifest V3 | T002 |
| FR-014: Sequential fill with 75ms delay | T036 |
| FR-015: 10s API timeout | T007 |
| FR-016: Select dropdown matching | T025 |
| FR-017: 50px proximity limit | T014 |
| FR-018: Confidence levels (high/medium) | T044 |
| FR-019: 10s max wait for dynamic forms | T045 |
| FR-020: 'no data' indicator | T023 |
| FR-021: ⚠ warning for truncated values | T024 |
| FR-022: contenteditable support | T022 |
| FR-023: Toast notification for batch errors | T039 |
| FR-024: name/id fallback labels | T015 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US1 is the core - must complete before US2
- Constitution compliance built into tasks:
  - input/change events with bubbles: true (Constitution V) in T020
  - localhost:8000 endpoint (Constitution IV) in T007
  - Native setter pattern for React/Angular in T019
- Stop at any checkpoint to validate story independently
- Firefox temporary extension loading for testing (about:debugging)
