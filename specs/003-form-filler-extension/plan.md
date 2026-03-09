# Implementation Plan: Form Filler Browser Extension

**Branch**: `003-form-filler-extension` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Firefox WebExtension (Manifest V3) that automatically fills job application forms by sending label text to a RAG backend API and injecting responses into form fields. Uses multi-strategy label detection (for/id, wrapper, proximity), MutationObserver for dynamic forms, and dispatches input/change events for React/Angular state sync.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript (ES2020+) - no build step required for MVP
**Primary Dependencies**: Firefox WebExtension APIs, no external npm packages needed for MVP  
**Storage**: N/A (stateless extension, communicates with backend API)  
**Testing**: Vitest with vitest-chrome for Chrome API mocking (works with Firefox)
**Target Platform**: Firefox browser with Manifest V3  
**Project Type**: Browser Extension (WebExtension)  
**Performance Goals**: Single field fill <3s (P95), 10-field batch <30s (P95), API timeout 10s  
**Constraints**: Must dispatch input+change events (Constitution V), must whitelist moz-extension:// (Constitution IV), skip password fields, sequential fill with 75ms delay

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gates from Constitution

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| IV. CORS Policy | Whitelist `moz-extension://` via CORSMiddleware | ✅ APPLIES | Backend config - out of extension scope |
| V. DOM Injection | Must trigger `input` and `change` events | ✅ APPLIES | FR-005, FR-023 |
| I. Data Integrity | 1536-dimensional embeddings | N/A | Backend concern |
| II. Retrieval Law | k=5 for Qdrant | N/A | Backend concern |
| III. Zero Hallucination | Grounded in context | N/A | Backend concern |

**Gate Result**: PASS - Extension follows DOM Injection principle; CORS is backend config
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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

extension/
├── manifest.json           # Extension manifest (v3)
├── background/
│   └── background.js       # Background service worker
├── content/
│   ├── content.js          # Content script for DOM injection
│   ├── content.css         # Content script styles
│   ├── form-scanner.js     # Form detection & label extraction
│   ├── form-filler.js      # Field filling logic
│   ├── form-observer.js    # MutationObserver for dynamic forms
│   └── api-client.js       # Backend API communication
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   └── popup.css           # Popup styles
├── icons/                  # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── tests/
    ├── fixtures/           # Test HTML fixtures
    ├── unit/               # Unit tests
    └── integration/        # Integration tests

**Structure Decision**: Browser Extension project with standard WebExtension structure. Content script handles DOM manipulation; background script manages API calls; popup provides UI. Files organized by component for maintainability.

No complexity violations - standard browser extension architecture.
