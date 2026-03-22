# Implementation Plan: Job Status List Filtering Fix

**Branch**: `011-job-status-filter-fix` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-job-status-filter-fix/spec.md`

## Summary

Fix and enhance job status list filtering in the Firefox extension popup. On initial load, show only non-applied jobs. Add a "Show Applied" toggle to temporarily reveal applied jobs. Clicking the status icon marks a job as applied (red icon) and removes it from the default view. Refresh maintains the current filter state.

**Technical approach**: Client-side filtering using existing `filterNotAppliedLinks()` function, extended with a persistent filter state toggle.

## Technical Context

**Language/Version**: JavaScript (ES6+)  
**Primary Dependencies**: Firefox Extension APIs (browser.*)  
**Storage**: browser.storage.local  
**Testing**: Manual browser testing + extension/tests/job-links.test.js  
**Target Platform**: Firefox 109+ (Manifest v3)  
**Project Type**: Browser Extension (popup UI)  
**Performance Goals**: <500ms toggle response  
**Constraints**: Manifest v3 compatibility, no external dependencies  
**Scale/Scope**: Single popup, 3 files modified

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| SOLID | ✅ PASS | Small changes, single responsibility maintained |
| DRY | ✅ PASS | Reuses existing filterNotAppliedLinks() |
| YAGNI | ✅ PASS | Only implements specified behavior |
| KISS | ✅ PASS | Simple checkbox toggle, no complex abstraction |
| Type Safety | ✅ PASS | JSDoc annotations already present |

## Project Structure

### Source Code (modifications)

```text
extension/
├── popup/
│   ├── popup.html     # Add Show Applied checkbox
│   ├── popup.css      # Add toggle styles
│   └── popup.js       # Add filter state management
└── background/
    └── background.js  # No changes needed (API already works)
```

### Documentation (this feature)

```text
specs/011-job-status-filter-fix/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Data model documentation
├── quickstart.md        # Testing guide
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md # Validation checklist
```

## Implementation Details

### Phase 1: UI Changes

**popup.html** — Add toggle element in job-links-section:
```html
<div class="filter-row">
  <label class="filter-checkbox">
    <input type="checkbox" id="show-applied-toggle">
    <span>Show Applied</span>
  </label>
</div>
```

**popup.css** — Add styles:
```css
.filter-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.filter-checkbox input {
  cursor: pointer;
}
```

### Phase 2: State Management (popup.js)

**Additions to state:**
```javascript
// Add to STORAGE_KEYS
const STORAGE_KEYS = {
  // ... existing keys
  SHOW_APPLIED_FILTER: 'showAppliedFilter'
};

// Add to state variables
let showAppliedFilter = false;

// Add function to restore filter state
async function restoreShowAppliedFilter() {
  const state = await loadStateFromStorage();
  showAppliedFilter = state[STORAGE_KEYS.SHOW_APPLIED_FILTER] || false;
  document.getElementById('show-applied-toggle').checked = showAppliedFilter;
}

// Modify filter function
function filterJobLinks(links, showApplied) {
  if (showApplied) {
    return links; // Show all
  }
  return links.filter(link => !link.applied);
}

// Modify render call sites to use filter
const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
renderJobLinksList(filteredLinks);
```

**Toggle handler:**
```javascript
async function handleShowAppliedToggle() {
  showAppliedFilter = document.getElementById('show-applied-toggle').checked;
  await saveStateToStorage({ [STORAGE_KEYS.SHOW_APPLIED_FILTER]: showAppliedFilter });
  const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
  renderJobLinksList(filteredLinks);
}
```

### Phase 3: Integration

1. Add event listener in `setupEventListeners()`
2. Call `restoreShowAppliedFilter()` in `init()`
3. Ensure `handleStatusClick()` re-renders with current filter state
4. Ensure refresh (`loadJobLinks()`) uses current filter state

## Files Summary

| File | Changes | Risk |
|------|---------|------|
| popup.html | Add checkbox + label | Low |
| popup.css | Add ~15 lines styles | Low |
| popup.js | Add state, functions, event listeners | Medium |

## Complexity Tracking

> No violations. Simple feature with no Constitution tradeoffs needed.
