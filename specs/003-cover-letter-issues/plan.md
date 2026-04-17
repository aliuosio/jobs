# Implementation Plan: Cover Letter Generation Issues

**Branch**: `003-cover-letter-issues` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-cover-letter-issues/spec.md`

## Summary

Fix 4 issues in cover letter generation: (1) status check returns wrong status for non-existent job offers, (2) cache staleness after generation triggers, (3) silent polling failures, (4) add webhook URL config for host/container environments. Changes span backend API, database schema, and extension UI.

## Technical Context

**Language/Version**: Python 3.11 (backend), JavaScript (extension)  
**Primary Dependencies**: FastAPI, PostgreSQL, Qdrant (backend); extension services  
**Storage**: PostgreSQL (`job_applications` table)  
**Testing**: pytest (backend), extension tests in `tests/`  
**Target Platform**: Linux server (Docker), Firefox browser  
**Project Type**: web-service + browser-extension  
**Performance Goals**: Status check <500ms (NFR-001), cache invalidation <100ms  
**Constraints**: N/A  
**Scale**: Single-user extension, local services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| TDD for code | ✅ PASS | Tests first via pytest |
| SOLID/DRY | ✅ PASS | Follow existing patterns |
| Design patterns | ✅ PASS | Use existing retriever/cache patterns |
| No type suppression | ✅ PASS | No `as any`, `@ts-ignore` |

## Phase 0: Research ✓ COMPLETE

### Findings Summary

- Status endpoint in `src/api/routes.py` - needs to check existence first
- Cache in `src/utils/cache.py` - needs invalidation on generation trigger
- DELETE/PATCH pattern returns 404 - follow same pattern
- Webhook URLs configured for host/container environments

### Research Artifacts

- [research.md](research.md) - Detailed findings
- [data-model.md](data-model.md) - Entity definitions
- [quickstart.md](quickstart.md) - Implementation guide

## Project Structure

### Documentation (this feature)

```text
specs/003-cover-letter-issues/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/         # Quality checklists
└── tasks.md             # Phase 2 output
```

### Source Code (existing structure)

```text
src/
├── api/routes.py        # Status endpoint location
├── services/
│   ├── retriever.py
│   └── job_offers.py
└── utils/cache.py

tests/
├── integration/
└── unit/

extension/
├── services/
└── popup/
```

## Phase 1: Design ✓ COMPLETE

### Design Decisions

| Decision | Rationale |
|----------|----------|
| Return 404 for non-existent job | Consistency with DELETE/PATCH |
| Invalidate cache on trigger | Prevent stale state |
| Error badge in UI | Make failures visible |
| Environment-based URL selection | Works in dev + prod |

No complexity violations. Simpler alternatives rejected: N/A
