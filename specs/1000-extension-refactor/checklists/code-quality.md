# Code Quality Checklist: Extension Refactoring

**Purpose**: Validate requirements for dead code removal and SOLID consolidation in browser extension
**Created**: 2026-03-22
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)
**Audience**: Peer reviewer (PR gate)

## Requirement Completeness

- [ ] CHK001 - Are all dead files explicitly listed in the refactoring inventory? [Completeness, Spec §Files to Delete]
- [ ] CHK002 - Are all dead functions explicitly named for removal from popup.js? [Completeness, Spec §Functions to Remove]
- [ ] CHK003 - Are all dead functions explicitly named for removal from background.js? [Completeness, Spec §Functions to Remove]
- [ ] CHK004 - Is the duplicated logic consolidation plan documented with canonical source identification? [Completeness, Spec §Duplicated Logic]
- [ ] CHK005 - Are test file references to removed code identified for cleanup? [Completeness, Spec §Tests/Fixtures]

## Requirement Clarity

- [ ] CHK006 - Is each function in the removal inventory uniquely identified (file + function name)? [Clarity, Spec §Refactoring Inventory]
- [ ] CHK007 - Is the canonical source for each duplicated utility explicitly stated? [Clarity, Spec §Duplicated Logic]
- [ ] CHK008 - Is the SSE endpoint path fix location explicitly identified (file + line)? [Clarity, Spec §Bug Fix]
- [ ] CHK009 - Are the grep verification commands concrete and executable? [Clarity, User Story 2 Acceptance]

## Requirement Consistency

- [ ] CHK010 - Do the functions listed for removal match the acceptance scenario grep patterns? [Consistency, Spec vs User Story 2]
- [ ] CHK011 - Is the consolidation decision (which version to keep) consistent with the assumption rationale? [Consistency, Spec §Assumptions]
- [ ] CHK012 - Does the manifest.json verification requirement align with file deletion inventory? [Consistency, Spec §FR-002]

## Acceptance Criteria Quality

- [ ] CHK013 - Is SC-002 (zero dead code detection) verifiable via the specified grep commands? [Measurability, Spec §SC-002]
- [ ] CHK014 - Is SC-003 (no duplication) verifiable by checking line counts of canonical sources? [Measurability, Spec §SC-003]
- [ ] CHK015 - Is SC-001 (bundle size decrease) quantified with specific threshold? [Measurability, Spec §SC-001]

## Scenario Coverage

- [ ] CHK016 - Are success scenarios defined for each refactoring phase (delete, remove, consolidate)? [Coverage, Plan §Implementation Sequence]
- [ ] CHK017 - Is there a verification scenario that confirms manifest.json content_scripts no longer references deleted files? [Coverage, Plan §Phase 2]
- [ ] CHK018 - Is there a verification scenario that confirms test files are updated to remove references to deleted functions? [Coverage, Plan §Phase 6]

## Edge Cases

- [ ] CHK019 - Is fallback behavior documented if SSE endpoint fix causes issues? [Edge Case, Spec §Edge Cases]
- [ ] CHK020 - Is behavior documented for scenarios where removed functions are accidentally called after refactoring? [Edge Case, Spec §Edge Cases]

## Non-Functional Requirements

- [ ] CHK021 - Are module responsibility requirements defined for each content script? [Non-Functional, Spec §FR-004]
- [ ] CHK022 - Is the module export/import strategy for consolidated utilities specified? [Non-Functional, Spec §FR-005]

## Dependencies & Assumptions

- [ ] CHK023 - Is the assumption that api-client.js is never imported validated in the spec? [Assumption, Spec §Assumptions]
- [ ] CHK024 - Is the assumption that background.js makes direct fetch calls (not via api-client) validated? [Assumption, Spec §Assumptions]

## Ambiguities & Conflicts

- [ ] CHK025 - Have test files been verified for references to removed functions and updated accordingly? [Resolution, Plan §Phase 6]
- [ ] CHK026 - Is there clarity on whether ESLint configuration exists for this project? [Ambiguity, Spec §SC-006]

---

## Summary

| Category | Items | Status |
|----------|-------|--------|
| Requirement Completeness | 5 | All items listed |
| Requirement Clarity | 4 | Functions uniquely identified |
| Requirement Consistency | 3 | Cross-references validated |
| Acceptance Criteria Quality | 3 | Measurable via grep/line count |
| Scenario Coverage | 3 | Phases covered (including manifest + test cleanup) |
| Edge Cases | 2 | SSE fallback + dead code dependency |
| Non-Functional | 2 | Module responsibilities defined |
| Dependencies & Assumptions | 2 | Assumptions documented |
| Ambiguities & Conflicts | 2 | Test files resolved, ESLint remains ambiguous |
| **Total** | **26** | |