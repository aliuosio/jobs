# Tasks: Refresh Jobs Fix

## Overview

Fix the "Refresh Jobs" button in the extension popup to force fresh data fetch from the API when clicked.

## Implementation Tasks

### T1: Add `forceRefreshJobLinks()` function
**File**: `extension/popup/popup.js`

**Location**: Add after `handleRefreshLinksClick()` function (around line 36-3610)

**Changes**:
```diff
------- SEARCH
/**
 * Handle Refresh Jobs button click
 */
async function handleRefreshLinksClick() {
  await loadJobLinks();
}
=======
/**
 * Handle Refresh Jobs button click - force fresh fetch
 */
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}
+++++++ REPLACE
</diff>
- [x] Analyze the refresh jobs issue in popup.js
- [x] Review background.js message handling for get_JOB_OFFERS
- [x] identify the root cause
- [x] create spec following GitHub Speckit Framework
- [x] implement the fix in popup.js
- [X] Update verification-checklist.md
</write_to_file>