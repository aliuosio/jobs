# Implementation Plan: Job Applied Status Toggle

**Branch**: `008-job-applied-toggle` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-job-applied-toggle/spec.md`

## Summary

Add job applied status tracking to the Firefox extension popup. Replace dummy data with live `GET /job-offers` API call to fetch job links with `applied` status. Display green icon for applied jobs, red for not applied. Clicking the icon performs an optimistic `PATCH /job-offers/{id}/process` toggle with revert-on-failure. No backend changes required — the API endpoints already exist.

## Technical Context

**Language/Version**: JavaScript (ES6+), Firefox Extension Manifest v3  
**Primary Dependencies**: browser.runtime APIs, browser.storage, fetch (extension background)  
**Storage**: browser.storage.local (extension), PostgreSQL via existing FastAPI (backend already in place)  
**Testing**: Manual browser testing + simulated-browser-test.js patterns + API integration tests  
**Target Platform**: Firefox 109+ (Manifest v3)  
**Project Type**: Firefox Browser Extension (Manifest v3)  
**Performance Goals**: <2s initial fetch (SC-001), <500ms toggle feedback (SC-003)  
**Constraints**: Manifest v3, same-origin fetch to API base URL, debounce toggle clicks  
**Scale/Scope**: Small feature — 4 modified files (popup.html, popup.js, popup.css, background.js), no backend changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID | ✅ PASS | Each module (popup, background, API client) has single responsibility |
| II. DRY | ✅ PASS | Shared API client functions, no duplicated business logic |
| III. YAGNI | ✅ PASS | Only fetch, display, and toggle — no extra features |
| IV. KISS | ✅ PASS | Simple fetch → render → click-to-toggle flow |
| V. Type Safety | ✅ PASS | JSDoc annotations on all new functions, no `any` types |
| VI. Composition | ✅ PASS | Extension modules compose via explicit imports and message passing |
| VII. Git-Flow | ✅ PASS | Feature branch `008-job-applied-toggle` from `develop` |
| Runtime I–III | N/A | No embedding/retrieval changes |
| Runtime IV (CORS) | ✅ PASS | Backend already has CORS enabled for extension origin |
| Runtime V (Events) | N/A | No form field modifications in this feature |
| Runtime VI (Playwright) | ✅ PASS | Browser automation uses existing patterns |

## Project Structure

### Documentation (this feature)

```text
specs/008-job-applied-toggle/
├── plan.md              # This file
├── research.md          # Phase 0: API contract analysis + extension patterns
├── data-model.md        # Phase 1: Extension state model, API response shapes
├── quickstart.md        # Phase 1: How to test the feature
└── contracts/           # Phase 1: API contracts for job-offers endpoints
```

### Source Code (extension)

```text
extension/
├── popup/
│   ├── popup.html       # Modified: add loading/error containers
│   ├── popup.js        # Modified: API fetch, optimistic toggle, debounce, skeleton
│   └── popup.css       # Modified: skeleton placeholders, red applied indicator
├── background/
│   └── background.js   # Modified: add GET_JOB_OFFERS, UPDATE_APPLIED message handlers
└── manifest.json       # No changes needed
```

**Structure Decision**: Single extension project — only 4 files modified (no new files). Backend untouched. Extension follows existing popup/background/content pattern already established in the codebase.

## Complexity Tracking

No constitution violations. Single-responsibility: popup handles UI, background handles API communication, clean separation.

---

# Phase 0: Research

## Research: API Contract Analysis

### Finding 1: GET /job-offers

- **Endpoint**: `GET http://localhost:8000/job-offers`
- **Query params**: `limit?: int`, `offset?: int`
- **Response**: `{ job_offers: [{ id, title, url, process: { applied: bool|null } }] }`
- **Source**: `src/api/routes.py` lines 207–234, `src/api/schemas.py` lines 119–131

### Finding 2: PATCH /job-offers/{id}/process

- **Endpoint**: `PATCH http://localhost:8000/job-offers/{job_offer_id}/process`
- **Request body**: `{ applied?: bool }` (plus optional `research`, `research_email`)
- **Response**: `JobOfferWithProcess` object
- **Source**: `src/api/routes.py` lines 237–297, `src/api/schemas.py` lines 134–145

### Finding 3: Applied Status Derivation

- `process.applied === true` → green icon
- `process.applied === false` → red icon
- `process === null` OR `process.applied === null` → red icon (treat as "not applied")

## Research: Extension Patterns (existing codebase)

### Finding 4: Popup-to-Background Message Flow

- Popup sends `browser.runtime.sendMessage({ type: '...', data: ... })`
- Background listens via `browser.runtime.onMessage.addListener()`
- Responses sent back as `{ success: bool, ... }`
- Source: `extension/background/background.js` pattern

### Finding 5: Existing Job Links UI

- `popup.js` has `getDummyJobLinks()` returning static data with `status: 'new'`
- `renderJobLinksList()` generates HTML with `.job-status-${link.status}` classes
- Existing CSS classes: `.job-status-new` (green), `.job-status-viewed` (gray), `.job-status-saved` (blue)
- Need to add: `.job-status-applied` (green) and reuse `.job-status-new` can become red (not applied)

### Finding 6: API Client in Background

- `background.js` has `handleFillForm()` using `fetch()` with 10s timeout
- Pattern to replicate: fetch → check response.ok → parse JSON → return structured response
- `API_ENDPOINT = 'http://localhost:8000'`

## Phase 0 Conclusion

All unknowns resolved. No NEEDS CLARIFICATION items remain. API contracts confirmed, extension patterns established. Proceed to Phase 1.

---

# Phase 1: Design & Contracts

## Data Model

### Extension State (popup.js)

```typescript
// JobLinkState: drives the UI
interface JobLinkState {
  id: number;
  title: string;
  url: string;
  applied: boolean;       // derived: process?.applied ?? false
  pending: boolean;       // true during in-flight toggle request
  error: boolean;         // true if last toggle failed (for revert)
}
```

### API Response → UI State Mapping

```
GET /job-offers
  → JobOffersListResponse
  → JobOfferWithProcess { id, title, url, process: JobOfferProcess | null }
  → JobLinkState[] (filtered to id, title, url, applied)
```

### Toggle Request Flow

```
User clicks icon
  → Set pending=true, flip applied optimistically
  → Send PATCH /job-offers/{id}/process { applied: newValue }
  → Success: set pending=false, applied=newValue (already optimistic)
  → Failure: set pending=false, applied=oldValue (revert), show error
```

## Interface Contracts

### Popup ↔ Background Messages

**GET_JOB_OFFERS**: Popup → Background → API → Popup
```typescript
// popup.js → background.js
{ type: 'GET_JOB_OFFERS', data: { limit?: number, offset?: number } }

// background.js → popup.js
{ success: true, job_offers: JobOfferWithProcess[] }
{ success: false, error: { code: string, message: string } }
```

**UPDATE_APPLIED**: Popup → Background → API → Popup
```typescript
// popup.js → background.js
{ type: 'UPDATE_APPLIED', data: { job_offer_id: number, applied: boolean } }

// background.js → popup.js
{ success: true, job_offer_id: number, applied: boolean }
{ success: false, error: { code: string, message: string } }
```

### API Contracts

See `/contracts/` directory.

## Quickstart

### Testing the Feature

1. Start backend: `docker-compose up -d`
2. Load extension: Firefox → `about:debugging#/runtime/this-firefox` → Load Temporary Add-on
3. Open popup: Click extension icon
4. Job links section should show skeleton → fade in job list with icons
5. Click status icon → green↔red toggle with immediate feedback
6. Verify job title opens URL in new tab

### Manual Test Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Popup opens with network | 3-5 skeleton rows → job list with correct icons |
| API down | Error banner with retry button in job links section |
| Click applied (green) icon | Instant red, API call, persists on success |
| Click not-applied (red) icon | Instant green, API call, persists on success |
| Click icon with API failure | Icon reverts, error message shown |
| Rapid icon clicks | Debounced — only first click triggers API |
| Click job title | Opens job URL in new tab |
| Form filling | Works independently of job links section |
