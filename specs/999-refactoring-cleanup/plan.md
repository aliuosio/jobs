# Technical Implementation Plan: src/ Code Cleanup

## Feature ID: 999-refactoring-cleanup
**Date**: 2026-03-22

---

## 1. Technical Approach

### Strategy
Two-phase cleanup focusing on proven fixes first, then general cleanup:

1. **Phase 1 - Critical Fixes** (High Confidence):
   - Remove duplicate exception handler in retriever.py ✅ ALREADY DONE

2. **Phase 2 - Code Quality Analysis** (Verify before action):
   - Run ruff to detect unused imports
   - Investigate retry.py usage status

### Why This Approach
- Phase 1 removes a confirmed bug (unreachable code)
- Phase 2 uses automated tooling to avoid false positives
- Low risk: No API changes, only cleanup

---

## 2. Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Linter | ruff | Already in project |
| Python | 3.11+ | Project target |
| Testing | pytest | Existing test suite |

---

## 3. Implementation Details

### Phase 1: Critical Fixes (COMPLETED)

| Task | File | Status |
|------|------|--------|
| Remove duplicate exception handler | src/services/retriever.py | ✅ DONE |

### Phase 2: Code Quality

| Task | Approach | Verification |
|------|----------|--------------|
| Run ruff scan | `ruff check src/` | Review flagged issues |
| Investigate retry.py | Verify import usage across codebase | Report findings |
| Check for other dead code | Manual code review | Report findings |

---

## 4. File Changes

### Files to Modify (if needed after analysis)
- `src/services/retriever.py` - duplicate handler removed (done)
- `src/utils/retry.py` - **REMOVE** (clarified in /speckit.clarify - violates YAGNI)

### Files to Review
- `src/api/routes.py` - verify no changes needed
- `src/services/*.py` - service cohesion check

---

## 5. Verification

| Step | Command | Expected |
|------|---------|----------|
| Lint check | `ruff check src/` | No unused import errors |
| Python syntax | `python -m py_compile src/**/*.py` | No syntax errors |
| Import check | `python -c "from src.services import *"` | All services importable |

---

## 6. Research Notes

### retry.py Analysis - RESOLVED
- **File**: `src/utils/retry.py`
- **Status**: Never imported anywhere in codebase
- **Decision** (from /speckit.clarify): REMOVE - violates YAGNI, confirmed by AC-006

No further research needed - this is a simple refactoring task with clear decisions.

---

## 7. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Removing actually-used code | Critical | Run ruff + verify imports |
| Breaking runtime | High | Test import chain |

---

## 8. Timeline

- Phase 1: Done (5 min)
- Phase 2: ~15 min (ruff scan + review)
- Total: ~20 min

---

## 9. Decision Log

| Decision | Rationale |
|----------|-----------|
| Remove duplicate exception handler | LSP confirmed unreachable |
| Remove retry.py | Confirmed never imported, violates YAGNI (AC-006) |
| Use ruff for detection | Project already has ruff configured |

---

## Constitution Compliance Check

| Principle | Applied? | Status |
|-----------|-----------|--------|
| KISS | Yes - removes dead code | ✅ |
| DRY | Yes - removed duplicate handler | ✅ |
| YAGNI | Yes - removes unused retry.py | ✅ |
| SOLID | Services already properly separated | ✅ |
| Type Safety | Refactoring preserves existing types | ✅ |
| Git-Flow | Using `feature/999-refactoring-cleanup` branch | ✅ |

---

## Next Steps

After this plan:
1. Run `/speckit.tasks` to generate task breakdown
2. Execute tasks
3. Verify with ruff