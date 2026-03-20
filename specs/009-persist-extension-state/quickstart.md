# Quickstart: Persist Extension State

## Overview

This feature adds state persistence to the Firefox extension so users don't lose their job list, applied status, and form scan results when the popup closes.

## Changes Required

### 1. popup/popup.js

**Functions to modify:**
- `init()` - Load state from storage on startup
- `loadJobLinks()` - Cache job offers to storage
- `handleStatusClick()` - Persist applied status change
- `handleScanClick()` - Cache detected fields
- `renderFieldsList()` - Restore cached fields
- `switchTab()` - Persist tab preference

**New functions to add:**
- `loadStateFromStorage()` - Load all state
- `saveStateToStorage()` - Save all state
- `isCacheStale(timestamp)` - Check if cache needs refresh

### 2. popup/popup.html

**Elements to add:**
- Stale data indicator (optional, for cache > 1 hour)

### 3. background/background.js

**Functions to modify:**
- `handleGetJobOffers()` - Return cached data first
- `handleUpdateApplied()` - Update cache on status change

### 4. extension/tests/

**Tests to add:**
- `storage-persistence.test.js` - Verify state persistence

## Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| jobOffers | Array | Cached job list |
| jobOffersTimestamp | number | Last fetch time |
| detectedFields | Array | Cached form fields |
| lastUrl | string | URL for field cache |
| lastTab | string | Last selected tab |
| storageVersion | number | Schema version |

## Testing Checklist

- [x] Mark job as applied → close popup → reopen → still applied
- [x] Scan page → close popup → reopen same page → fields restored
- [x] Switch to Links tab → close popup → reopen → Links tab active
- [x] Click refresh → fresh data fetched from API
- [x] Navigate to different domain → cached fields cleared
