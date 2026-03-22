# Refactoring Specification: src/ Code Cleanup

## Project: jobs
**Feature ID**: 999-refactoring-cleanup
**Date**: 2026-03-22
**Status**: CLARIFIED

---

## Clarifications

### Session 2026-03-22

- Q: retry.py status → A: Remove `src/utils/retry.py` completely (violates YAGNI) - **DONE**

---

## 1. Problem Statement

The `src/` directory contains code that violates the project's constitutional principles:
- **Duplicate code**: Unreachable exception handler in `retriever.py`
- **Dead code**: Unused imports, utilities, or services
- **Obsolete patterns**: Code that doesn't align with current architecture

## 2. User Stories

| Priority | Story |
|----------|-------|
| P0 | As a developer, I want the codebase to comply with KISS/DRY principles so maintenance is easier |
| P1 | As a developer, I want unused code removed so the codebase size is reduced |
| P2 | As a maintainer, I want clear separation of concerns so bugs are easier to isolate |

## 3. Scope

**In Scope:**
- `src/services/*.py` - remove duplicate code
- `src/utils/*.py` - investigate unused utilities

**Clarification**: `src/utils/retry.py` is never imported anywhere - investigate if intended for future use or dead code.

## 4. Acceptance Criteria

| ID | Criterion | Testable By |
|----|----------|-------------|
| AC-001 | Remove duplicate exception handler in retriever.py (lines 126-128) | Code review - second except block is unreachable |
| AC-002 | No unused imports in Python files | `ruff check src/` |
| AC-004 | All services follow single responsibility | Code review |
| AC-005 | Constitution compliance verified | Manual check |
| AC-006 | Remove unused `src/utils/retry.py` | File should not exist |

**Removed**: AC-003 (TypeScript/JS) - no such files exist in src/

## 5. Out of Scope

- Adding new features
- Changing API contracts
- Database schema modifications
- Extension code (separate feature)

## 6. Dependencies

- ruff linter

## 7. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Accidental removal of used code | Run `ruff check src/` before commit |
| Breaking API contracts | Verify routes.py unchanged |
| Tests fail | Revert changes if tests fail |

## 8. Implementation Order

1. **AC-001** first: Fix duplicate exception handler (bug fix)
2. **AC-002** second: Check/report unused imports
3. **AC-004**: Verify services are cohesive

---

## Constitution Alignment

This refactoring follows principles from `.specify/memory/constitution.md`:
- **KISS**: Remove dead code to simplify
- **DRY**: Eliminate duplicate exception handlers
- **YAGNI**: Remove unused imports/variables

---

## Notes

- Duplicate `except Exception` blocks identified in `src/services/retriever.py` lines 122-128 - second block is unreachable code (**FIXED**)
- `src/utils/retry.py` - **REMOVED** - never imported, violates YAGNI
- All other services verified for single responsibility