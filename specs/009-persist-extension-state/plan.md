# Implementation Plan: Persist Extension State

**Branch**: `009-persist-extension-state` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-persist-extension-state/spec.md`

## Summary

Persist extension state (job list, form fields, tab preference) across browser sessions using browser.storage.local API. The extension currently loses all state when the popup closes. This plan adds state persistence by caching job offers, detected fields, and UI preferences to browser storage, restoring them on extension open.

## Technical Context

**Language/Version**: JavaScript (ES6+, Firefox Extension Manifest v3)  
**Primary Dependencies**: browser.storage.local API  
**Storage**: browser.storage.local (Firefox extension storage)  
**Testing**: Existing test patterns in extension/tests/  
**Target Platform**: Firefox 109+ (browser extension)  
**Project Type**: browser-extension  
**Performance Goals**: <500ms state restoration time  
**Constraints**: Storage quota limits (~10MB), offline-capable  
**Scale/Scope**: Single user, ~100 job offers, ~50 form fields per page

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Single Responsibility | ✅ Pass | Storage manager handles all state persistence |
| Type Safety | ✅ Pass | JSDoc annotations, no `any` types |
| No Inheritance | ✅ Pass | Pure functions, no class hierarchies |
| KISS | ✅ Pass | Simple key-value storage pattern |

## Project Structure

### Documentation (this feature)

```text
specs/009-persist-extension-state/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (if needed)
└── tasks.md            # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
extension/
├── popup/
│   ├── popup.js         # [MODIFY] Add state persistence
│   └── popup.html       # [MODIFY] Add stale indicator
├── background/
│   └── background.js   # [MODIFY] Add state sync to storage
└── tests/
    └── *.test.js       # [ADD] Storage persistence tests
```

**Structure Decision**: Modify existing popup.js and background.js to use browser.storage.local. No new directories required.

## Phase 0: Research

### Research Questions

1. **browser.storage.local best practices**: How to structure data for efficient read/write?
2. **Storage quota handling**: How to gracefully handle quota exceeded errors?
3. **Version migration**: How to handle schema changes in stored data?

### Research Findings

**Decision**: Use browser.storage.local with JSON serialization
**Rationale**: 
- Native Firefox API, no external dependencies
- Automatic sync across extension contexts
- Supports quota warnings and error handling

**Alternatives considered**:
- IndexedDB: Overkill for simple key-value storage
- localStorage: Not available in extension background scripts
- Third-party libraries: Violates KISS - native API sufficient

### Storage Schema

```javascript
{
  "jobOffers": [...],        // Cached job list
  "jobOffersTimestamp": 1234567890,  // Cache time
  "detectedFields": [...],   // Cached form fields
  "lastUrl": "https://...",  // URL for field cache
  "lastTab": "links",       // User preference
  "storageVersion": 1        // Schema version
}
```

## Phase 1: Design

### Data Model

| Entity | Fields | Notes |
|--------|--------|-------|
| JobOffer | id, title, url, applied | From API |
| DetectedField | id, label, type, confidence | From scan |
| UserPreferences | lastTab | UI state |
| StorageMetadata | version, timestamp | Migration support |

### Key Design Decisions

1. **Cache-first with API refresh**: Always load from storage first, fetch in background
2. **Stale threshold**: Show indicator if cache > 1 hour old
3. **URL-based field cache**: Fields cached per URL, cleared on navigation
4. **Versioned storage**: Schema version for future migrations

## Complexity Tracking

No complexity violations. Simple key-value storage pattern.
