# Tasks: Fix Hybrid Search Field Population Bug

**Feature**: 1004-fix-field-population | **Branch**: `1004-fix-field-population`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup

- [X] T001 Review existing code in `src/api/routes.py` to understand current `fill_form()` implementation (lines 108-203)

---

## Phase 2: Foundational

- [X] T002 [P] Verify `retriever.get_profile_chunk()` method exists and works in `src/services/retriever.py`
- [X] T003 [P] Verify `_extract_direct_field_value()` function exists in `src/services/field_classifier.py`
- [X] T004 [P] Verify `classify_field_type()` function exists in `src/services/field_classifier.py`

---

## Phase 3: User Story 1 - Form field population with profile data (P1)

**Goal**: Restore profile chunk inclusion so form fields get correct values from profile data

**Independent Test**: Call `/fill-form` endpoint with field labels and verify correct `field_value` returned

### Implementation

- [X] T005 [US1] Add profile chunk fetch in `src/api/routes.py` after line ~136: call `retriever.get_profile_chunk()` and insert at beginning of chunks list
- [X] T006 [US1] Add direct field extraction in `src/api/routes.py`: call `classify_field_type(signals)` and `_extract_direct_field_value(chunks, field_type)` before LLM classification
- [X] T007 [US1] Return early with direct extraction result when successful: populate `AnswerResponse` with `field_value`, `confidence=HIGH`, `has_data=True`

### Verification

- [X] T008 [US1] Test firstname field: `curl -X POST http://localhost:8000/fill-form -d '{"label": "First Name"}' -H "Content-Type: application/json"` → expect field_value="Osiozekha"
- [X] T009 [US1] Test lastname field: `curl -X POST http://localhost:8000/fill-form -d '{"label": "Last Name"}' -H "Content-Type: application/json"` → expect field_value="Aliu"
- [X] T010 [US1] Test email field: `curl -X POST http://localhost:8000/fill-form -d '{"label": "Email", "signals": {"autocomplete": "email"}}' -H "Content-Type: application/json"` → expect field_value="aliu@dev-hh.de"
- [X] T011 [US1] Test city field: `curl -X POST http://localhost:8000/fill-form -d '{"label": "City"}' -H "Content-Type: application/json"` → expect field_value="Hamburg"
- [X] T012 [US1] Test postcode field: `curl -X POST http://localhost:8000/fill-form -d '{"label": "Postcode"}' -H "Content-Type: application/json"` → expect field_value="22399"
- [X] T013 [US1] Test street field: `curl -X POST http://localhost:8000/fill-form -d '{"label": "Street"}' -H "Content-Type: application/json"` → verify field_value is present (may be null if profile has no street)

---

## Phase 4: User Story 2 - Hybrid search compatibility (P1)

**Goal**: Ensure hybrid search still works correctly after fix

**Independent Test**: Verify hybrid search returns relevant chunks AND profile chunk is included

### Verification

- [X] T014 [US2] Verify hybrid search still returns text chunks (test with domain-specific query like "FastAPI" or "Ollama")
- [X] T015 [US2] Verify HYBRID_ENABLED=false still works (pure vector mode)

- [X] T015b [US2] Verify API response schema unchanged: Compare response structure before/after fix - field_value, has_data, confidence, answer, field_type all present with expected types

---

## Phase 5: User Story 3 - Graceful handling of missing profile data (P2)

**Goal**: Handle cases where profile data is missing

### Implementation

- [X] T016 [US3] Add error handling for profile chunk fetch failure: return HTTP 503 "Service temporarily unavailable" per FR-008
- [X] T016b [US3] Test error handling: Simulate Qdrant failure or disable Qdrant, verify HTTP 503 returned with "Service temporarily unavailable" message
- [X] T017 [US3] Ensure LLM still gets profile data in context per FR-009 (profile chunk included even after direct extraction attempt)
- [X] T017b [US3] Verify LLM gets profile data in context: Test that when direct extraction returns null, the LLM still receives profile chunk in context (check logs or test with unknown field type)

### Verification

- [X] T018 [US3] Test response when profile has null field: request street when profile has no street → expect has_data=true based on other fields

---

## Phase 6: Performance & Polish

- [X] T019 Measure response time to verify <800ms requirement (FR-007)
- [X] T020 Run existing tests: `pytest tests/ -v` to verify SC-005
- [X] T021 [P] Run linter on modified file: `python -m ruff check src/api/routes.py`
- [X] T022 [P] Run type checker on modified file: `python -m mypy src/api/routes.py`

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← T002, T003, T004 (parallel)
    ↓
Phase 3 (US1) ← Core fix implementation
    ↓
Phase 4 (US2) ← Verify hybrid search works (depends on US1)
    ↓
Phase 5 (US3) ← Error handling (depends on US1)
    ↓
Phase 6 (Polish) ← Performance + tests
```

---

## Parallel Execution Opportunities

1. **Phase 2**: T002, T003, T004 can run in parallel (verify existing functions)
2. **Phase 3 Verification**: T008-T013 can run sequentially (each field test)
3. **Phase 6**: T021, T022 can run in parallel (linter + type check)

---

## Implementation Strategy

**MVP Scope**: User Story 1 (T005-T013) - This is the core fix that restores field population

**Incremental Delivery**:
1. First implement T005-T007 (profile chunk fetch + direct extraction)
2. Test T008-T013 to verify fix works
3. Then implement T016-T017 (error handling)
4. Then verify T014-T015 (hybrid search compatibility)
5. Finally T019-T022 (performance + polish)

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | T001 | Review existing code |
| Phase 2: Foundational | T002-T004 | Verify existing functions |
| Phase 3: US1 | T005-T013 | Core fix + 6 field tests |
| Phase 4: US2 | T014-T015b | Hybrid search verification |
| Phase 5: US3 | T016-T017b | Error handling + missing profile |
| Phase 6: Polish | T019-T022 | Performance, tests, lint |
| **Total** | **25 tasks** | |

**MVP**: T005-T013 (Phase 3) - Core implementation and verification of the fix

**Updated Total**: 25 tasks (was 22, added T015b, T016b, T017b)