# Implementation Plan: Fix Job Offer Delete with Cover Letter

**Branch**: `008-fix-job-delete-cover-letter` | **Date**: 2026-04-20 | **Spec**: `/specs/007-fix-job-delete-cover-letter/spec.md`
**Input**: Fix delete failure when job offer has generated cover letter due to foreign key constraint

## Summary

Modify the backend SQL function `delete_job_offer` to delete related `job_applications` records BEFORE deleting the job offer, preventing the `ON DELETE RESTRICT` foreign key constraint from blocking the delete operation.

## Technical Context

**Language/Version**: Python 3.11 (backend) / JavaScript (extension)  
**Primary Dependencies**: FastAPI, PostgreSQL (asyncpg), Docker  
**Storage**: PostgreSQL  
**Testing**: pytest  
**Target Platform**: Linux server (Docker), Firefox extension  
**Project Type**: Backend API service + Browser extension  
**Performance Goals**: Delete < 2 seconds  
**Constraints**: Backward compatible - existing deletes without cover letters continue to work  
**Scale/Scope**: Single-user local tracking (no multi-user sync)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID & DRY | ✅ PASS | Simple SQL function fix - single responsibility |
| II. Design Patterns | ✅ PASS | Transactional integrity pattern - cascading deletes |
| III. Git Flow | ⚠️ SKIP | Using 008 branch already |
| IV. TDD | ✅ PASS | Will write tests before implementation |
| V. n8n Workflow | N/A | No n8n changes |

**Violations**: None identified

## Project Structure

### Documentation (this feature)

```text
specs/007-fix-job-delete-cover-letter/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
src/services/job_offers.py  # Single file to modify - delete_job_offer()

tests/integration/test_job_offers.py  # Existing test file
```

**Structure Decision**: Single function modification in existing service file. No new files created.

## Complexity Tracking

N/A - No complexity violations. Simple SQL fix with no external dependencies.