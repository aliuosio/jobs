# Implementation Plan: Export Applied Jobs as CSV

**Branch**: `013-export-applied-csv` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)

## Summary

Add CSV export functionality for applied jobs with a new "Export Applied" button in the Firefox extension popup. The existing `/job-offers` API endpoint will be enhanced with a `format` query parameter to support both JSON (default) and CSV output.

**Technical Approach**:
- Backend: Add `format` parameter to `GET /job-offers` endpoint with CSV generation
- Frontend: Add "Export Applied" button between checkbox and Refresh Jobs button

## Technical Context

**Language/Version**: Python 3.11+ (backend), JavaScript ES6+ (Firefox extension)  
**Primary Dependencies**: FastAPI, asyncpg, Pydantic (backend); browser APIs (extension)  
**Storage**: PostgreSQL (job_offers, job_offers_process tables)  
**Testing**: pytest (backend), manual testing for extension  
**Target Platform**: Linux server (backend), Firefox browser (extension)  
**Project Type**: web-service (backend API) + browser extension  
**Performance Goals**: CSV export within 3 seconds for 1000 jobs  
**Constraints**: Backward compatible API (default to JSON), UTF-8 with BOM for Excel  
**Scale/Scope**: Personal use, ~100s-1000s of job offers, single-user extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| SOLID Design (I) | ✅ PASS | Single endpoint handles format switching; CSV generation has single responsibility. |
| DRY (II) | ✅ PASS | Reuses existing job_offers query logic; CSV generation follows standard pattern. |
| YAGNI (III) | ✅ PASS | Only CSV export for applied jobs; no additional format options. |
| KISS (IV) | ✅ PASS | Simple query parameter approach; no separate export endpoint. |
| Type Safety (V) | ✅ PASS | Python type annotations, Pydantic models, JSDoc for extension. |
| Composition Over Inheritance (VI) | ✅ PASS | No inheritance used. |
| Git-Flow Branching (VII) | ✅ PASS | Feature branch `013-export-applied-csv` follows naming convention. |
| Runtime Constitution I–VI | ✅ PASS | No embedding/retrieval changes; purely API and UI enhancement. |

**Gate Result**: ✅ **PASS** – No violations.

## Project Structure

### Documentation (this feature)

```
specs/013-export-applied-csv/
├── plan.md              # This file
├── research.md          # Phase 0 research findings
├── data-model.md        # Data model and API contracts
├── quickstart.md        # Testing guide
├── contracts/           # API contracts
│   └── job-offers-csv.md
└── spec.md              # Feature specification
```

### Source Code (repository root)

```
src/                         # Backend Python package (FastAPI)
├── api/
│   ├── routes.py           # Enhanced with format parameter
│   └── schemas.py          # Add CSV response model if needed
├── services/
│   └── job_offers.py       # CSV generation helper
└── main.py                 # FastAPI application entry point

extension/                   # Firefox extension (frontend)
├── popup/
│   ├── popup.html          # Add Export Applied button
│   ├── popup.css           # Button styling
│   └── popup.js            # Export button handler
└── manifest.json           # Extension manifest
```

## Complexity Tracking

No violations requiring justification.

## Implementation Tasks (Next: /speckit.tasks)

### Backend Tasks
1. Add `format` query parameter to `GET /job-offers` endpoint
2. Implement CSV generation with UTF-8 BOM and proper escaping
3. Add filename generation with timestamp
4. Add error handling for invalid format values
5. Filter results to applied jobs only when format=csv

### Extension Tasks
1. Add "Export Applied" button to popup HTML
2. Add button styling (match existing button styles)
3. Implement export handler with fetch API
4. Implement browser download using URL.createObjectURL
5. Add button disable state during export
6. Add error handling for failed exports
