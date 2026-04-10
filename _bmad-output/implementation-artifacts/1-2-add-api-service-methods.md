---
story_id: 1.2
story_key: 1-2-add-api-service-methods
epic: cover-letter-generation
status: done
created_date: 2026-04-09
---

# Story 1.2: Add API Service Methods

## Story Header

| Field | Value |
|-------|-------|
| **Story ID** | 1.2 |
| **Story Key** | 1-2-add-api-service-methods |
| **Epic** | Cover Letter Generation |
| **Status** | ready-for-dev |
| **Priority** | High |

---

## User Story

**As a** extension popup
**I want to** call API endpoints for saving job descriptions and triggering cover letter generation
**So that** the UI can communicate with FastAPI and n8n

---

## Acceptance Criteria

### AC 1: Save Job Description
- [ ] Function `saveJobDescription(jobId, description)` calls `PATCH /job-offers/{id}`
- [ ] Payload: `{ "description": "..." }`
- [ ] Returns updated job offer on success
- [ ] Throws error on failure

### AC 2: Trigger Cover Letter Generation
- [ ] Function `triggerCoverLetterGeneration(jobId)` calls n8n webhook
- [ ] Webhook URL: `http://localhost:5678/webhook/writer`
- [ ] Payload: `{ "job_offers_id": jobId }`
- [ ] Returns webhook response (success/error)

### AC 3: Check Generation Status
- [ ] Function `checkGenerationStatus(jobId)` polls for status
- [ ] Returns current status: 'pending', 'processing', 'completed', 'failed'
- [ ] Used for polling during generation

---

## Technical Requirements

### File to Modify

| File | Changes |
|------|---------|
| `extension/services/api-service.js` | Add new functions |

### API Endpoints

```javascript
// Save job description - uses existing endpoint
async function saveJobDescription(jobId, description) {
  const response = await fetch(`${API_ENDPOINT}/job-offers/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  if (!response.ok) throw new Error(`Save failed: ${response.status}`);
  return response.json();
}

// Trigger n8n cover letter generation
async function triggerCoverLetterGeneration(jobId) {
  const response = await fetch('http://localhost:5678/webhook/writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_offers_id: jobId })
  });
  if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
  return response.json();
}
```

### Constants to Add

```javascript
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/writer';
const N8N_WEBHOOK_TIMEOUT_MS = 120000; // 2 min max
```

---

## Architecture Compliance

- Follow existing `api-service.js` patterns (async/await, error handling)
- Reuse `API_ENDPOINT` constant
- Use same `API_TIMEOUT_MS` for consistency
- Throw descriptive errors for debugging

---

## Developer Notes

- The n8n webhook returns immediately - actual generation takes 30s-2min
- Cover letter is saved to `job_applications.content` by n8n workflow
- Extension retrieves letter via DB viewer (not shown in extension)
- For polling, check `job_applications` table for `content` field

---

## Dependencies

- Story 1.1: UI buttons in popup.html
- Story 1.3: Event handlers that call these functions
