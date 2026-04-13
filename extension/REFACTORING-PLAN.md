# Firefox Extension Refactoring Plan

**Generated:** 2026-04-13  
**Goal:** Full extension cleanup — deduplication, dead code removal, service consolidation, test fixes, consistency

---

## Executive Summary

| Category | Items | Priority | Est. Steps |
|----------|-------|----------|------------|
| Duplicate Constants | 6 groups | CRITICAL | 6 |
| Unused Services | 3 files | CRITICAL | 3 |
| Duplicate Functions | 1 | HIGH | 1 |
| Test Fixes | 2 files | HIGH | 2 |
| Code Smells | 4 categories | MEDIUM | 4 |
| Init Duplication | 1 location | LOW | 1 |
| **TOTAL** | | | **17 steps** |

---

## Phase 1: Test Fixes (PREREQUISITE)

Before any code changes, fix broken tests so we can verify after each step.

### Step 1.1: Fix Syntax Error in maxlength.test.js

**File:** `extension/tests/maxlength.test.js`  
**Lines:** 16-24  
**Issue:** Missing commas between destructured imports

```diff
 const {
   extractAutocomplete,
   extractAriaLabel,
   extractPlaceholder,
   buildFieldSignals,
   signalsToPayload
   countSignals      // ← MISSING COMMA
   cleanLabelText    // ← MISSING COMMA
 } = require('../content/signal-extractor.js');
```

**Action:** Add commas at lines 22-23

**Verification:** Run `node extension/tests/maxlength.test.js`

**Rollback:** Revert the two comma additions

---

### Step 1.2: Fix Invalid Framework in link-navigation.test.js

**File:** `extension/tests/link-navigation.test.js`  
**Lines:** 1-151  
**Issue:** Uses `jest.fn()` but runs as standalone Node script (no Jest)

**Solution:** Replace Jest assertions with custom assert functions matching other test files

**Changes needed:**
- Replace `jest.fn()` with custom mock functions
- Replace `expect().toHaveBeenCalledWith()` with manual assertions
- Replace `expect().toHaveClass()` with manual class checks
- Replace `beforeEach()` with inline setup in each test

**Verification:** Run `node extension/tests/link-navigation.test.js`

**Rollback:** Restore original Jest-based code

---

## Phase 2: Constants Deduplication (CRITICAL)

Create a single source of truth for all constants.

### Step 2.1: Create Constants Module

**New File:** `extension/services/constants.js`

```javascript
/**
 * Centralized constants for the extension
 * All other files should import from here
 */

// API Configuration
const API_ENDPOINT = 'http://localhost:8000';
const API_TIMEOUT_MS = 10000;
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/writer';

// SSE Configuration
const SSE_ENDPOINT = `${API_ENDPOINT}/api/v1/stream`;

// Cache Configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Storage Keys
const STORAGE_KEYS = {
  JOB_OFFERS: 'jobOffers',
  JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp',
  DETECTED_FIELDS: 'detectedFields',
  LAST_URL: 'lastUrl',
  LAST_TAB: 'lastTab',
  STORAGE_VERSION: 'storageVersion',
  SHOW_APPLIED_FILTER: 'showAppliedFilter',
  SSE_STATUS: 'sseStatus',
  VISITED_LINKS: 'visitedLinks',
  LAST_CLICKED_JOB_LINK: 'lastClickedJobLink'
};

const CURRENT_STORAGE_VERSION = 1;

if (typeof window !== 'undefined') {
  window.CONSTANTS = {
    API_ENDPOINT,
    API_TIMEOUT_MS,
    N8N_WEBHOOK_URL,
    SSE_ENDPOINT,
    CACHE_TTL_MS,
    STORAGE_KEYS,
    CURRENT_STORAGE_VERSION
  };
}

export {
  API_ENDPOINT,
  API_TIMEOUT_MS,
  N8N_WEBHOOK_URL,
  SSE_ENDPOINT,
  CACHE_TTL_MS,
  STORAGE_KEYS,
  CURRENT_STORAGE_VERSION
};
```

**Verification:** Create file, run lint if available

**Rollback:** Delete the new file

---

### Step 2.2: Update background.js to Use Constants

**File:** `extension/background/background.js`  
**Lines:** 1-15 (constants), plus scattered usage  

**Actions:**
1. Add at top: `import { API_ENDPOINT, SSE_ENDPOINT } from '../services/constants.js';`
   - OR use `const { API_ENDPOINT, SSE_ENDPOINT } = window.CONSTANTS;` for compatibility
2. Remove lines 8-9 (local constant definitions)
3. Replace all `${API_ENDPOINT}` with the imported constant

**Files affected in background.js:**
- Line 8: `const API_ENDPOINT = 'http://localhost:8000';` → REMOVE
- Line 9: `const SSE_ENDPOINT = ${API_ENDPOINT}/api/v1/stream;` → REMOVE  
- Line 298, 365, 391, 445, 467, 525, 634, 647: Replace `API_ENDPOINT` usages

**Verification:** `node extension/tests/*.test.js` (run all)

**Rollback:** Restore lines 8-9, revert all replacements

---

### Step 2.3: Update popup.js to Use Constants

**File:** `extension/popup/popup.js`  
**Lines:** 39-55 (constants block)

**Actions:**
1. Add import at top after line 5
2. Remove lines 39-55 (local STORAGE_KEYS, API_ENDPOINT, API_TIMEOUT_MS, N8N_WEBHOOK_URL)
3. Replace all usages of these constants

**Files affected in popup.js:**
- Line 39: `const API_ENDPOINT = 'http://localhost:8000';` → REMOVE
- Line 40: `const API_TIMEOUT_MS = 10000;` → REMOVE  
- Line 41: `const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/writer';` → REMOVE
- Lines 44-55: `const STORAGE_KEYS = {...}` → REMOVE
- Throughout: Replace usages

**Verification:** Run tests

**Rollback:** Restore removed lines

---

### Step 2.4: Update api-service.js to Use Constants

**File:** `extension/services/api-service.js`  
**Lines:** 1-3

**Actions:**
1. Add import
2. Remove local constant definitions (lines 1-3)
3. Replace all usages

**Verification:** Run tests

**Rollback:** Restore lines 1-3

---

### Step 2.5: Update sse-service.js to Use Constants

**File:** `extension/services/sse-service.js`  
**Line:** 1

**Actions:**
1. Add import
2. Remove line 1 (`const SSE_ENDPOINT = '...'`)
3. Replace usage in line 44

**Verification:** Run tests

**Rollback:** Restore line 1

---

### Step 2.6: Update Test Files to Use Constants

**Files to update:**
- `extension/tests/cover-letter.test.js` — lines 10-11
- `extension/tests/refresh-button.test.js` — lines 108-114

**Actions:**
- Add import at top of each test file
- Remove duplicate constant definitions
- Replace usages

**Note:** Tests may need to handle the ES module import differently. Alternative: create a globals file that tests can require:

```javascript
// extension/tests/test-globals.js
// Simple globals for tests - not ES modules
const API_ENDPOINT = 'http://localhost:8000';
const API_TIMEOUT_MS = 10000;
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/writer';
const STORAGE_KEYS = { ... };
const CACHE_TTL_MS = 30 * 60 * 1000;
```

Then have each test file require this at the top.

**Verification:** Run all tests

**Rollback:** Revert test file changes

---

## Phase 3: Dead Code Removal (CRITICAL)

### Step 3.1: Remove or Consolidate api-service.js

**File:** `extension/services/api-service.js`  
**Status:** NOT USED by popup.js

**Analysis:**
- background.js uses its own inline fetch functions, not this service
- popup.js uses its own inline fetch calls, not this service
- This service is completely unused

**Decision:** DELETE the file

**Verification:** Search all JS files for `apiService` or imports of this file - should find none

**Rollback:** Restore from git

---

### Step 3.2: Consolidate storage-service.js

**File:** `extension/services/storage-service.js`  
**Status:** PARTIALLY USED - some functions in popup.js duplicate this

**Analysis:**
- popup.js has its own `loadStateFromStorage()` and `saveStateToStorage()` functions (lines 681-715)
- storage-service.js provides similar functionality but different API
- popup.js does NOT import or use storage-service.js

**Decision:** Either:
- **Option A (Preferred):** Have popup.js import and use storage-service.js, remove duplicate functions
- **Option B:** Keep both but document the redundancy

**Implementation (Option A):**
1. In popup.js: Add import for storage-service
2. Remove duplicate functions in popup.js (loadStateFromStorage, saveStateToStorage)
3. Update all callers to use imported service

**Verification:** Extension still works in browser

**Rollback:** Restore popup.js, keep storage-service.js as-is

---

### Step 3.3: Remove or Consolidate sse-service.js

**File:** `extension/services/sse-service.js`  
**Status:** NOT USED - background.js has inline SSE implementation

**Analysis:**
- background.js lines 14-127 implement SSE manually
- sse-service.js provides a class-based SSE implementation
- No code imports or uses sse-service.js

**Decision:** DELETE the file (background.js inline implementation is what's actually used)

**Verification:** Search for `sseService` imports - should find none

**Rollback:** Restore from git

---

## Phase 4: Duplicate Function Consolidation

### Step 4.1: Consolidate isCacheValid()

**Files:**
- `extension/popup/popup.js` — lines 18-36
- `extension/tests/job-loading.test.js` — lines 113-130

**Issue:** Identical function exists in both files

**Solution:**
1. Move to constants.js or create `extension/services/cache-service.js`
2. Update popup.js to import from there
3. Update test to import from there (or keep copy if test must be standalone)

**Implementation:**
```javascript
// extension/services/cache-service.js
import { CACHE_TTL_MS } from './constants.js';

export async function isCacheValid(browserStorage = browser.storage) {
  // Same implementation
}
```

**Verification:** Tests pass

**Rollback:** Restore original function copies

---

## Phase 5: Code Smells

### Step 5.1: Remove/Consolidate console.log Statements

**Finding:** 179 console.log across 17 files (popup.js has 45 alone)

**Approach:**
1. Create a debug utility that can be toggled
2. Replace `console.log` with `debug('[Module]', ...)` that can be disabled
3. Alternatively, batch-remove obvious debugging statements (but keep meaningful logs)

**Priority files:**
- popup.js (45 statements)
- background.js 
- content scripts

**Verification:** Extension functions normally

**Rollback:** Revert debug utility changes

---

### Step 5.2: Fix Empty Catch Blocks

**File:** `extension/background/background.js`  
**Line:** 63

```javascript
.catch(() => {})  // Empty catch - silently swallows errors
```

**Fix:** Add error logging or handle appropriately

```javascript
.catch(err => console.error('[Background] API error:', err))
```

**Verification:** Check browser console for errors

**Rollback:** Revert to empty catch

---

### Step 5.3: Remove Duplicate init() Calls

**File:** `extension/popup/popup.js`  
**Lines:** 941-947 AND 1231-1236

**Issue:** init() is registered twice via DOMContentLoaded + setTimeout backup

**Current state:**
```javascript
// First registration (line 941)
document.addEventListener('DOMContentLoaded', init);

// First backup (lines 944-947)
setTimeout(() => {
  init().catch(e => console.error('[Popup] Backup init error:', e));
}, 500);

// Second registration (line 1231) - DUPLICATE
document.addEventListener('DOMContentLoaded', init);

// Second backup (lines 1233-1236) - DUPLICATE
setTimeout(() => {
  init().catch(e => console.error('[Popup] Backup err:', e));
}, 500);
```

**Fix:** Remove lines 1231-1236 (the duplicate block)

**Verification:** Extension loads normally

**Rollback:** Restore the removed lines

---

### Step 5.4: Document or Extract Magic Numbers

**Found throughout:**
- 75ms delay
- 480px popup width  
- 200 char description min
- Various timeouts and thresholds

**Approach:** Create a `configuration.js` or add to constants:

```javascript
// extension/services/configuration.js
export const UI = {
  POPUP_WIDTH_PX: 480,
  MIN_DESCRIPTION_LENGTH: 200
};

export const TIMING = {
  DEBOUNCE_MS: 75,
  RETRY_DELAY_MS: 1000,
  // etc.
};
```

**Verification:** None needed (comments/documentation only)

**Rollback:** N/A

---

## Phase 6: Final Verification

### Step 6.1: Run All Tests

```bash
cd extension/tests
for f in *.test.js; do echo "Running $f..."; node "$f"; done
```

### Step 6.2: Manual Browser Test

1. Load extension in Firefox
2. Open popup — verify it loads
3. Click job links — verify navigation
4. Test form filling on a job site

### Step 6.3: Linting

```bash
# If eslint is available
npx eslint extension/**/*.js
```

---

## Commit Checkpoints

| Checkpoint | Step | Description |
|------------|------|-------------|
| CP1 | 1.1-1.2 | Test fixes - broken tests now pass |
| CP2 | 2.1-2.3 | Constants module created, background.js & popup.js updated |
| CP3 | 2.4-2.6 | Remaining files updated to use constants |
| CP4 | 3.1-3.3 | Dead services removed |
| CP5 | 4.1 | Duplicate functions consolidated |
| CP6 | 5.1-5.4 | Code smells addressed |
| CP7 | 6.1-6.3 | Final verification - all tests pass |

---

## Rollback Strategy Summary

| Step | Rollback Method |
|------|-----------------|
| 1.1-1.2 | Revert specific lines |
| 2.1-2.6 | Delete new file, restore originals from git |
| 3.1-3.3 | `git checkout` to restore deleted files |
| 4.1 | Restore function copies |
| 5.1-5.4 | Revert specific changes |
| 6.x | N/A - verification only |

---

## Dependencies & Ordering

```
Phase 1 (Tests) ──────► Phase 2 (Constants) ──────► Phase 3 (Dead Code)
     │                        │                          │
     ▼                        ▼                          ▼
  Can run                 Must complete              Must complete
  tests first             before 3.2                 before 4.1
                           (popup uses                (removes
                            constants)                 duplication)

         ┌─────────────────────────────────────────────┘
         ▼
Phase 4 (Duplicates) ──────► Phase 5 (Smells) ──────► Phase 6 (Verify)
         │                        │
         ▼                        ▼
   Can proceed              Independent
   after 3.x               (can run in parallel)
```

---

## Notes

- All phases use existing JSDoc patterns
- Console prefix conventions (`[Popup]`, `[Background]`, `[Storage]`) should be preserved
- Firefox WebExtensions API (`browser.*`) must continue to work
- Tests are standalone Node.js scripts using custom assert functions (not Jest)