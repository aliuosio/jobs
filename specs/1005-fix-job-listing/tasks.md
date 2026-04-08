---

description: "Task list for Fix Job Listing Bug - 1005-fix-job-listing"
---

# Tasks: Fix Job Listing Bug

**Input**: Design documents from `/specs/1005-fix-job-listing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Created and passing in extension/tests/

**Organization**: Single user story (P1) - bug fix with minimal implementation

## Phase 1: Implementation (Bug Fix)

**Goal**: Fix the broken refresh button by adding the missing `handleRefreshLinksClick` function

**Independent Test**: Open extension popup, click "Refresh Jobs" button, verify jobs list updates

### Implementation

- [X] T001 [US1] Add missing `handleRefreshLinksClick()` function in extension/popup/popup.js (after line 296)

---

## Phase 2: Testing

**Purpose**: Verify the fix works with unit tests

- [X] T002 Create unit tests in extension/tests/refresh-button.test.js
- [X] T003 Run all tests - 35 passing (27 job-links + 8 refresh-button)

---

## Phase 3: Verification & Polish

**Purpose**: Verify the fix works in browser

- [ ] T004 Verify the refresh button now works by testing in Firefox extension
- [ ] T005 Verify auto-load on popup open still works correctly

---

## Implementation Complete

All code tests passing. The fix was adding a single function:

```javascript
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}
```

This connects the existing `forceRefreshJobLinks()` function to the event listener that was already set up at line 211 but had no implementation.

### Test Results

```
=== Refresh Button Bug Fix Tests ===
  ✓ handleRefreshLinksClick function exists
  ✓ handleRefreshLinksClick is async
  ✓ refresh button element exists
  ✓ forceRefreshJobLinks fetches job offers from API
  ✓ Button is disabled during refresh
  ✓ Button is re-enabled after refresh completes
  ✓ Shows error when API is unavailable
  ✓ Shows cached data when API fails but cache exists

Refresh Button Tests: 8 passed, 0 failed
Job Links Tests: 27 passed, 0 failed
Total: 35 passing
```
