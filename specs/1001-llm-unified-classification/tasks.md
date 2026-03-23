# Tasks: LLM-based Unified Field Classification

**Feature**: 1001-llm-unified-classification  
**Created**: 2026-03-23  
**Plan**: [impl-plan.md](./impl-plan.md)  
**Spec**: [spec.md](./spec.md)

---

## Phase 1: Setup

- [ ] T001 [P] Create research notes summary document from research.md decisions
- [ ] T002 Update API schema documentation for new response format

---

## Phase 2: Foundational

- [ ] T003 Import required schemas (AnswerRequest, AnswerResponse, ConfidenceLevel) in src/api/routes.py
- [ ] T004 Create AnswerResponse model reference for field_type and field_value fields
- [ ] T005 [P] Review existing field classification types from src/services/field_classifier.py

---

## Phase 3: User Story 1 - Core LLM Classification (Priority: P1)

**Goal**: Single LLM call classifies field type AND extracts/generates value from resume context

**Independent Test**: Send label "Email" to /fill-form and verify returns field_type="email", field_value="extracted email", confidence="high"

### Implementation

- [ ] T006 [P] [US1] Update AnswerResponse schema in src/api/schemas.py - add field_type and field_value fields
- [ ] T007 [P] [US1] Add ConfidenceLevel enum to src/api/schemas.py with HIGH/MEDIUM/LOW/NONE values
- [ ] T008 [US1] Create JSON output prompt template in src/services/generator.py for structured classification
- [ ] T009 [US1] Add classify_and_extract() method to GeneratorService in src/services/generator.py
- [ ] T010 [US1] Configure response_format={"type": "json_object"} for LLM call in src/services/generator.py
- [ ] T011 [US1] Implement JSON response parsing in src/services/generator.py classify_and_extract() method
- [ ] T012 [US1] Update /fill-form endpoint in src/api/routes.py to use new classify_and_extract() method
- [ ] T013 [US1] Map LLM response to AnswerResponse fields in src/api/routes.py fill_form function

**Verification**
- [ ] T014 [US1] Test /fill-form with label "Email Address" - verify returns field_type="email"
- [ ] T015 [US1] Test /fill-form with label "Vorname" - verify returns field_type="first_name"

---

## Phase 4: User Story 2 - Multi-language Detection (Priority: P2)

**Goal**: LLM classifies field types regardless of label language

**Independent Test**: Send German label "Nachname" to /fill-form and verify field_type="last_name"

### Implementation

- [ ] T016 [P] [US2] Update LLM prompt to include instruction for multilingual classification
- [ ] T017 [US2] Test classification with multilingual labels in src/services/generator.py

**Verification**
- [ ] T018 [US2] Test /fill-form with German label "Nachname" - verify field_type="last_name"
- [ ] T019 [US2] Test /fill-form with French label "Numéro de téléphone" - verify field_type="phone"
- [ ] T020 [US2] Test /fill-form with Spanish label "Ciudad" - verify field_type="city"

---

## Phase 5: User Story 3 - Confidence-Based Fallback (Priority: P3)

**Goal**: System provides confidence levels for auto-fill decisions

**Independent Test**: Request field with no data and verify confidence="none", has_data=false

### Implementation

- [ ] T021 [P] [US3] Implement confidence calculation from Qdrant scores in src/api/routes.py
- [ ] T022 [US3] Calculate confidence threshold logic (>=0.8 high, >=0.5 medium, >=0.3 low, <0.3 none)
- [ ] T023 [US3] Add exact match detection for field_value extraction in src/api/routes.py
- [ ] T024 [US3] Update AnswerResponse confidence field mapping in src/api/routes.py

**Verification**
- [ ] T025 [US3] Test with exact field match - verify confidence="high"
- [ ] T026 [US3] Test with partial match - verify confidence="medium" or "low"
- [ ] T027 [US3] Test with no data - verify confidence="none" and has_data=false

---

## Phase 6: Fallback & Error Handling

### Implementation

- [ ] T028 [P] Add fallback logic in src/api/routes.py - use regex classifier when LLM fails
- [ ] T029 Handle rate limit errors (503) with regex fallback in src/api/routes.py
- [ ] T030 Handle network errors with regex fallback in src/api/routes.py
- [ ] T031 Handle malformed JSON response - fallback to plain text answer in src/services/generator.py
- [ ] T032 Import SemanticFieldType from src/services/field_classifier.py for fallback classification

**Verification**
- [ ] T033 Test API behavior when LLM rate limited - verify regex fallback activates
- [ ] T034 Test with malformed LLM response - verify fallback answer generated

---

## Phase 7: Extension Update (Post-Backend)

### Implementation

- [ ] T035 [P] Update extension response handling in extension/content/api-client.js - parse field_type and field_value
- [ ] T036 Update field-filler.js in extension/content/ to use field_value when field_type is known
- [ ] T037 Add confidence-based auto-fill decision logic in extension/content/field-filler.js

**Verification**
- [ ] T038 Test extension fills form using new field_type + field_value format
- [ ] T039 Test extension falls back to answer field for backwards compatibility
- [ ] T040 Test extension respects confidence levels for auto-fill decisions

---

## Phase 8: Polish & Cross-Cutting

### Implementation

- [ ] T041 [P] Add API latency logging for performance monitoring in src/api/routes.py
- [ ] T042 Update error messages to include confidence level information
- [ ] T043 Verify 5-second response time requirement from FR-009

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            └── Phase 3 (US1 - Core Classification)
            │       └── Phase 4 (US2 - Multi-language)
            │       └── Phase 5 (US3 - Confidence)
            │       └── Phase 6 (Fallback & Errors)
            └── Phase 7 (Extension Update)
                    └── Phase 8 (Polish)

Independent Parallel Tasks:
- T001, T002 (Setup)
- T003, T004, T005, T006, T007, T016 (Foundational + early US tasks)
- T021, T028, T029, T035 (Confidence + Fallback + Extension)
```

---

## Parallel Execution Examples

**Setup Phase**: T001 and T002 can run in parallel

**Foundational Phase**: T003, T004, T005 can run in parallel (all import/review tasks)

**User Story 1**: All tasks must run sequentially (T006→T007→T008→...→T015)

**Extension Phase**: T035 and T036 can run in parallel (different extension files)

---

## MVP Scope (User Story 1 Only)

- T001, T002, T003, T004, T005 (Setup + Foundational)
- T006, T007, T008, T009, T010, T011, T012, T013 (Core implementation)
- T014, T015 (Verification)

This covers the essential LLM classification with backwards compatibility.

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | T001-T002 | Setup |
| Phase 2 | T003-T005 | Foundational |
| Phase 3 | T006-T015 | US1 - Core LLM Classification |
| Phase 4 | T016-T020 | US2 - Multi-language |
| Phase 5 | T021-T027 | US3 - Confidence Levels |
| Phase 6 | T028-T034 | Fallback & Error Handling |
| Phase 7 | T035-T040 | Extension Update |
| Phase 8 | T041-T043 | Polish |

**Total**: 43 tasks

**MVP (US1 only)**: 15 tasks