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

- [ ] T001 Create `extension/` directory structure with `popup/`, `content/`, `background/`, `icons/`, `tests/` subdirectories
- [ ] T002 Create `extension/manifest.json` with Manifest V3 configuration (permissions: activeTab, storage, scripting)
- [ ] T003 [P] Create `extension/content/content.css` for content script styles (empty or minimal)
- [ ] T004 [P] Create extension icons: `extension/icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`
- [ ] T005 [P] Create `extension/tests/fixtures/sample-form.html` for testing form structures

---

## Phase 2: Foundational (Background Script & API Client)

**Purpose**: Core messaging infrastructure that MUST be complete before content scripts

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create `extension/background/background.js` with browser.runtime.onMessage listener
- [ ] T007 Create `extension/content/api-client.js` with fetchToBackend() function for POST to localhost:8000/fill-form
- [ ] T008 Add error handling for API_UNAVAILABLE in `extension/content/api-client.js`
- [ ] T009 Implement handleFillForm() in `extension/background/background.js` to call backend API

**Checkpoint**: Background messaging ready - content script implementation can begin

---

## Phase 3: User Story 1 - Fill Single Form Field (Priority: P1) 🎯 MVP

**Goal**: Automatically fill a single form field with relevant information from resume when triggered.

**Independent Test**: Navigate to a job application page with a labeled input field, activate the extension, and verify the field is populated with relevant content.

### Implementation for User Story 1

- [ ] T010 [US1] Create `extension/content/form-scanner.js` with detectForIdLabels() function for for/id association
- [ ] T011 [US1] Add detectWrapperLabels() function for label wrapping input pattern in `extension/content/form-scanner.js`
- [ ] T012 [US1] Implement scanForm() function to detect all form fields and return FormField[] in `extension/content/form-scanner.js`
- [ ] T013 [US1] Create `extension/content/field-filler.js` with setFormValue() using native setter pattern
- [ ] T014 [US1] Implement fillField() function that dispatches input and change events with bubbles: true in `extension/content/field-filler.js`
- [ ] T015 [US1] Handle React's _valueTracker in setFormValue() in `extension/content/field-filler.js`
- [ ] T016 [US1] Create `extension/content/content.js` main content script with message listener
- [ ] T017 [US1] Implement FILL_FORM message handler in `extension/content/content.js` to fill single field
- [ ] T018 [US1] Create `extension/popup/popup.html` with basic UI (Fill button, status display, field count)
- [ ] T019 [US1] Create `extension/popup/popup.css` with popup styling
- [ ] T020 [US1] Create `extension/popup/popup.js` with Fill button click handler
- [ ] T021 [US1] Implement SCAN_PAGE message to scan current tab from popup in `extension/popup/popup.js`
- [ ] T022 [US1] Add field skip logic for readonly, disabled, hidden fields in `extension/content/form-scanner.js`

**Checkpoint**: At this point, User Story 1 should be fully functional - single field can be detected and filled

---

## Phase 4: User Story 2 - Batch Fill All Form Fields (Priority: P2)

**Goal**: Fill all form fields on a page at once with a single action.

**Independent Test**: Navigate to a job application form with multiple fields, trigger batch fill, and verify all fields are populated.

### Implementation for User Story 2

- [ ] T023 [US2] Add FILL_ALL_FORMS message handler in `extension/background/background.js`
- [ ] T024 [US2] Implement batch fill logic with sequential API calls in `extension/content/content.js`
- [ ] T025 [US2] Add progress tracking (total, completed, failed) in `extension/popup/popup.js`
- [ ] T026 [US2] Update popup UI to show fill progress and completion status in `extension/popup/popup.html`
- [ ] T027 [US2] Implement error notification when some fields fail in `extension/popup/popup.js`
- [ ] T028 [US2] Add SCAN_RESULT message handler to update detected field count in `extension/popup/popup.js`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - batch fill operational

---

## Phase 5: User Story 3 - Handle Complex Form Structures (Priority: P3)

**Goal**: Correctly identify form fields even when labels and inputs are not directly associated.

**Independent Test**: Test on a form with non-standard label-input associations and verify fields are still identified.

### Implementation for User Story 3

- [ ] T029 [US3] Add detectProximityLabels() function for proximity heuristic detection in `extension/content/form-scanner.js`
- [ ] T030 [US3] Add detectAriaLabels() function for aria-labelledby detection in `extension/content/form-scanner.js`
- [ ] T031 [US3] Add detectPlaceholderFallback() for fields with no label in `extension/content/form-scanner.js`
- [ ] T032 [US3] Implement confidence level assignment (high/medium/low) based on detection method in `extension/content/form-scanner.js`
- [ ] T033 [US3] Add MutationObserver for dynamic form detection in `extension/content/content.js`
- [ ] T034 [US3] Implement debounced mutation handling (300ms) in `extension/content/content.js`
- [ ] T035 [US3] Add WeakSet tracking for processed forms to prevent duplicates in `extension/content/content.js`

**Checkpoint**: All user stories should now be independently functional with complex form support

---

## Phase 6: Polish & Integration

**Purpose**: Final validation, error handling, and documentation updates

- [ ] T036 [P] Add user notification for API unavailable errors in `extension/popup/popup.js`
- [ ] T037 [P] Add truncation/warning for API responses exceeding field maxlength in `extension/content/field-filler.js`
- [ ] T038 Verify extension loads in Firefox (about:debugging → Load Temporary Add-on)
- [ ] T039 Test on common job board sites and verify 90% field detection rate
- [ ] T040 [P] Update quickstart.md with installation and usage instructions
- [ ] T041 Verify single field fill completes within 3 seconds (P95 threshold)
- [ ] T042 Verify error notification displays within 2 seconds of API failure
- [ ] T043 Verify batch fill of 10-field form completes within 30 seconds (P95 threshold)


## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 is the core - must complete first
  - US2 extends US1 - depends on single field fill working
  - US3 extends form detection - can partially parallelize with US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P2)**: Depends on US1 fill logic being complete (T013-T017)
- **User Story 3 (P3)**: Can partially overlap with US2 - only extends form-scanner.js

### Within Each User Story

- Form scanner before field filler
- Field filler before content script integration
- Content script before popup UI
- Core functionality before error handling

### Parallel Opportunities

- T003, T004, T005 can all run in parallel (different files)
- Within US1: T010-T011 (scanner functions) can be done together
- Within US1: T013-T015 (field filler functions) can be done together
- Within US1: T018-T020 (popup files) can be done together
- T036, T037, T040 can run in parallel (different files)

---

## Parallel Example: User Story 1 Popup Files

```bash
# These tasks can be done together (different files):
Task: "Create extension/popup/popup.html with basic UI"
Task: "Create extension/popup/popup.css with popup styling"
Task: "Create extension/popup/popup.js with Fill button click handler"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (single field fill)
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
2. Add User Story 3 → Complex form detection
3. Test on various job boards
4. All stories complete - robust form filling

### Single Developer Strategy

Recommended order for one developer:

1. T001-T005: Setup (15 min)
2. T006-T009: Foundational (20 min)
3. T010-T022: User Story 1 - Single Field (60 min)
4. T023-T028: User Story 2 - Batch Fill (30 min)
5. T029-T035: User Story 3 - Complex Forms (30 min)
6. T036-T040: Polish (20 min)

**Total estimated time**: ~175 minutes (~3 hours)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US1 is the core - must complete before US2
- Constitution compliance built into tasks:
  - input/change events with bubbles: true (Constitution V) in T014
  - localhost:8000 endpoint (Constitution IV) in T007
  - Native setter pattern for React/Angular in T013
- Stop at any checkpoint to validate story independently
- Firefox temporary extension loading for testing (about:debugging)
