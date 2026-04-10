---
story_id: 1.3
story_key: 1-3-add-event-handlers-state
epic: cover-letter-generation
status: done
created_date: 2026-04-09
---

# Story 1.3: Add Event Handlers and State

## Story Header

| Field | Value |
|-------|-------|
| **Story ID** | 1.3 |
| **Story Key** | 1-3-add-event-handlers-state |
| **Epic** | Cover Letter Generation |
| **Status** | ready-for-dev |
| **Priority** | High |

---

## User Story

**As a** extension popup
**I want to** handle button clicks and manage cover letter generation state
**So that** users can save descriptions and trigger generation with proper feedback

---

## Acceptance Criteria

### AC 1: Save Description Handler
- [ ] Click handler on "Save Desc" button
- [ ] Scrapes selected text from current job page OR prompts for manual input
- [ ] Calls `saveJobDescription(jobId, description)` from api-service
- [ ] On success: enables "Generate" button, updates badge to "Saved"
- [ ] On error: shows error message with retry option

### AC 2: Generate Cover Letter Handler
- [ ] Click handler on "Generate" button
- [ ] Calls `triggerCoverLetterGeneration(jobId)` from api-service
- [ ] Shows "Generating..." status with elapsed time counter
- [ ] Polls every 5 seconds for completion (up to 3 min timeout)
- [ ] On success: updates badge to "Ready"
- [ ] On error/timeout: shows "Error" badge with retry button

### AC 3: State Management
- [ ] Track generation state per job: 'none', 'saving', 'saved', 'generating', 'ready', 'error'
- [ ] Update job list rendering to show current state
- [ ] Persist state to browser.storage.local
- [ ] Handle duplicate click prevention (disable button during processing)

---

## Technical Requirements

### File to Modify

| File | Changes |
|------|---------|
| `extension/popup/popup.js` | Add state, handlers, update renderJobLinksList |

### State Structure

```javascript
// Add to STORAGE_KEYS
const STORAGE_KEYS = {
  // ... existing keys
  COVER_LETTER_STATES: 'coverLetterStates'
};

// Add to state
let coverLetterStates = {}; // { jobId: { status, startTime, error } }
```

### New Functions

```javascript
// Handle Save Description click
async function handleSaveDescription(jobId) {
  const job = jobLinks.find(j => j.id === jobId);
  if (!job) return;
  
  // Get description - prioritize selected text from page
  // Fallback: prompt user to paste
  const description = await getSelectedTextOrPrompt();
  
  updateJobState(jobId, 'saving');
  try {
    await saveJobDescription(jobId, description);
    updateJobState(jobId, 'saved');
    enableGenerateButton(jobId);
  } catch (error) {
    updateJobState(jobId, 'error', error.message);
  }
}

// Handle Generate click
async function handleGenerateCoverLetter(jobId) {
  updateJobState(jobId, 'generating', Date.now());
  
  try {
    await triggerCoverLetterGeneration(jobId);
    
    // Poll for completion
    const result = await pollForCompletion(jobId, 300000); // 5 min max
    if (result.completed) {
      updateJobState(jobId, 'ready');
    } else {
      updateJobState(jobId, 'error', 'Generation timed out');
    }
  } catch (error) {
    updateJobState(jobId, 'error', error.message);
  }
}

// Poll for generation completion
async function pollForCompletion(jobId, timeoutMs) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await sleep(5000); // 5 second polling
    const status = await checkGenerationStatus(jobId);
    if (status === 'completed') return { completed: true };
    if (status === 'failed') return { completed: false };
  }
  return { completed: false };
}
```

### Update renderJobLinksList

The job row HTML needs to include buttons and badge with state:

```javascript
// In renderJobLinksList, add state-aware elements:
const state = coverLetterStates[link.id] || { status: 'none' };
const badgeClass = getBadgeClass(state.status);
const badgeText = getBadgeText(state.status);
const canGenerate = state.status === 'saved' || state.status === 'ready';
const isGenerating = state.status === 'generating';
const elapsedTime = isGenerating ? formatElapsedTime(Date.now() - state.startTime) : '';

const html = `
  ...
  <span class="badge ${badgeClass}">${badgeText} ${elapsedTime}</span>
  <div class="job-actions">
    <button class="btn btn-small btn-secondary save-desc-btn" 
            data-job-id="${link.id}"
            ${state.status !== 'none' ? 'disabled' : ''}>
      Save Desc
    </button>
    <button class="btn btn-small btn-primary generate-btn"
            data-job-id="${link.id}"
            ${!canGenerate ? 'disabled' : ''}>
      ${isGenerating ? 'Generating...' : 'Generate'}
    </button>
  </div>
  ...
`;
```

---

## Architecture Compliance

- Follow existing popup.js patterns (async/await, error handling)
- Reuse `showError()` function for error display
- Use existing button classes from popup.css
- State persists to browser.storage.local like other app state

---

## Developer Notes

- Job description scraping: use browser.tabs.executeScript to get selected text
- If no selection, show simple prompt() for manual paste
- Elapsed time: update every second during generation
- Polling interval: 5 seconds (not too aggressive, not too slow)
- Max wait time: 3 minutes (then show timeout)

---

## Dependencies

- Story 1.1: UI buttons in popup.html
- Story 1.2: API service methods in api-service.js
- Story 1.4: CSS for badges (can be done in parallel)
