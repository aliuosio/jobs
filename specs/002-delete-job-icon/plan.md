# Implementation Plan: Delete Job Icon

**Branch**: `002-delete-job-icon` | **Date**: 2026-04-17 | **Spec**: specs/002-delete-job-icon/spec.md
**Input**: Feature specification from `/specs/002-delete-job-icon/spec.md`

---

## Summary

Add delete button to each job title in extension popup job list, connect to new DELETE backend endpoint, and widen popup by 20%. Implementation follows TDD methodology.

---

## Technical Context

**Language/Version**: Python 3.11, JavaScript ES6+  
**Primary Dependencies**: FastAPI, asyncpg, browser extension  
**Storage**: PostgreSQL (job_offers, job_offers_process tables)  
**Testing**: pytest (Python), extension tests in `extension/tests/`  
**Target Platform**: Linux server + Firefox extension  
**Project Type**: Web service + Browser extension  
**Performance Goals**: <2s delete operation (SC-002)  
**Constraints**: None specific beyond TDD requirement  
**Scale/Scope**: Single feature, 2-3 files each side  

---

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. SOLID & DRY | PASS | Simple CRUD, no complex patterns needed |
| II. Design Patterns | PASS | RESTful DELETE endpoint follows existing pattern |
| III. Git Flow | PASS | Using existing skills |
| IV. TDD | PASS | Implementation MUST use TDD per spec |

**No violations detected.**

---

## Project Structure

### Documentation (this feature)

```text
specs/002-delete-job-icon/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (inline in data-model.md)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── routes.py        # Add DELETE /job-offers/{id} endpoint
├── services/
│   └── job_offers.py    # Add delete method to service

extension/
├── popup/
│   ├── popup.css       # Update width 480px → 576px
│   └── popup.js        # Add delete button to job list items
```

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

---

## Research Decisions

### Key Decisions (from research.md):

1. **Popup Width**: Change `width: 480px;` to `width: 576px;` in popup.css (line 17)
2. **DELETE Endpoint**: Add at `/job-offers/{job_offer_id}` with 204 No Content
3. **Delete Order**: Delete job_offers_process first, then job_offers (FK constraint)
4. **TDD**: Mandatory per Constitution IV

---

## Design Decisions

### Data Model Entities:

- **JobOffer**: Existing PostgreSQL entity (id, title, url, description, company, timestamps)
- **JobOfferProcess**: Existing entity with FK to JobOffer
- **DeleteAction**: Response wrapper with job_offer_id, result, error_message

### API Contract:

- DELETE `/job-offers/{job_offer_id}` returns 204 No Content
- Errors: 400 (invalid ID), 404 (not found), 500 (internal), 503 (DB unavailable)

### UI Contract:

- Delete button in each `.job-link-item`
- Uses existing `.cl-actions` container pattern
- Icon: Trash/delete consistent with extension

---

## Phase 0 Research Complete

All clarification items resolved in research.md.

## Phase 1 Design Complete

Data model, contracts, and technical context documented in data-model.md.

---

## Next Steps

1. Run `/speckit.tasks` to generate task list
2. Implement with TDD - write failing tests first
3. Use `speckit.git.commit` at workflow boundaries

---

## Output Files

| File | Status |
|------|--------|
| plan.md | Complete |
| research.md | Complete |
| data-model.md | Complete |
| quickstart.md | TBD (not required for this feature) |
| tasks.md | TBD (via /speckit.tasks) |