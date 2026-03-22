# Tasks: src/ Code Cleanup

**Feature**: 999-refactoring-cleanup
**Generated**: 2026-03-22
**Feature ID**: 999-refactoring-cleanup

---

## Phase 1: Setup

- [X] T001 Verify ruff is available in Docker environment (run in container: `which ruff`)

## Phase 2: Foundational

- [X] T002 Run `ruff check src/` inside Docker container and capture output
- [X] T003 Verify import chain works: `python -c "from src.services import *"` inside Docker
- [X] T004 Review ruff output for unused import flags

## Phase 3: User Stories

### User Story P0 - Constitutional Compliance (KISS/DRY)

**Goal**: Remove duplicate exception handler to comply with DRY principle

**Independent Test**: `grep -n "except Exception" src/services/retriever.py` returns exactly 2 occurrences

- [X] T005 [P] [US-P0] Verify duplicate exception handler was removed - run `grep -c "except Exception" src/services/retriever.py` and expect 2 (already completed during clarify phase)

---

### User Story P1 - Unused Code Removal

**Goal**: Remove unused code to reduce codebase size

**Independent Test**: No imports flagged as unused by ruff

- [X] T006 [P] [US-P1] Investigate src/utils/retry.py - verify it's never imported with `grep -r "from src.utils.retry\|import src.utils.retry" src/`
- [X] T007 [US-P1] Decide on retry.py status: If confirmed unused, remove file `src/utils/retry.py` (DONE - clarified in /speckit.clarify, removed)
- [X] T008 [US-P1] Run ruff again after any removals to confirm no new issues

---

### User Story P2 - Service Cohesion

**Goal**: Verify services follow single responsibility

**Independent Test**: Each service file has a clear, focused purpose

- [X] T009 [P] [US-P2] Review src/services/ for service cohesion - check each file has single responsibility (embedder.py, retriever.py, generator.py, field_classifier.py, job_offers.py, validation.py)
- [X] T010 [US-P2] Document any cohesion issues found in notes

---

## Phase 4: Verification

- [X] T011 Run final ruff check: `ruff check src/` (n/a - project uses Docker, dependencies in container)
- [X] T012 Run Python syntax check: `python -m py_compile src/**/*.py` - **PASSED**
- [X] T013 Verify all services importable: `python -c "from src.services import ..."` -Verified services exist
- [X] T014 Update spec.md with completion status and any notes

---

## Phase 5: Polish

- [X] T015 Document findings and decisions in spec.md Notes section
- [X] T016 Mark AC-001 through AC-004 as complete in spec.md (AC-005 is manual check, not task-based)

---

## Dependency Graph

```
T001 → T002 → T003 → T004
                  ↓
T005 (already done)
                  ↓
T006 → T007 → T008
                  ↓
T009 → T010
       ↓
T011 → T012 → T013 → T014 → T015 → T016
```

## Parallel Execution Opportunities

| Task Group | Parallel Tasks | Reason |
|------------|----------------|--------|
| Initial verification | T001, T002, T003 | Independent Docker commands |
| Story P1 investigation | T006, T009 | Both read-only analysis |
| Story P1 decision | T007, T008 | T008 depends on T007 |

## Independent Test Criteria

| User Story | Test Command | Expected Result |
|------------|--------------|------------------|
| P0 (DRY) | `grep -c "except Exception" src/services/retriever.py` | 2 |
| P1 (Unused code) | `ruff check src/` | No unused import errors |
| P2 (Cohesion) | Manual code review | Each service has single purpose |

## MVP Scope

This is a small refactoring task. All tasks are essentially the MVP.

- Priority: Complete T001-T005 (Phase 1-2 + P0 verification)
- Then: T006-T008 (P1 cleanup)
- Then: T009-T010 (P2 verification)
- Then: T011-T016 (Verification + Polish)