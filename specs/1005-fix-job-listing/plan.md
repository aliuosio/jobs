# Implementation Plan: Fix Job Listing Bug

**Branch**: `1005-fix-job-listing` | **Date**: 2026-04-08 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/1005-fix-job-listing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix a bug where the "Refresh Jobs" button in the Firefox extension popup doesn't work because the click handler references an undefined function `handleRefreshLinksClick`. The fix requires adding this missing function that delegates to the existing `forceRefreshJobLinks()` function.

## Technical Context

**Language/Version**: JavaScript (ES6+)  
**Primary Dependencies**: Firefox Extension APIs (browser.*), browser.storage.local  
**Storage**: browser.storage.local for caching job offers  
**Testing**: Manual browser testing, existing test files in extension/tests/  
**Target Platform**: Firefox Browser Extension (Manifest v3)  
**Project Type**: Browser Extension  
**Performance Goals**: N/A - trivial fix  
**Constraints**: Must work with existing popup.js patterns  
**Scale/Scope**: Single file fix (popup.js)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| SOLID | ✅ PASS | Simple function delegation follows SRP |
| DRY | ✅ PASS | Reuses existing forceRefreshJobLinks() |
| YAGNI | ✅ PASS | Only adds the minimal wrapper function |
| Type Safety | ✅ PASS | JSDoc comments already present in file |
| Testing | ✅ PASS | Can verify via manual browser test |

**Constitution Check Result**: All gates pass - no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/1005-fix-job-listing/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Not needed - trivial fix
├── data-model.md        # Not needed - no new data entities
├── quickstart.md        # Not needed - no new interfaces
├── contracts/           # Not needed - no external contracts
├── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
extension/
├── popup/
│   ├── popup.js          # File to modify - add handleRefreshLinksClick function
│   ├── popup.html
│   └── popup.css
├── background/
│   └── background.js    # Already working - handles GET_JOB_OFFERS
└── tests/
    └── [existing test files]
```

**Structure Decision**: Single file modification in extension/popup/popup.js. The existing structure is appropriate - no changes needed to project architecture.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research

### Research Status: NOT NEEDED

The bug and fix are already clearly identified in the spec:
- **Problem**: `handleRefreshLinksClick` function is referenced but never defined
- **Solution**: Add the missing function definition that delegates to `forceRefreshJobLinks()`
- **Location**: extension/popup/popup.js

No external research needed - this is a trivial code fix.

## Phase 1: Design

### Design Status: COMPLETE

The implementation is straightforward:

1. Add the missing `handleRefreshJobLinksClick()` function after the `forceRefreshJobLinks()` function (around line 296)
2. The function simply delegates to `forceRefreshJobLinks()`

```javascript
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}
```

### Data Model: NOT NEEDED

No new data entities - the feature reuses existing Job Offer model and cache.

### Contracts: NOT NEEDED

No new external interfaces - the existing API contracts remain unchanged.

### Agent Context Update

Not needed - no new technologies introduced.

## Implementation Plan

### Files to Modify

1. **extension/popup/popup.js**
   - Add `handleRefreshLinksClick()` function after `forceRefreshJobLinks()` (line ~296)
   - No other changes needed

### Verification

- Manual test: Open extension popup, click refresh button, verify jobs update
- Code review: Verify function is properly defined and accessible

---

**Plan Complete**: Ready for `/speckit.tasks` to generate task breakdown.
