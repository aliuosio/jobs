# Implementation Plan: Extension Refactoring — Remove Dead Code & Apply SOLID

**Branch**: `1000-extension-refactor` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/1000-extension-refactor/spec.md`

## Summary

Refactor the Firefox browser extension by: (1) removing dead code (unused files, orphaned functions in `popup.js` and `background.js`), (2) removing a legacy file (`api-client.js`), (3) consolidating duplicated utility functions across content scripts (`getFieldType`, `isElementFillable`, `generateSelector`), and (4) fixing the SSE endpoint path in `background.js`. No new features are introduced. All changes are verified by ensuring existing acceptance scenarios continue to pass.

## Technical Context

**Language/Version**: JavaScript (ES6+) — Firefox Extension Manifest v3  
**Primary Dependencies**: Firefox `browser.*` APIs (tabs, storage, runtime), `fetch` API, `MutationObserver`  
**Storage**: `browser.storage.local` (Firefox extension storage API)  
**Testing**: Manual smoke test (Firefox `about:debugging`), static grep verification  
**Target Platform**: Firefox 109+ (MV3)  
**Project Type**: browser-extension  
**Performance Goals**: N/A — refactoring task; no performance impact expected  
**Constraints**: MV3 architecture (background service worker), manifest v3 content script ordering  
**Scale/Scope**: ~2,600 LOC across 8 JS files, 1 manifest, 1 HTML, 2 CSS

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **SOLID** | ⚠️ VIOLATED | Duplicated functions across modules violate SRP/DRY. Will be fixed by consolidation. |
| **DRY** | ⚠️ VIOLATED | `getFieldType`, `isElementFillable`, `generateSelector` duplicated. |
| **YAGNI** | ✅ PASS | No features being added. |
| **KISS** | ✅ PASS | Removal simplifies code. |
| **Type Safety** | ✅ PASS | JSDoc already present; refactoring preserves it. |
| **No `any`** | ✅ PASS | No type suppression introduced by changes. |
| **Modular Services** | ⚠️ VIOLATED | Shared utilities spread across modules. Consolidation resolves this. |
| **Git Flow** | ✅ PASS | Branch naming: `1000-extension-refactor`. |

**Gate Decision**: Proceed — SOLID/DRY violations are the explicit remediation target.

## Project Structure

### Documentation (this feature)

```text
specs/1000-extension-refactor/
├── plan.md              # This file
├── research.md          # (empty — no external research needed, all code in-context)
├── data-model.md        # (N/A — no new data entities)
├── quickstart.md        # (N/A — no new setup)
├── contracts/           # (N/A — no external API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (extension/)

```text
extension/
├── manifest.json         # Manifest — may need cleanup if api-client removed
├── background/
│   └── background.js    # MODIFIED: remove dead handlers; fix SSE endpoint
├── content/
│   ├── content.js        # UNCHANGED — orchestrator
│   ├── form-scanner.js   # MODIFIED: remove duplicated utilities, export shared ones
│   ├── field-filler.js   # UNCHANGED
│   ├── signal-extractor.js # MODIFIED: remains canonical for getFieldType
│   ├── form-observer.js  # MODIFIED: remove duplicated utilities, import from scanner
│   └── api-client.js     # DELETED — dead file
├── popup/
│   ├── popup.html        # UNCHANGED
│   ├── popup.css         # UNCHANGED
│   └── popup.js          # MODIFIED: remove dead functions
├── icons/                # UNCHANGED
└── tests/                # UNCHANGED (test file references preserved)
```

**Structure Decision**: Browser extension structure retained. Content scripts remain in `content/`. Shared utilities are consolidated within `form-scanner.js` (canonical source) and referenced by `form-observer.js` via module exports. No new directories or files introduced.

## Implementation Sequence

### Phase 1: Backup & Verification Baseline

1. **Before any changes**, capture a baseline:
   - List all files: `ls -la extension/content/ extension/background/ extension/popup/`
   - Verify manifest content_scripts matches actual files
   - Run `grep -r "functionName" extension/` for each dead function to confirm zero matches (pre-removal baseline)

### Phase 2: Delete `api-client.js`

2. **Delete** `extension/content/api-client.js`
3. **Verify** manifest.json does not reference it (confirmed: it doesn't)
4. **Verify** no imports/requires of `api-client.js` anywhere: `grep -r "api-client" extension/`
5. **Verify** no references in test files: `grep -r "api-client" extension/tests/`

### Phase 3: Remove Dead Functions from `popup/popup.js`

6. **Remove** in this order (verify with grep after each):
   - `getDummyJobLinks()` — lines 619–627
   - `getAllJobLinks()` — lines 401–403
   - `filterNotAppliedLinks()` — lines 366–368
   - `migrateStorageIfNeeded()` — lines 678–699
7. **Verify** each removed: `grep -rn "getDummyJobLinks\|getAllJobLinks\|filterNotAppliedLinks\|migrateStorageIfNeeded" extension/popup/popup.js` returns empty

### Phase 4: Remove Dead Functions from `background/background.js`

8. **Remove** in this order:
   - `getJobOffersFromMap()` — lines 217–219
   - `handleScanPage()` — lines 614–629
   - `handleFieldFilled()` — lines 661–670
   - `handleFillError()` — lines 675–678
   - Also remove the `tab_id` parameter from `handleFillAllForms` (line 529) since `sendToContent` now receives `tabId` directly from message handler caller — verify no callers pass a different `tab_id`
   - Remove `handleScanPage` from the message switch (lines 251–252)
   - Remove `handleFieldFilled` from the switch (lines 260–261)
   - Remove `handleFillError` from the switch (lines 267–268)
9. **Fix** SSE endpoint path: line 9, change `/api/v1/stream` → `/job-offers/stream`
10. **Verify** `grep -rn "getJobOffersFromMap\|handleScanPage\|handleFieldFilled\|handleFillError" extension/background/background.js` returns only the message switch case stubs (empty handlers that return `{ success: true }`)

### Phase 5: Consolidate Duplicated Utilities

11. **In `signal-extractor.js`**: Keep `getFieldType()` (canonical — handles `contenteditable`). Export via module.exports.
12. **In `form-scanner.js`**: 
    - Remove `getFieldType()` (now imported from signal-extractor)
    - Add `isElementFillable()` export if not already exported
    - Add `generateSelector()` export if not already exported
    - Update `createFormField()` to import `getFieldType` from signal-extractor
    - Update `scanForm()` and all detection strategies to use imported `getFieldType`
13. **In `form-observer.js`**: 
    - Remove `getFieldType()` — import from signal-extractor
    - Remove `isElementFillable()` — import from form-scanner
    - Remove `generateSelector()` — import from form-scanner
    - Update all internal references to use imported versions
14. **Verify** no duplication: `grep -n "function getFieldType\|function isElementFillable\|function generateSelector" extension/content/*.js` returns only from `signal-extractor.js` (getFieldType) and `form-scanner.js` (isElementFillable, generateSelector)

### Phase 6: Final Verification

15. **Grep sweep** — confirm all dead code gone:
    ```bash
    grep -rn "getDummyJobLinks\|getAllJobLinks\|filterNotAppliedLinks\|migrateStorageIfNeeded\|getJobOffersFromMap\|handleScanPage\|handleFieldFilled\|handleFillError" extension/
    grep -rn "api-client" extension/
    ```
16. **Manifest check**: `manifest.json` content_scripts lists exactly: `signal-extractor.js`, `api-client.js` (→ removed), `form-scanner.js`, `field-filler.js`, `form-observer.js`, `content.js`
17. **SSE path check**: `grep "SSE_ENDPOINT" extension/background/background.js` shows `/job-offers/stream`
18. **Duplication check**: verify `getFieldType` appears once, `isElementFillable` once, `generateSelector` once across content scripts
19. **Load extension** in Firefox and smoke test: scan page, fill forms, job links, applied toggle
20. **Run existing unit tests**: `node extension/tests/signal-extractor.test.js`

### Task Dependency Graph

```
Phase 1 (baseline) 
    ↓
Phase 2 (delete api-client) ──────────────────────────────────────────┐
    ↓                                                              ↓ (independent)
Phase 3 (popup.js) ──────────────────────────────────────────┐     │
    ↓                                                      ↓     │
Phase 4 (background.js) ─────────────────────────────────┐  │     │
    ↓                                                   │  │     │
Phase 5 (consolidate utilities) ──────────────────────┐  │  │  │
    ↓                                                │  │  │  │
Phase 6 (final verification)                          │  │  │  │
                                                     └──┴──┴──┘
```

### Tasks (atomic units for /speckit.tasks)

1. **Verify baseline** — capture pre-change file listing and grep sweep
2. **Delete `api-client.js`** — remove file, verify manifest
3. **Remove dead functions from `popup.js`** — remove 4 functions, verify grep
4. **Remove dead functions from `background.js`** — remove 4 handlers + fix SSE path, verify grep
5. **Consolidate utilities: update `signal-extractor.js`** — keep getFieldType canonical
6. **Consolidate utilities: update `form-scanner.js`** — import getFieldType, export isElementFillable + generateSelector
7. **Consolidate utilities: update `form-observer.js`** — import all 3 utilities
8. **Final verification** — grep sweep, manifest check, smoke test, unit tests

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Phase 0: Research

*(Not applicable — all unknowns resolved from in-context code review. The refactoring is fully specified by examining the existing source files.)*

## Phase 1: Design & Contracts

*(No external interfaces, no new data entities, no new setup required. This is a pure code cleanup task.)*
