# Implementation Tasks: Extension Manifest & Setup

**Feature**: 012-extension-manifest | **Branch**: 012-extension-manifest
**Total Tasks**: 21 | **Estimated Effort**: 2-3 developer hours

---

## Implementation Strategy
✅ **MVP First Delivery**: User Story 1 delivers working extension loading capability in ~1 hour
✅ **Parallelizable**: Most tasks within each user story can be implemented simultaneously
✅ **Incremental Testing**: Each user story has independent test criteria

---

## Phase 1: Setup (Prerequisites)

| # | Task | File | Notes |
|---|------|------|-------|
| T001 | ✅ Copy icons from extension-old/icons/ to extension/public/icons/ | extension/public/icons/ | [P] |
| T002 | ✅ Create manifest.json template in extension/public/ | extension/public/manifest.json | [P] |
| T003 | ✅ Add Vite post-build script to copy and fix manifest paths | extension/vite.config.ts | [P] |

✅ ✅ **Checkpoint**: Setup complete - ready for implementation

---

## Phase 2: Foundational Tasks (Blocking)

| # | Task | File | Notes |
|---|------|------|-------|
| T004 | ✅ Create background script entry point and register in manifest | extension/src/background/index.ts | |
| T005 | ✅ Create content script entry point and register in manifest | extension/src/content/index.ts | |
| T006 | ✅ Fix popup.html to correctly reference built Vite bundle | extension/public/popup.html | |
| T007 | ✅ Update package.json build scripts for manifest copying | extension/package.json | |

✅ **Checkpoint**: All entry points configured - ready for feature implementation

---

## Phase 3: User Story 1 - Extension Loading [P1]

**Goal**: Extension loads in Firefox as temporary add-on
**Independent Test**: Load extension from dist/ directory and verify icon appears in toolbar

| # | Task | File | Notes |
|---|------|------|-------|
| T008 | ✅ Add manifest v3 fields: name, version, description, manifest_version=3 | extension/public/manifest.json | [P] |
| T009 | ✅ Add browser_specific_settings for Firefox with correct ID | extension/public/manifest.json | [P] |
| T010 | ✅ Add permissions: storage, activeTab, scripting | extension/public/manifest.json | [P] |
| T011 | ✅ Add host permissions: `http://localhost:8000/*` instead of `<all_urls>` | extension/public/manifest.json | [P] |
| T012 | ✅ Configure action section with default_popup and icons | extension/public/manifest.json | [P] |

✅ **Checkpoint**: US1 Complete - Extension loads successfully in Firefox

---

## Phase 4: User Story 2 - Popup UI Rendering [P1]

**Goal**: Popup UI renders with Job Links and Forms Helper tabs
**Independent Test**: Click extension icon and verify popup renders with correct tabs

| # | Task | File | Notes |
|---|------|------|-------|
| T013 | ✅ Verify React app mounts correctly in popup context | extension/src/main.tsx | [P] |
| T014 | ✅ Test tab navigation between Job Links and Forms Helper | extension/src/components/TabNavigation.tsx | [P] |
| T015 | ✅ Ensure no CORS or extension API errors in popup console | extension/src/App.tsx | [P] |

✅ **Checkpoint**: US2 Complete - Popup UI functional and navigable

---

## Phase 5: User Story 3 - Content Script Injection [P2]

**Goal**: Content script detects form fields on web pages
**Independent Test**: Click "Scan Page" and verify detected fields appear in popup

| # | Task | File | Notes |
|---|------|------|-------|
| T016 | ✅ Implement message passing between popup and content script | extension/src/services/api.ts | [P] |
| T017 | ✅ Add DETECT_FIELDS message handler in content script | extension/src/content/index.ts | [P] |
| T018 | ✅ Add form scanning logic using MutationObserver for dynamic forms | extension/src/hooks/useDetectFields.ts | [P] |
| T019 | ✅ Implement field detection response handling in popup | extension/src/components/tabs/FormsHelper.tsx | [P] |

✅ **Checkpoint**: US3 Complete - Form detection functional

---

## Phase 6: User Story 4 - Build System Integration [P2]

**Goal**: Build system produces valid extension package
**Independent Test**: Run `npm run build` and verify dist/ has all required files

| # | Task | File | Notes |
|---|------|------|-------|
| T020 | ✅ Implement Vite build script that copies manifest to dist/ | extension/vite.config.ts | [P] |
| T021 | ✅ Configure dev mode with hot reload support | extension/package.json | [P] |

✅ **Checkpoint**: US4 Complete - Build system functional

---

## Task Dependencies

```
Setup (T001-T003)
    ↓
Foundational (T004-T007)
    ↓
US1 (T008-T012) → US2 (T013-T015) → US3 (T016-T019) → US4 (T020-T021)
```

---

## Parallel Execution Examples

### User Story 1 Parallel Tasks
All manifest configuration tasks (T008-T012) can be implemented simultaneously by different developers without conflicts.

### User Story 3 Parallel Tasks
Message passing (T016) and form scanning (T018) can be implemented in parallel.

---

## Summary

| Story | Priority | Tasks | Status |
|-------|----------|-------|--------|
| Extension Loading | P1 | 5 | ✅ Ready |
| Popup UI Rendering | P1 | 3 | ✅ Ready |
| Content Script Injection | P2 | 4 | ✅ Ready |
| Build System Integration | P2 | 2 | ✅ Ready |
| Setup | - | 3 | ✅ Ready |
| Foundational | - | 4 | ✅ Ready |

**Total Tasks**: 21
**Parallel Opportunities**: 17 tasks marked [P]
**Recommended MVP Scope**: Complete Setup + Foundational + US1 first for working extension