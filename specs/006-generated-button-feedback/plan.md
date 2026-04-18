# Implementation Plan: Generated Button Feedback

**Branch**: `006-generated-button-feedback` | **Date**: 2026-04-18 | **Spec**: spec.md
**Input**: Feature specification from `/specs/006-generated-button-feedback/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement visual feedback for cover letter generation workflow in Firefox extension popup:
1. Generate button changes to "Generated" (passive) when `cl_status: 'ready'`
2. Jobs List shows passive "Generated" button for jobs with existing letters
3. Timer during generation updates every second (currently shows static)

**Technical approach**: Modify existing `popup.js` functions to handle new states and add setInterval for timer updates.

## Technical Context

**Language/Version**: JavaScript (ES Modules in progress)  
**Primary Dependencies**: Browser Extension APIs, n8n webhook  
**Storage**: Local storage via browser.storage.local  
**Testing**: Custom test runner in extension/tests/  
**Target Platform**: Firefox 128+ (Chrome compatible)  
**Project Type**: Browser extension / UI component  
**Performance Goals**: Timer updates without UI jank, <16ms per frame  
**Constraints**: Must not break existing cover letter copy functionality  
**Scale/Scope**: Single popup interface, <50 jobs displayed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| TDD Required | ✓ | Tests exist in extension/tests/cover-letter.test.js - extend before implementation |
| No type suppression | N/A | JavaScript (no type checking) |
| No empty catch blocks | ✓ | Verified in popup.js - all catches log errors |
| Code Quality | ✓ | ES Modules in progress per REFACTORING-PLAN.md |

## Project Structure

### Documentation (this feature)

```text
specs/006-generated-button-feedback/
├── plan.md              # This file
├── research.md           # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
extension/
├── popup/
│   └── popup.js              # Main file to modify (button rendering + timer)
├── services/
│   └── constants.js          # Contains MIN_DESCRIPTION_LENGTH
├── tests/
│   └── cover-letter.test.js  # Existing tests to extend
└── popup/
    └── popup.css             # Styles (may need updates)
```

**Structure Decision**: Single extension/popup modification - no new directories needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Simple UI change to existing popup.

## Implementation Details (from Codebase Analysis)

### Existing Functions to Modify

1. **getClBadgeText(link, hasLongDescription)** - Lines 1091-1105 in popup.js
   - Current: Shows "Generating" for status 'generating', "Saved"/"No Desc" for others
   - Change: Show "Generated" for status 'ready'

2. **Job links rendering** (lines 776-792 in popup.js)
   - Current: Shows "Generate" button always enabled/disabled based on description
   - Change: Show "Generated" button (disabled) when status is 'ready'

3. **Timer updates**
   - Current: Timer calculated once on render (line 1095), no update loop
   - Change: Add setInterval to update timer every second

4. **Timer lifecycle management**
   - Add setInterval when status is 'generating' and cl_start_time exists
   - Store timer ID reference for cleanup
   - Clear interval when: status changes, popup closes, or component unmounts

### Files to Modify

- `extension/popup/popup.js` - Main implementation
- `extension/tests/cover-letter.test.js` - Add tests for new states
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
