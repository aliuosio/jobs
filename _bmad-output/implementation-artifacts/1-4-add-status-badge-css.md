---
story_id: 1.4
story_key: 1-4-add-status-badge-css
epic: cover-letter-generation
status: done
created_date: 2026-04-09
---

# Story 1.4: Add CSS for Status Badges

## Story Header

| Field | Value |
|-------|-------|
| **Story ID** | 1.4 |
| **Story Key** | 1-4-add-status-badge-css |
| **Epic** | Cover Letter Generation |
| **Status** | ready-for-dev |
| **Priority** | Medium |

---

## User Story

**As a** job seeker
**I want to** see clear visual status indicators on each job row
**So that** I know at a glance what state each job's cover letter is in

---

## Acceptance Criteria

### AC 1: Badge Colors
- [ ] `.badge-ready` - Green background (#28a745)
- [ ] `.badge-generating` - Yellow background (#ffc107), dark text for contrast
- [ ] `.badge-no-desc` - Gray background (#6c757d)
- [ ] `.badge-error` - Red background (#dc3545)

### AC 2: Badge Typography
- [ ] Font size: 11px
- [ ] Font weight: 600
- [ ] Padding: 3px 6px
- [ ] Border radius: 3px

### AC 3: Button Styles
- [ ] `.btn-small` class for compact buttons (existing or new)
- [ ] Button padding: 4px 8px
- [ ] Button font size: 11px
- [ ] Disabled state styling

### AC 4: Job Actions Container
- [ ] `.job-actions` container for button grouping
- [ ] Flexbox layout, gap: 4px
- [ ] Float right or position absolute

### AC 5: Loading State
- [ ] Spinner animation for generating state
- [ ] Pulsing effect for active generation

---

## Technical Requirements

### File to Modify

| File | Changes |
|------|---------|
| `extension/popup/popup.css` | Add badge and button styles |

### CSS to Add

```css
/* Status Badge Base */
.badge {
  display: inline-block;
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Badge States */
.badge-ready {
  background-color: #28a745;
  color: #fff;
}

.badge-generating {
  background-color: #ffc107;
  color: #212529;
}

.badge-no-desc {
  background-color: #6c757d;
  color: #fff;
}

.badge-error {
  background-color: #dc3545;
  color: #fff;
}

/* Job Actions Container */
.job-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 6px;
}

/* Small Button Override */
.btn-small {
  padding: 4px 8px;
  font-size: 11px;
  line-height: 1.4;
}

/* Generating Button State */
.btn-generating {
  position: relative;
  cursor: wait;
}

.btn-generating::after {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-left: 4px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Badge with elapsed time */
.badge-generating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.elapsed-time {
  font-weight: 700;
  font-family: monospace;
}
```

---

## Architecture Compliance

- Follow existing popup.css structure and organization
- Use CSS custom properties if already defined
- Match existing color usage patterns
- Keep specificity low for maintainability

---

## Developer Notes

- The `.badge` class might conflict with existing Bootstrap-style - check if already exists
- If conflict, use `.cl-badge` prefix (cover letter badge)
- Yellow (#ffc107) needs dark text for WCAG AA contrast - use #212529
- Elapsed time should use monospace font for stability

---

## Dependencies

- Story 1.1: HTML buttons and badge elements
- Story 1.3: JavaScript sets badge class based on state

---

## Stories Complete

| Story | Status |
|-------|--------|
| 1.1 Add UI buttons to popup.html | ✅ ready-for-dev |
| 1.2 Add API service methods | ✅ ready-for-dev |
| 1.3 Add event handlers and state | ✅ ready-for-dev |
| 1.4 Add CSS for status badges | ✅ ready-for-dev |
