# Feature Specification: Convert CommonJS to ES Modules for Browser

**Feature Branch**: `001-es-module-conversion`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "### Fix: `require()` not working in browser

**Problem**
Code uses CommonJS (`require`) but runs in browser → `require is not defined`.

**Required Changes**

1. Replace CommonJS with ES Modules:

   * ❌ `require('./constants.js')`
   * ✅ `import { ... } from './constants.js'`

2. Update `constants.js`:

   * Use named exports:

     ```js
     export const API_ENDPOINT = '...';
     export const API_TIMEOUT_MS = 5000;
     export const N8N_WEBHOOK_URL = '...';
     ```

3. Ensure browser loads module correctly:

   ```html
   <script type="module" src="your-file.js"></script>
   ```

4. Use explicit file extensions in imports:

   * ✅ `'./constants.js'`
   * ❌ `'./constants'`

**Optional Compatibility Fix**

* Replace `AbortSignal.timeout()` with a safe fallback:

  ```js
  function timeoutSignal(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
  ```

**Constraint**

* Do NOT use `require()` unless a bundler (e.g. Webpack/Vite) is introduced.

--- "

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browser Code Loads Without Errors (Priority: P1)

The Firefox extension code runs in the browser environment without throwing "require is not defined" errors. Users can use the extension functionality without JavaScript errors in the browser console.

**Why this priority**: This is the primary bug fix - without it, the extension cannot function at all in the browser context.

**Independent Test**: Load the extension in Firefox and verify no "require is not defined" errors appear in the browser console (Ctrl+Shift+K).

**Acceptance Scenarios**:

1. **Given** the extension is loaded in Firefox, **When** any module tries to load constants, **Then** no "require is not defined" error occurs
2. **Given** the extension is loaded, **When** opening the popup or visiting a job application page, **Then** the code executes without JavaScript runtime errors

---

### User Story 2 - Constants Available via ES Module Exports (Priority: P1)

All configuration constants are exported from constants.js using ES Module syntax and are accessible to importing modules. Users see the expected values (API endpoints, timeouts, webhook URLs) in the application.

**Why this priority**: The constants must be properly exported for other modules to consume them.

**Independent Test**: Check that all constants can be imported and used in console: `import { API_ENDPOINT } from './constants.js'; console.log(API_ENDPOINT);`

**Acceptance Scenarios**:

1. **Given** constants.js exports API_ENDPOINT, **When** imported in another module, **Then** the correct endpoint value is available
2. **Given** constants.js exports API_TIMEOUT_MS, **When** imported, **Then** the timeout value (5000) is available

---

### User Story 3 - Timeout Signal Works Cross-Browser (Priority: P2)

The timeout/abort functionality works across different browser environments. Users experience consistent timeout behavior regardless of browser support for AbortSignal.timeout().

**Why this priority**: Provides graceful degradation for browsers without native AbortSignal.timeout() support.

**Independent Test**: Test timeout functionality in console: `timeoutSignal(1000)` should return an AbortSignal that aborts after 1 second.

**Acceptance Scenarios**:

1. **Given** timeoutSignal(1000) is called, **When** 1 second passes, **Then** the signal is aborted
2. **Given** timeoutSignal(5000) is called before 5 seconds elapse, **Then** the signal is not yet aborted

---

### Edge Cases

- What happens when a module imports a non-existent file? → Error message displayed, application handles gracefully
- What happens if constants.js is missing entirely? → Module load error, not silent failure
- How does system handle circular imports? → ES Modules handle this natively, no infinite loop

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST NOT use CommonJS `require()` syntax in browser-executed code
- **FR-002**: System MUST use ES Module `import`/`export` syntax for module dependencies
- **FR-003**: All module imports MUST include explicit file extensions (e.g., `'./constants.js'`, not `'./constants'`)
- **FR-004**: Browser scripts using modules MUST be loaded with `<script type="module">`
- **FR-005**: Constants MUST be exported using named exports (not default exports) for clarity
- **FR-006**: System MUST provide a timeoutSignal() fallback for browsers without AbortSignal.timeout() support

### Key Entities *(include if feature involves data)*

- **Constants Module**: Exported configuration values (API_ENDPOINT, API_TIMEOUT_MS, N8N_WEBHOOK_URL)
- **Timeout Utility**: Cross-browser compatible timeout signal generator

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No "require is not defined" errors appear in browser console during extension operation
- **SC-002**: All constants can be successfully imported and used by other modules
- **SC-003**: Timeout functionality works consistently across browser environments
- **SC-004**: Extension loads and functions without JavaScript errors in Firefox

## Assumptions

- Users are running the Firefox extension in a modern browser (Firefox 60+)
- No bundler (Webpack/Vite) is being introduced for this fix
- The extension is intended to run directly in the browser without server-side transpilation