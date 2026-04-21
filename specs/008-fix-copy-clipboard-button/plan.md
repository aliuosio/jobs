# Implementation Plan: [FEATURE]

**Branch**: `010-fix-copy-clipboard-button` | **Date**: 2026-04-21 | **Spec**: specs/008-fix-copy-clipboard-button/spec.md
**Input**: Feature specification from `/specs/008-fix-copy-clipboard-button/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix the copy to clipboard button in the Firefox extension to:
1. Provide visual feedback when clicked (success/error states)
2. Actually copy the job application letter to clipboard
3. Handle edge cases (HTTPS/HTTP contexts, rapid clicks, processing states)

Technical approach:
- Use navigator.clipboard.writeText API for clipboard access
- Implement button state machine (null → copying → copied/error)
- Use Map to track per-button state
- Show messages below job list using existing showToggleError pattern

## Technical Context

**Language/Version**: JavaScript (Extension API)
**Primary Dependencies**: Firefox Extension API, Web Clipboard API
**State Management**: `Map` for per-button state tracking using `cl_status` field
**Testing**: extension/tests/cover-letter.test.js
**Target Platform**: Firefox browser extension
**Project Type**: Existing Job Links Manager feature enhancement
**Performance Goals**: Copy operation <200ms, visual feedback within 200ms
**Constraints**:
  - Secure (HTTPS) context required for clipboard API
  - Graceful degradation for HTTP contexts
  - Button states are maintained independently per job listing
**Accessibility**: Keyboard navigation handled at popup level (no per-button focus handling)
**Scale/Scope**: Single feature enhancement for existing popup UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Check Gates:**
- SOLID & DRY Principles: ✅ Single responsibility for copy button component, DRY for error handling
- Design Pattern Selection: ✅ Using existing extension patterns (Map for button state, showToggleError for messages)
- Test Driven Development: ✅ Tests required for copy functionality and visual feedback
- n8n Workflow Management: ❌ Not applicable (extension feature, no n8n workflows)

**Gate Status**: PASS (n8n gate not applicable for extension features)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
extension/
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── services/
│   └── api-service.js
└── tests/
    └── cover-letter.test.js
```

**Structure Decision**: Firefox extension popup UI modification. All changes are contained within the existing extension popup component and API service layer.
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
