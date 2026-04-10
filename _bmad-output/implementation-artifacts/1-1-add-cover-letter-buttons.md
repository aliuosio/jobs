---
story_id: 1.1
story_key: 1-1-add-cover-letter-buttons
epic: cover-letter-generation
status: done
created_date: 2026-04-09
---

# Story 1.1: Add Cover Letter UI Buttons

## Story Header

| Field | Value |
|-------|-------|
| **Story ID** | 1.1 |
| **Story Key** | 1-1-add-cover-letter-buttons |
| **Epic** | Cover Letter Generation |
| **Status** | ready-for-dev |
| **Priority** | High |

---

## User Story

**As a** job seeker
**I want to** see "Save Description" and "Generate Cover Letter" buttons on each job row
**So that** I can save job descriptions and trigger cover letter generation from the extension

---

## Acceptance Criteria

### AC 1: Save Description Button
- [ ] Button appears on each job row in the Job Links list
- [ ] Button text: "Save Desc" (compact for popup space)
- [ ] Button is disabled when job already has description saved
- [ ] Button shows spinner/loading state when saving

### AC 2: Generate Cover Letter Button
- [ ] Button appears on each job row
- [ ] Button text: "Generate"
- [ ] Button is disabled when no description saved
- [ ] Button shows spinner + elapsed time when generating

### AC 3: Status Badge
- [ ] Status badge shows on each job row
- [ ] States: "No Desc" (gray), "Saved" (green), "Generating..." (yellow), "Ready" (green), "Error" (red)
- [ ] Badge updates in real-time during generation

---

## Technical Requirements

### Files to Modify

| File | Changes |
|------|---------|
| `extension/popup/popup.html` | Add button elements per job row |
| `extension/popup/popup.css` | Add badge styles |

### UI Placement

The buttons should be added inside the job row element. Current job row structure:
```
job-links-list
  └── job-link-item (repeated)
       ├── job-link-title
       ├── job-link-company
       ├── job-link-status-badge
       └── [NEW: action-buttons]
            ├── [Save Desc button]
            └── [Generate button]
```

### Button Structure

```html
<div class="job-actions">
  <button class="btn btn-small btn-secondary save-desc-btn" data-job-id="{{id}}">
    Save Desc
  </button>
  <button class="btn btn-small btn-primary generate-btn" data-job-id="{{id}}" disabled>
    Generate
  </button>
</div>
```

### Badge Structure

```html
<span class="badge badge-{{status}}">{{status_text}}</span>
```

---

## Architecture Compliance

- Follow existing `popup.css` patterns for buttons
- Reuse existing `.btn`, `.btn-primary`, `.btn-secondary` classes
- Add new `.badge` classes per UX spec: Ready (#28a745), Generating (#ffc107), No Desc (#6c757d), Error (#dc3545)
- Keep button text under 12px for popup space

---

## Developer Notes

- Do NOT modify job list rendering logic in popup.js - that's story 1.3
- Buttons need `data-job-id` attribute for event handler lookup
- Status badge uses job's existing `description` field (null = No Desc)
- Cover letter content goes to `job_applications.content` table - not displayed in extension

---

## Dependencies

- Story 1.2: API service methods for save description
- Story 1.3: Event handlers and state management
