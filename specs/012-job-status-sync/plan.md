# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.11+ (backend), JavaScript ES6+ (Firefox extension)  
**Primary Dependencies**: FastAPI, asyncpg, Pydantic (backend); browser APIs (extension)  
**Storage**: PostgreSQL (job_offers, job_offers_process tables), Qdrant vector DB (for RAG)  
**Testing**: pytest (backend), manual testing for extension  
**Target Platform**: Linux server (backend), Firefox browser (extension)
**Project Type**: web-service (backend API) + browser extension  
**Performance Goals**: Real‑time status updates within 1 second (SSE)  
**Constraints**: Best‑effort reliability (no SLA), CORS enabled for extension access  
**Scale/Scope**: Personal use, ~100s of job offers, single‑user extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re‑check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| SOLID Design (I) | ✅ PASS | SSE endpoint, broadcast mechanism, extension client each have single responsibility. |
| DRY (II) | ✅ PASS | Process data model reused across API and extension; no duplicated logic. |
| YAGNI (III) | ✅ PASS | Only implemented required real‑time updates; no speculative features. |
| KISS (IV) | ✅ PASS | Straightforward SSE + extension client; no over‑engineering. |
| Type Safety (V) | ✅ PASS | Python type annotations, Pydantic models, JSDoc for extension. |
| Composition Over Inheritance (VI) | ✅ PASS | No inheritance used. |
| Git‑Flow Branching (VII) | ✅ PASS | Feature branch `012-job-status-sync` follows naming convention. |
| Runtime Constitution I–VI | ✅ PASS | Embedding dimensions, retrieval config, etc. not applicable to this feature. |

**Gate Result**: ✅ **PASS** – No violations.

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

```text
# Job Forms Helper – actual project structure (web application + browser extension)

src/                         # Backend Python package (FastAPI)
├── api/                    # API layer
│   ├── routes.py           # Endpoint handlers (including SSE)
│   └── schemas.py          # Pydantic models for request/response
├── services/               # Business logic services
│   ├── job_offers.py       # Job offer and process CRUD + broadcasting
│   └── ...
├── utils/                  # Utility functions
├── config.py               # Configuration management
└── main.py                 # FastAPI application entry point

extension/                  # Firefox extension (frontend)
├── background/             # Background scripts (SSE client, data storage)
│   └── background.js
├── content/                # Content scripts (UI updates)
│   └── content.js
├── popup/                  # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── manifest.json           # Extension manifest
└── icons/                  # Extension icons

tests/                      # Test suite
├── unit/                   # Unit tests (pytest)
├── integration/            # Integration tests (API endpoints)
└── e2e/                    # End‑to‑end tests (extension + backend)

docs/                       # Documentation
docker-compose.yml          # Docker services (backend + Qdrant)
Dockerfile                  # Backend container
requirements.txt            # Python dependencies
```

**Structure Decision**: Option 2 (Web application) – backend (`src/`) plus frontend (`extension/`). This matches the existing repository layout and the requirement for a Firefox extension communicating with a FastAPI backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
