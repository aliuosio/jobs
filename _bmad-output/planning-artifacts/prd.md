---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['specs/007-update-job-offer-api/research.md', 'specs/012-job-status-sync/research.md', 'specs/1008-rag-hybrid-upgrades/research.md', 'docs/project-overview.md', 'n8n-workflows/6.Job Application Writer.json', 'n8n-workflows/Job Offers - store.json']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 15
  brainstorming: 0
  projectDocs: 1
  n8nWorkflows: 9
classification:
  projectType: 'Browser Extension + API + Workflow Automation'
  domain: 'HR Tech / Job Application Automation'
  complexity: 'Medium-High'
  projectContext: 'brownfield'
productVision:
  summary: 'Automate cover letter creation entirely - user clicks a button, n8n generates letter from job description using resume data, saves to DB'
  differentiator: 'Seamless integration: extension scans job → triggers n8n → letter saved directly to job_applications table'
successCriteria:
  user: 'Click Generate → letter ready in ~30 sec to 2 min, UI shows Loading → Ready'
  technical: 'Webhook triggers, data saved to job_applications.content, UI updates'
  business: 'Count letters generated, time saved vs manual'
scope:
  mvp: 'Save Description button + Generate button + webhook trigger + UI status'
  growth: 'Auto-scan, multiple versions, edit letter'
  vision: 'Full auto-apply, templates, tone customization'
status: 'complete'
---

# Product Requirements Document - jobs

**Author:** User
**Date:** 2026-04-09

## Executive Summary

This feature automates cover letter creation entirely for job applications. Users select a job from the extension's job list, extract the job description from the posting, and trigger the n8n workflow to generate a tailored cover letter saved directly to the database.

### What Makes This Special

The feature eliminates manual cover letter writing completely. Instead of drafting from scratch, users click a button. The n8n "6.Job Application Writer" workflow already generates cover letters using AI with resume context from the RAG pipeline. The extension now provides the UI trigger and job description input.

The workflow is:
1. User clicks job in extension → page opens
2. Extension "Save Description" button → scrapes job description → saves to `job_offers.description` via FastAPI
3. Extension "Generate Cover Letter" button → triggers `http://localhost:5678/webhook/writer` directly
4. n8n generates letter using job description + resume data → saves to `job_applications.content`
5. n8n Respond to Webhook → returns feedback to extension
6. Extension updates UI with "Ready" status

No polling, no DB monitoring - just webhook callback.

### Project Classification

| Aspect | Value |
|--------|-------|
| Project Type | Browser Extension + API + Workflow Automation |
| Domain | HR Tech / Job Application Automation |
| Complexity | Medium-High (3-system integration) |
| Context | Brownfield (extending existing Jobs project) |

---

## Success Criteria

### User Success

| Criteria | Target |
|----------|--------|
| Generate cover letter | User clicks "Generate" → letter ready |
| Time to generate | ~30 sec to 2 min (n8n workflow duration) |
| UI status | Shows "Generating..." → "Ready" |

### Technical Success

| Criteria | Target |
|----------|--------|
| Webhook trigger | n8n responds at `/webhook/writer` |
| Data saved | Letter in `job_applications.content` |
| UI update | Status badge after webhook response |

### Business Success

| Criteria | Target |
|----------|--------|
| Letters generated | Count in `job_applications` table |
| Time saved | Manual writing vs automated |

---

## Product Scope

### MVP

- "Save Description" button → scrapes job description → saves to `job_offers.description` via FastAPI
- "Generate Cover Letter" button → triggers n8n webhook directly
- UI status indicators → shows generation progress
- Handle webhook response → update UI with "Ready" status

### Growth Features (Post-MVP)

- Auto-scan description on page load
- Multiple cover letter versions per job
- Edit generated letter in extension

### Vision (Future)

- Full auto-apply end-to-end workflow
- Cover letter templates
- AI tone/style customization

---

## User Journeys

### Primary User: Job Seeker

#### Happy Path Journey

| Step | Action | Emotional State |
|------|--------|------------------|
| 1 | Open extension popup | Focused |
| 2 | Browse job list | Hopeful |
| 3 | Click on a job | Interested |
| 4 | Click "Save Description" | Anticipating |
| 5 | Page scrapes, saves to DB | Confident |
| 6 | Click "Generate Cover Letter" | Excited |
| 7 | UI shows "Generating..." | Waiting |
| 8 | n8n processes → saves letter | Relieved |
| 9 | UI shows "Ready" | Delighted |
| 10 | Open cover letter | Accomplished |

#### Edge Case: n8n Timeout

| Step | Action | Emotional State |
|------|--------|------------------|
| 1 | Click "Generate Cover Letter" | Hopeful |
| 2 | UI shows "Generating..." | Waiting |
| 3 | Timeout after 2 min | Frustrated |
| 4 | Show error + "Retry" button | Annoyed but hopeful |
| 5 | Click Retry | Determined |
| 6 | Success → "Ready" | Delighted |

#### Edge Case: Description Scrape Fails

| Step | Action | Emotional State |
|------|--------|------------------|
| 1 | Click "Save Description" | Anticipating |
| 2 | Scrape fails | Frustrated |
| 3 | Show error + "Paste manually" link | Annoyed but options available |
| 4 | User pastes description | Resumed progress |
| 5 | Save succeeds | Relieved |

---

## Journey Requirements Summary

| Capability | From Journey |
|------------|--------------|
| Description scraping | Happy Path + Edge Case scrape fail |
| Webhook trigger | Happy Path |
| UI status indicators | Happy Path + Edge Case timeout |
| Error handling + retry | Edge Case timeout |
| Manual description fallback | Edge Case scrape fail |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**Seamless Integration Pattern** - This feature tightens three existing systems (Firefox extension, FastAPI, n8n) into one unified workflow. The innovation isn't in individual components but in the integration:

- Extension → FastAPI → n8n → Extension (direct callback)
- No manual copy-paste between tools
- User perceives single application, not three systems

### Market Context

Cover letter generators exist (CoolCV, Resume.io, etc.). What makes this different is the **tight integration** with the user's existing job search workflow - no context switching between browser, generator, and application tracker.

### Validation Approach

- Track user completion rate: click → generate → ready
- Measure time from click to "Ready" status
- Compare to manual cover letter writing time

### Risk Mitigation

- Webhook timeout → retry button
- Description scrape fail → manual paste option
- n8n failure → graceful error with message

---

## Technical Requirements

### Extension - Description Scraping

- **Method**: User selects content area on page → clicks "Save Description" button
- **Scraping**: Extract selected text content
- **Fallback**: Manual paste if selection fails

### API Communication

- **Endpoint**: `PUT /job-offers/{id}` with description in request body
- **Data Format**: JSON `{ "description": "..." }`
- **Auth**: Uses existing extension → FastAPI auth

### n8n Webhook Trigger

- **URL**: `http://localhost:5678/webhook/writer`
- **Payload**: `{ "job_offers_id": 123 }`
- **Response Handling**: Parse webhook response, update UI status

### Storage Strategy

- **Storage**: browser.storage.local (already in use)
- **Cache**: Description per job + cover letter status
- **Sync**: Uses FastAPI SSE for status updates

---

## Project Scope Definition

### MVP Scope (Phase 1 - Must Have)

| Feature | Priority |
|---------|----------|
| "Save Description" button | Must-have |
| "Generate Cover Letter" button | Must-have |
| UI status indicators | Must-have |
| Handle webhook response | Must-have |
| Error handling + retry | Must-have |

### Growth Features (Phase 2)

| Feature | Rationale |
|---------|----------|
| Auto-scan description | Nice convenience |
| Multiple letter versions | Per job |
| Edit generated letter | User control |

### Vision Features (Phase 3)

| Feature | Rationale |
|---------|----------|
| Full auto-apply | End-to-end |
| Cover letter templates | Customization |
| AI tone/style | Personalization |

---

## Functional Requirements

| ID | Capability | Description |
|----|-------------|-------------|
| **FR-01** | Save Job Description | User clicks button → description scraped → saved to job_offers DB |
| **FR-02** | Trigger Cover Letter Generation | User clicks button → n8n webhook triggered → letter generated |
| **FR-03** | Display Generation Status | UI shows "Generating..." during → ping "Done" when complete |
| **FR-04** | Handle Webhook Response | Receive end-of-workflow ping → update UI status |
| **FR-05** | Error Handling | Show error message → offer retry on failure |
| **FR-06** | Manual Description Input | If scrape fails → user can paste description manually |

**Note:** Cover letter content retrieved directly from `job_applications.content` via DB viewer.

---

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Webhook response time | ~30 sec to 2 min (n8n workflow duration) |
| **Performance** | UI responsiveness | Non-blocking during generation |
| **Reliability** | Webhook timeout handling | Retry after timeout |
| **Security** | Webhook URL | localhost only (development) |
| **Usability** | Error messages | Clear, actionable |
| **Usability** | UI feedback | Status indicators clear |