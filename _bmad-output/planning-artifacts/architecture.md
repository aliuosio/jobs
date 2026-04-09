---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', 'docs/project-overview.md']
workflowType: 'architecture'
status: 'complete'
---

# Architecture Document - jobs

**Author:** User
**Date:** 2026-04-09

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

| ID | Capability | Architectural Implication |
|----|-------------|---------------------------|
| FR-01 | Save Job Description | Extension to FastAPI integration |
| FR-02 | Trigger Cover Letter Generation | Extension to n8n direct webhook |
| FR-03 | Display Generation Status | UI state management |
| FR-04 | Handle Webhook Response | Event handling |
| FR-05 | Error Handling | Error state + retry UI |
| FR-06 | Manual Description Input | Form input fallback |

**Non-Functional Requirements:**

| Category | Requirement | Impact |
|----------|-------------|--------|
| Performance | ~30 sec to 2 min response | Async UI handling |
| Reliability | Webhook timeout | Retry logic |
| Security | localhost webhook | Development only |
| Usability | Clear error messages | UX consideration |

---

### Scale & Complexity

- **Primary domain:** Browser Extension + API + Workflow
- **Complexity level:** Medium (3-system integration)
- **Architectural components:** 3 (Extension, FastAPI, n8n)

### Technical Constraints & Dependencies

- Extension runs in Firefox (Manifest v3)
- FastAPI at localhost:8000
- n8n at localhost:5678
- Existing DB: job_offers, job_applications tables
- Storage: browser.storage.local (already in use)

### Cross-Cutting Concerns

- Authentication: Extension ↔ FastAPI (reuse existing)
- State sync: SSE already in use
- Error handling: Consistent across all components

---

## Starter Template Evaluation

### Technology Domain

**Existing Extension + API + Workflow** - This is a brownfield project (extending existing code)

### Existing Technology Stack

| Component | Technology |
|-----------|------------|
| Extension | JavaScript ES6+, Firefox Manifest v3 |
| Backend | Python FastAPI |
| Database | PostgreSQL (existing tables) |
| Automation | n8n workflows (existing) |

### Code Structure for New Feature

Files to modify:
- `popup.html` - Add UI buttons per job row
- `popup.js` - Add event handlers
- `services/api-service.js` - Add FastAPI call for description save

New feature organization:
- Buttons in Job Links tab (per-job row)
- Status indicator per job
- Error handling with retry

### Implementation Approach

1. **Add buttons** in `popup.html` - per job row element
2. **Add handlers** in `popup.js` - click events
3. **Add API method** - POST to FastAPI for description
4. **Add webhook trigger** - fetch to n8n URL
5. **Update UI state** - status badge per job

---

## Core Architectural Decisions

### 1. API Endpoint - Save Job Description

**Decision:** Reuse existing `PATCH /job-offers/{id}` endpoint
- Add `description` field to request body
- No new endpoint needed

### 2. Extension → n8n Communication

**Decision:** Direct fetch from extension to n8n webhook
- URL: `http://localhost:5678/webhook/writer`
- Payload: `{ "job_offers_id": 123 }`
- Simpler, no FastAPI middle layer

### 3. Webhook Response Handling

**Decision:** Wait for completion ping
- n8n "Respond to Webhook" node returns response
- Extension updates UI status on receipt

### 4. Error Handling Strategy

**Decision:** Retry button + manual fallback
- Show error message + "Retry" button
- Offer "Paste manually" if description scrape fails

### 5. Data Storage

| Data | Storage |
|------|---------|
| Job description | `job_offers.description` (DB) |
| Cover letter | `job_applications.content` (DB) |
| UI status | `browser.storage.local` (extension) |

### 6. Architecture Summary

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Extension  │───▶│  FastAPI   │───▶│    n8n     │
│  (popup)    │    │ (PATCH)    │    │ (webhook)   │
└─────────────┘    └─────────────┘    └─────────────┘
      │                                       │
      ▼                                       ▼
┌─────────────┐                      ┌─────────────┐
│  browser.    │                      │ job_applic- │
│  storage    │                      │ ations DB   │
└─────────────┘                      └─────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **popup.js** | UI buttons, event handlers, status display |
| **api-service.js** | Fetch to FastAPI (description save) |
| **n8n webhook** | Generate cover letter, save to DB |
| **FastAPI** | Persist description to job_offers |

---

## Implementation Patterns & Consistency Rules

### UI Patterns (Existing)

| Pattern | Rule |
|---------|------|
| Button classes | `btn btn-primary`, `btn btn-secondary` |
| Status indicators | Use existing loading/error classes |
| Event handlers | Attach in `init()` function |
| State management | Variables at top, DOM refs in `elements` |

### API Communication Patterns

| Pattern | Rule |
|---------|------|
| API calls | `fetch()` with async/await |
| Error handling | Try/catch with user feedback |
| Response parsing | `.json()` then update UI |

### Storage Patterns

| Pattern | Rule |
|---------|------|
| Keys | Define in `STORAGE_KEYS` constant |
| Access | `browser.storage.local.get/set` |
| Versioning | Track in `STORAGE_VERSION` |

### Naming Conventions

| Pattern | Rule |
|---------|------|
| Functions | `camelCase`, verb first |
| DOM elements | `elements.{name}` structure |
| Constants | `UPPER_SNAKE_CASE` |
| Event handlers | `on{Event}{Element}` |

### Consistency Rules for AI Agents

| Rule | Description |
|------|-------------|
| No new dependencies | Use existing services only |
| Reuse patterns | Match existing popup.js structure |
| Error messages | Use existing `showError()` pattern |
| State updates | Update `elements.*` references |

---

## Project Structure & Boundaries

### Modified Files (Brownfield)

```
extension/
├── popup/
│   ├── popup.html     ← Add buttons to job list
│   └── popup.js       ← Add event handlers, state
├── services/
│   └── api-service.js ← Add save description call
```

### No New Files

All functionality uses existing patterns and services.

### Boundaries

| Boundary | Description |
|----------|-------------|
| Extension | UI + event handling only |
| FastAPI | Existing endpoint (no new) |
| n8n | Existing workflow (no changes) |
| DB | Existing tables (no schema) |

---

## Architecture Validation

### Functional Requirements Coverage

| FR | Requirement | Architecture | Status |
|----|-------------|--------------|--------|
| FR-01 | Save Job Description | PATCH endpoint + popup button | ✅ |
| FR-02 | Trigger Cover Letter | Direct n8n webhook | ✅ |
| FR-03 | Display Status | UI status badge | ✅ |
| FR-04 | Handle Response | Webhook handler | ✅ |
| FR-05 | Error Handling | Retry button | ✅ |
| FR-06 | Manual Input | Fallback form | ✅ |

### Non-Functional Requirements Coverage

| NFR | Requirement | Coverage | Status |
|-----|-------------|----------|--------|
| Performance | ~30 sec response | Async UI | ✅ |
| Reliability | Webhook timeout | Retry logic | ✅ |
| Security | localhost | Dev only | ✅ |
| Usability | Clear errors | Error UI | ✅ |

---

## Architecture Complete ✅