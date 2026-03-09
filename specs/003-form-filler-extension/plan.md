# Implementation Plan: Form Filler Browser Extension

**Branch**: `003-form-filler-extension` | **Date**: 2026-03-08 | **Updated**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-form-filler-extension/spec.md`

## Summary

Firefox WebExtension that scans job application forms, extracts label text, sends to backend API, and injects AI-generated responses with proper DOM events for React/Angular compatibility.

## Technical Context

**Language/Version**: JavaScript (ES2020+), HTML5, CSS3
**Primary Dependencies**: Firefox WebExtensions API (Manifest V3)
**Storage**: Browser storage API for extension settings
**Testing**: Manual testing on job board sites, Jest for unit tests
**Target Platform**: Firefox Browser (desktop)
**Project Type**: Browser Extension (Firefox WebExtension)
**Performance Goals**: Fill single field < 3 seconds (P95), batch 10 fields < 30 seconds (P95)
**Constraints**: Must work with SPA frameworks (React, Angular, Vue), Manifest V3 only
**Scale/Scope**: Single browser extension, unlimited form fields

### Resolved Clarifications (2026-03-09)

| Aspect | Resolution |
|--------|------------|
| Batch fill delay | 75ms (exact value) |
| Confidence levels | high: for-id, wrapper, aria; medium: proximity, name/id |
| No-label fallback | Use name/id attribute as label |
| Dynamic form timeout | 10 seconds max wait |
| Truncated values | Append ⚠ icon suffix |
| has_data: false | Show 'no data' indicator on field |
| API errors in batch | Toast notification + continue |
| contenteditable | Fill with innerText + dispatch input |
| select dropdowns | Match option text to API response |
| Test job boards | Indeed + LinkedIn |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ N/A | Extension layer - no embedding logic |
| II. Retrieval Law | ✅ N/A | Extension layer - no retrieval logic |
| III. Zero Hallucination | ✅ N/A | Extension layer - no generation logic |
| IV. CORS Policy | ✅ Pass | Extension communicates with localhost:8000 |
| V. DOM Injection | ✅ Pass | FR-005 specifies input + change events with bubbles |

**Infrastructure Mapping Compliance**:
- ✅ Extension interacts with Backend via `localhost:8000`
- ✅ No direct Extension-to-Qdrant communication
- ✅ DOM events dispatched for framework state sync

## Project Structure

### Documentation (this feature)

```text
specs/003-form-filler-extension/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── message-contract.md
├── checklists/          # Implementation gate
│   └── implementation-ready.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
extension/
├── manifest.json           # Firefox Manifest V3 configuration
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic and event handlers
├── content/
│   ├── content.js          # Main content script
│   ├── form-scanner.js     # Form field detection logic
│   ├── field-filler.js     # DOM value injection logic
│   └── api-client.js       # Backend API communication
├── background/
│   └── background.js       # Background service worker
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── tests/
    ├── test-form-scanner.js
    ├── test-field-filler.js
    └── fixtures/
        └── sample-form.html
```

**Structure Decision**: Standard Firefox WebExtension structure with content scripts for DOM manipulation and popup for user interface.

## Complexity Tracking

> No violations - all requirements align with constitution principles.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| DOM Injection | Medium | Native setter + event dispatch pattern |
| Form Detection | Medium | Label-input pairing heuristics + name/id fallback |
| API Integration | Low | Simple POST to localhost:8000 |
| Batch Fill | Low | Sequential with 75ms delay |

## Phase 0: Research Summary

✅ **COMPLETE** - See [research.md](./research.md)

### Resolved Questions

- [x] What is the Manifest V3 structure for Firefox? → Standard action/background/content_scripts structure
- [x] How to properly dispatch events for React/Angular? → Native setter + input/change events with bubbles: true
- [x] What label-input detection patterns work best? → for/id attributes + wrapper detection + proximity heuristics
- [x] How to handle MutationObserver for dynamic forms? → Debounced observer (300ms) with WeakSet tracking

## Phase 1: Design Artifacts

✅ **COMPLETE**

### Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data Model | [data-model.md](./data-model.md) | ✅ Complete |
| Contracts | [contracts/message-contract.md](./contracts/message-contract.md) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |
| Tasks | [tasks.md](./tasks.md) | ✅ Complete |
| Checklist | [checklists/implementation-ready.md](./checklists/implementation-ready.md) | ✅ All 38 items pass |

## Phase 2: Implementation Status

**Status**: Ready to implement

### Prerequisites Met
- ✅ All design artifacts complete
- ✅ Checklist passes (38/38)
- ✅ Constitution check passes
- ✅ Tasks.md has 43 implementation tasks

### Implementation Order (from tasks.md)
1. **Phase 1: Setup** (T001-T005) - Extension structure
2. **Phase 2: Foundational** (T006-T009) - Messaging infrastructure
3. **Phase 3: US1 - Single Field Fill** (T010-T022) - MVP core
4. **Phase 4: US2 - Batch Fill** (T023-T028) - Multi-field
5. **Phase 5: US3 - Complex Forms** (T029-T035) - Edge cases
6. **Phase 6: Polish** (T036-T043) - Validation & docs

---
*Plan created: 2026-03-08 | Updated: 2026-03-09 | Status: Ready for Implementation*
