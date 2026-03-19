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

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

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
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Implementation Status

**Date**: 2026-03-19
**Branch**: `001-form-qa-field-testing`
**Status**: Completed (15/18 tasks)

### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| T001-T003 | Setup scaffolding, data-model.md, quickstart.md | ✅ Complete |
| T004 | Update field_classifier.py for six flat fields | ✅ Complete |
| T005-T006 | Email/postcode validation patterns | ✅ Complete |
| T007 | Verify AsyncQdrantClient usage | ✅ Complete |
| T008 | Update ingest_profile.py with flat fields | ✅ Complete |
| T009-T011 | /fill-form endpoint verification | ✅ Complete |
| T012 | extract_field_value_from_payload for flat fields | ✅ Complete |
| T013 | Unit tests (test_field_classifier_six_fields.py) | ✅ Complete |
| T014 | Integration tests (test_fill_form.py) | ✅ Complete |
| T015 | E2E tests (test_end2end_fill_form.py) | ✅ Complete |
| T016 | README six-field testing guidance | ✅ Complete |

### Remaining Tasks

| Task | Description | Status |
|------|-------------|--------|
| T017 | Update plan.md (this file) | ✅ Complete |
| T018 | Add logging/observability | ⏳ Pending |

### Key Changes Made

1. **src/services/field_classifier.py**
   - Added `POSTCODE = "postcode"` enum
   - Added `POSTCODE_PATTERNS` for postcode detection
   - Updated `get_profile_field_name()` for flat fields (firstname, lastname, email, city, street, postcode)
   - Updated `extract_field_value_from_payload()` with flat field priority + nested fallback

2. **scripts/ingest_profile.py**
   - Added six flat fields at payload top level
   - Maintained backward compatibility with nested profile structure

3. **tests/unit/test_field_classifier_six_fields.py**
   - Tests for six field classification
   - Tests for flat field mapping
   - Tests for flat field extraction
   - Tests for backward compatibility
   - Tests for flat field priority

4. **tests/integration/test_fill_form.py**
   - Integration tests for /fill-form with seeded data
   - Tests for all six fields
   - Tests for nested backward compatibility
   - Tests for error handling

5. **tests/e2e/test_end2end_fill_form.py**
   - E2E tests for response structure
   - Latency tests
   - Negative/edge case tests

6. **README.md**
   - Added "Six-Field Form Testing" section
   - Added curl examples for all six fields
   - Added test commands

### Validation Results

All manual tests passed:
- POSTCODE enum exists
- Flat field mappings correct (firstname, lastname, email, city, street, postcode)
- Flat field extraction works
- Nested backward compatibility works
- Classification for all six fields works

### Files Created/Modified

```
src/services/field_classifier.py     # Updated with flat field support
scripts/ingest_profile.py            # Added six flat fields
tests/unit/test_field_classifier_six_fields.py  # New unit tests
tests/integration/test_fill_form.py  # New integration tests
tests/e2e/test_end2end_fill_form.py  # New E2E tests
README.md                            # Added six-field testing section
```
