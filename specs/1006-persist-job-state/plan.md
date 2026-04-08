# Implementation Plan: Persist Job State on Extension Open

**Branch**: `1006-persist-job-state` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/1006-persist-job-state/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement persistence for job data and last-clicked link state in the Firefox extension popup. When the user opens the extension, display cached job data from the last successful refresh instead of always fetching fresh data. The last-clicked job link should remain highlighted in yellow after closing and reopening the extension.

**Technical approach**: Leverage existing `browser.storage.local` infrastructure (already implemented for visited links, job offers caching) to persist job list and last-clicked link state. Modify `init()` function to load cached data first, then optionally refresh.

## Technical Context

**Language/Version**: JavaScript (ES6+) | Firefox Extension Manifest v3  
**Primary Dependencies**: browser.* APIs (storage, tabs, runtime)  
**Storage**: browser.storage.local (already in use)  
**Testing**: Jest-style tests in extension/tests/  
**Target Platform**: Firefox browser (extension)  
**Project Type**: Browser Extension (popup + background scripts)  
**Performance Goals**: < 500ms display time for cached data  
**Constraints**: Must work offline when backend unavailable  
**Scale/Scope**: ~100-1000 job links typical

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Docker for services | ✅ Pass | Backend runs in Docker |
| Type safety | ✅ Pass | JSDoc already in use |
| Git Flow | ✅ Pass | Using feature branch |
| Tests exist | ✅ Pass | extension/tests/ has test files |

## Project Structure

### Documentation (this feature)

```text
specs/1006-persist-job-state/
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
│   ├── popup.js         # Main popup logic (modify)
│   ├── popup.html       # Popup UI
│   └── popup.css        # Styles (existing yellow highlight)
├── background/
│   └── background.js    # Background script
├── content/
│   └── content.js       # Content script
└── tests/
    ├── job-links.test.js    # Existing tests
    └── refresh-button.test.js
```

**Structure Decision**: Modify existing popup.js to load cached data on init. No new files needed - leverage existing storage infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
