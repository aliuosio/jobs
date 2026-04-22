# Research: Extension Manifest & Setup

**Feature**: Extension Manifest & Setup | **Branch**: 012-extension-manifest
**Date**: 2026-04-22

## Research Questions

### 1. Build System Approach

**Q**: Build system approach for extension
**A**: Simple Vite build with custom script to copy manifest (not @crxjs/vite-plugin) - Firefox-only simplifies build

**Rationale**: The spec explicitly requires simple Vite build. @crxjs/vite-plugin adds Chrome-specific complexity not needed for Firefox-only extension.

### 2. Popup HTML Approach

**Q**: Popup HTML approach
**A**: popup.html as separate file that loads the built React bundle

**Rationale**: Standard MV3 pattern - popup.html loads the bundled JavaScript, not the source. Current dist/popup.html has wrong path `/src/main.tsx`.

### 3. Icon Source

**Q**: Icon source
**A**: Copy icons from extension-old/icons as temporary placeholders

**Rationale**: Icons already exist in extension-old/icons/ at 16, 32, 48, 128px. No need to create new ones.

### 4. Logging Strategy

**Q**: Logging strategy
**A**: Console-based logging with level filtering (debug/info/warn/error)

**Rationale**: Per spec clarification - simple console logging with level filtering for debugging.

### 5. Communication Pattern

**Q**: Communication pattern (popup ↔ content)
**A**: chrome.runtime.sendMessage for request/response pattern

**Rationale**: Standard MV3 pattern - message passing between popup, background, and content scripts.

---

## Issues Resolved

### Issue 1: Invalid Manifest Template Placeholders

**Problem**: dist/manifest.json has template placeholders `{{chrome}}` and `{{firefox}}`

**Solution**: Custom post-build script will generate clean manifest.json with correct Firefox paths

### Issue 2: Wrong Host Permissions

**Problem**: host_permissions is `<all_urls>`

**Solution**: Change to `http://localhost:8000/*` per spec (form filling API only)

### Issue 3: Popup HTML Development Path

**Problem**: popup.html references `/src/main.tsx` (development path)

**Solution**: Post-build script copies and fixes to reference built bundle `assets/index-*.js`

---

## Decisions Summary

| Decision | Rationale | Alternatives |
|----------|----------|--------------|
| Vite + custom script build | Per spec - Firefox-only simplifies | @crxjs/vite-plugin (rejected in spec) |
| Separate popup.html | Standard MV3 pattern | Inline in index.html (not standard) |
| Copy icons from extension-old | Existing placeholders available | Create new icons |
| Console logging with levels | Per spec clarification | sendMessage for deep logging |
| sendMessage pattern | Standard MV3 browser API | Long-lived connections |

---

*Research completed: 2026-04-22*