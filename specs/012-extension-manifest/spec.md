# Feature Specification: Extension Manifest & Setup

**Feature Branch**: `012-extension-manifest`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "the @extension/ is missing a manifest and setup as extension. look at the old extension for reference @extension-old. use ulw"

## Clarifications

### Session 2026-04-22

- Q: Build system approach for extension → A: Simple Vite build with custom script to copy manifest (not @crxjs/vite-plugin) - Firefox-only simplifies build
- Q: Popup HTML approach → A: popup.html as separate file that loads the built React bundle
- Q: Icon source → A: Copy icons from extension-old/icons as temporary placeholders
- Q: Logging strategy → A: Console-based logging with level filtering (debug/info/warn/error)
- Q: Communication pattern (popup ↔ content) → A: chrome.runtime.sendMessage for request/response pattern

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extension Loading (Priority: P1)

As a developer, I want to load the extension in Firefox as a temporary add-on so that I can test the extension functionality.

**Why this priority**: Without a valid manifest and proper extension setup, the extension cannot be loaded or tested at all. This is a prerequisite for all other development work.

**Independent Test**: Load the extension from the dist/ directory in Firefox via about:debugging and verify the extension icon appears in the toolbar.

**Acceptance Scenarios**:

1. **Given** the extension is built, **When** I navigate to about:debugging#/runtime/this-firefox, **Then** I can load the extension from the dist/ directory
2. **Given** the extension is loaded, **When** I check the manifest, **Then** manifest_version is 3, name is "Job Forms Helper", and permissions are correct
3. **Given** the extension is loaded, **When** I click the toolbar icon, **Then** the popup UI renders with Job Links and Forms Helper tabs

---

### User Story 2 - Popup UI Rendering (Priority: P1)

As a user, I want to see the popup UI when clicking the extension icon so that I can manage job links and fill forms.

**Why this priority**: The popup UI is the primary interface for the extension. Without it, users cannot interact with the extension.

**Independent Test**: Click the extension icon and verify the popup renders with the Job Links tab selected by default.

**Acceptance Scenarios**:

1. **Given** the extension is loaded, **When** I click the extension icon, **Then** a popup window opens showing the Job Links tab
2. **Given** the popup is open, **When** I click "Job Forms Helper" tab, **Then** the tab content switches to show Scan Page and Fill All Fields buttons
3. **Given** the popup is open, **When** I switch between tabs, **Then** the UI transitions smoothly without page reload

---

### User Story 3 - Content Script Injection (Priority: P2)

As a user, I want the content script to automatically detect form fields on web pages so that I can fill job application forms.

**Why this priority**: The content script enables the core "form filling" functionality. Without it, the extension cannot detect or fill form fields.

**Independent Test**: Navigate to a page with a job application form, click "Scan Page" in the popup, and verify detected fields appear in the list.

**Acceptance Scenarios**:

1. **Given** the extension is loaded on a job application page, **When** I click "Scan Page" in the popup, **Then** the content script scans the page and returns detected form fields
2. **Given** fields are detected, **When** I click "Fill All Fields", **Then** the content script fills each detected field with appropriate data
3. **Given** the content script is running, **When** I navigate to a new page, **Then** the content script reinitializes and is ready to scan

---

### User Story 4 - Build System Integration (Priority: P2)

As a developer, I want the build system to produce a valid extension package so that I can deploy the extension to users.

**Why this priority**: A working build system is essential for continuous integration and deployment. The current build setup is incomplete.

**Independent Test**: Run `npm run build` and verify the dist/ directory contains all required extension files (manifest.json, popup HTML, content scripts, background scripts, icons).

**Acceptance Scenarios**:

1. **Given** `npm run build` is executed, **When** the build completes, **Then** the dist/ directory contains a valid manifest.json with correct file paths
2. **Given** the build completes, **When** I load the extension in Firefox, **Then** all features work correctly
3. **Given** the build is configured, **When** I run `npm run dev`, **Then** a development server starts and supports hot module replacement

---

### Edge Cases

- What happens when the backend API is unavailable? - The extension should show an error state, not crash
- What happens when the page has no form fields? - Show "No fields detected" message
- What happens during hot reload with a syntax error? - Show error overlay, do not crash the extension
- What happens when chrome.storage is unavailable? - Gracefully degrade (no persistence)
- What happens with dynamically loaded forms (SPAs)? - Content script handles via MutationObserver

### Communication Architecture

- **Popup ↔ Content Scripts**: chrome.runtime.sendMessage for direct message passing (e.g., scan page, fill fields commands)
- **Message Types**: DETECT_FIELDS, FILL_FIELDS, GET_JOBS, GET_PROFILE

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST have a valid manifest.json in the dist/ directory with manifest_version 3
- **FR-002**: The extension MUST include a popup.html that renders the React application (separate file in public/ that loads built React bundle)
- **FR-003**: The extension MUST include background script for message handling and state management
- **FR-004**: The extension MUST include content script that detects form fields and fills them
- **FR-005**: The extension MUST use the same permissions as the original extension: storage, activeTab, scripting
- **FR-006**: The extension MUST communicate with localhost:8000 API for form filling
- **FR-007**: The build system MUST produce a valid extension that loads in Firefox without errors
- **FR-008**: The extension MUST include icons at 16, 32, 48, and 128 pixel sizes
- **FR-009**: The build process MUST use simple Vite build with custom script to copy manifest.json to dist/ (not @crxjs/vite-plugin)

### Key Entities

- **Manifest Configuration**: WebExtension manifest v3 defining extension metadata, permissions, and entry points
- **Popup UI**: React application rendered in the extension popup (Job Links tab, Forms Helper tab)
- **Background Script**: Service worker handling message routing between popup and content scripts
- **Content Script**: Script injected into web pages for form field detection and filling
- **Extension Icons**: Visual identifiers at multiple sizes for toolbar and about:addons display

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The extension can be loaded in Firefox as a temporary add-on without errors
- **SC-002**: The popup UI renders correctly with both Job Links and Job Forms Helper tabs functional
- **SC-003**: The content script successfully detects form fields on a test job application page
- **SC-004**: The build command (`npm run build`) completes in under 30 seconds and produces valid output
- **SC-005**: The extension remains functional after reload - no crashes or unhandled errors

## Assumptions

- Users are on Firefox 109+ (per browser_specific_settings in old extension)
- Developers have Node.js 18+ and npm installed for the build process
- The backend API at localhost:8000 is running when testing form filling
- Icons will be copied from extension-old/icons as temporary placeholders (can be replaced later)
- The React application code (components, hooks, services) is already functional and only needs proper extension scaffolding
- Firefox-only extension (Chrome compatibility not required for this feature)
- Debug logging will use console-based level filtering (debug/info/warn/error) for observability