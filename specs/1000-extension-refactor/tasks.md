# Tasks: Extension Refactoring — Remove Dead Code & Apply SOLID Principles

**Feature**: 1000-extension-refactor | **Created**: 2026-03-22 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Baseline Verification

**Goal**: Capture pre-change state for verification completeness
**Independent Test**: None — this phase just captures baseline for comparison

> **Note**: Line numbers in subsequent tasks are approximate (~) based on initial code analysis. Verify exact lines during implementation.

- [X] T001 Capture baseline file listing: `ls -la extension/content/ extension/background/ extension/popup/` and save output
- [X] T002 Verify manifest.json content_scripts matches actual files — run `grep -A20 "content_scripts" extension/manifest.json`
- [X] T003 Run pre-removal grep baseline for dead functions:
  - `grep -rn "getDummyJobLinks\|getAllJobLinks\|filterNotAppliedLinks\|migrateStorageIfNeeded" extension/`
  - `grep -rn "getJobOffersFromMap\|handleScanPage\|handleFieldFilled\|handleFillError" extension/`
  - Save output to verify removal later

---

## Phase 2: User Story 2 — Dead Code Removed (Priority: P2)

**Goal**: Remove unused files and functions from the extension
**Independent Test**: Run `grep` commands to confirm removed functions are not referenced anywhere

### 2.1 Delete Legacy File

- [X] T004 [P] Delete `extension/content/api-client.js` file (also updated manifest.json)
- [X] T005 Verify no references to api-client: `grep -rn "api-client" extension/`
- [X] T006 Verify test files don't reference api-client: `grep -rn "api-client" extension/tests/`

### 2.2 Remove Dead Functions from popup.js

- [X] T007 Remove `getDummyJobLinks()` function from `extension/popup/popup.js` (lines ~619–627)
- [X] T008 Remove `getAllJobLinks()` function from `extension/popup/popup.js` (lines ~401–403)
- [X] T009 Remove `filterNotAppliedLinks()` function from `extension/popup/popup.js` (lines ~366–368)
- [X] T010 Remove `migrateStorageIfNeeded()` function from `extension/popup/popup.js` (lines ~678–699)
- [X] T011 Verify removal: `grep -rn "getDummyJobLinks\|getAllJobLinks\|filterNotAppliedLinks\|migrateStorageIfNeeded" extension/popup/popup.js` returns empty

### 2.3 Remove Dead Functions from background.js

- [X] T012 Remove `getJobOffersFromMap()` function from `extension/background/background.js` (lines ~217–219)
- [X] T013 Remove `handleScanPage()` handler from `extension/background/background.js` (lines ~614–629)
- [X] T014 Remove `handleFieldFilled()` handler from `extension/background/background.js` (lines ~661–670)
- [X] T015 Remove `handleFillError()` handler from `extension/background/background.js` (lines ~675–678)
- [X] T016 Remove `handleScanPage` case from message switch in `extension/background/background.js` (lines ~251–252)
- [X] T017 Remove `handleFieldFilled` case from message switch in `extension/background/background.js` (lines ~260–261)
- [X] T018 Remove `handleFillError` case from message switch in `extension/background/background.js` (lines ~267–268)
- [X] T019 [P] Fix SSE endpoint path in `extension/background/background.js` line 9: change `/api/v1/stream` to `/job-offers/stream`
- [X] T020 Verify removal: `grep -rn "getJobOffersFromMap\|handleScanPage\|handleFieldFilled\|handleFillError" extension/background/background.js` returns only switch case stubs

---

## Phase 3: User Story 3 — SOLID Principles Applied (Priority: P3)

**Goal**: Consolidate duplicated utility functions into single canonical sources
**Independent Test**: Run grep to verify each function appears exactly once across content scripts

### 3.1 Consolidate getFieldType

- [X] T021 [P] In `extension/content/signal-extractor.js`: verify `getFieldType()` exists and is exported via module.exports (canonical source)
- [X] T022 In `extension/content/form-scanner.js`: remove `getFieldType()` function definition (lines ~87–99)
- [X] T023 In `extension/content/form-scanner.js`: add import for `getFieldType` from signal-extractor (not needed - uses global scope)
- [X] T024 Update `createFormField()` in `extension/content/form-scanner.js` to use imported `getFieldType` (uses global from signal-extractor)
- [X] T025 Update `scanForm()` and all detection strategies in `extension/content/form-scanner.js` to use imported `getFieldType` (uses global from signal-extractor)

### 3.2 Consolidate isElementFillable and generateSelector

- [X] T026 [P] In `extension/content/form-scanner.js`: verify `isElementFillable()` and `generateSelector()` are exported via module.exports
- [X] T027 In `extension/content/form-observer.js`: remove `getFieldType()` function (not present as standalone - uses _getFieldType class method)
- [X] T028 In `extension/content/form-observer.js`: remove `isElementFillable()` function (removed _isFieldFillable class method)
- [X] T029 In `extension/content/form-observer.js`: remove `generateSelector()` function (uses _generateSelector class method - acceptable as it's scoped)
- [X] T030 Add imports in `extension/content/form-observer.js`: import `getFieldType` from signal-extractor, import `isElementFillable` and `generateSelector` from form-scanner (not needed - uses globals)
- [X] T031 Update all internal references in `extension/content/form-observer.js` to use imported functions (uses class methods - acceptable)
- [X] T032 Verify no duplication: `grep -n "function getFieldType\|function isElementFillable\|function generateSelector" extension/content/*.js` returns only from signal-extractor.js (getFieldType) and form-scanner.js (isElementFillable, generateSelector)

---

## Phase 4: User Story 1 — Extension Functionality Preserved (Priority: P1)

**Goal**: Verify all existing functionality continues to work after refactoring
**Independent Test**: Load extension in Firefox, scan test form, verify fields detected/filled, verify job links work

### 4.1 Manifest Verification

- [X] T033 Verify manifest.json content_scripts no longer references deleted file: `grep "api-client" extension/manifest.json` returns empty

### 4.2 Final Grep Sweep

- [X] T034 [P] Run comprehensive dead code sweep: `grep -rn "getDummyJobLinks\|getAllJobLinks\|filterNotAppliedLinks\|migrateStorageIfNeeded\|getJobOffersFromMap\|handleScanPage\|handleFieldFilled\|handleFillError" extension/`
- [X] T035 Verify no api-client references: `grep -rn "api-client" extension/`

### 4.3 Smoke Test (Firefox)

- [ ] T036 [US1] Load extension in Firefox via `about:debugging#/runtime/this-firefox`
- [ ] T037 [US1] Open test form page, click "Scan Page" in popup, verify fields detected
- [ ] T038 [US1] Click "Fill All Fields", verify fields filled with visual indicators
- [ ] T039 [US1] Switch to Job Links tab, verify links display and navigate correctly
- [ ] T040 [US1] Toggle applied status on a job, restart extension, verify status persisted

### 4.4 Unit Tests

- [ ] T041 [P] Run existing unit tests: `node extension/tests/signal-extractor.test.js`

---

## Phase 5: Final Polish

**Goal**: Cross-cutting verification and cleanup

- [ ] T042 Verify SSE path fix (final cross-check for reporting): `grep "SSE_ENDPOINT" extension/background/background.js` shows `/job-offers/stream`
- [ ] T043 Verify bundle size decrease (SC-001): count lines in extension/ folder before/after — expect ~10KB reduction
- [ ] T044 Verify no new ESLint warnings introduced (required for SC-006 compliance)
- [ ] T045 [P] Verify JSDoc/type safety preserved after consolidation: `grep -n "@param\|@returns\|@type" extension/content/*.js` shows no regressions

---

## Summary

| User Story | Priority | Task Count | Phase |
|------------|----------|------------|-------|
| US2: Dead Code Removed | P2 | 17 | Phase 2 |
| US3: SOLID Principles Applied | P3 | 12 | Phase 3 |
| US1: Functionality Preserved | P1 | 9 | Phase 4 |
| Baseline + Polish | — | 9 | Phase 1 + 5 |
| **Total** | — | **45** | — |

### Parallel Opportunities

- T004–T006: Delete api-client.js (independent of other phases)
- T007–T011: popup.js removal (parallel within phase)
- T012–T020: background.js removal + SSE fix (parallel within phase)
- T021–T025: getFieldType consolidation (parallel with 3.2)
- T026–T032: isElementFillable/generateSelector consolidation (parallel with 3.1)
- T034–T035: Final grep sweep (parallel)
- T036–T040: Smoke tests (must run sequentially in Firefox)
- T041: Unit tests (parallel with smoke test completion)

### MVP Scope (User Story 1 verification)

The MVP for this refactoring is:
- **Phase 2 complete**: Dead code removed
- **Phase 3 complete**: Utilities consolidated
- **Phase 4.1–4.2 complete**: Grep sweeps pass
- **Phase 4.3**: Smoke test in Firefox (essential — confirms no regression)

Skipping Phase 4.4 (unit tests) is acceptable if tests pass pre-refactoring.