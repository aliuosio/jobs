# Feature Specification: Extension Popup Debug

**Feature Branch**: `011-extension-popup-fix`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "popup is showing nothing test and debug remember to use constitution Use React and Tailwind where ever possible"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extension loads but popup is blank (Priority: P1)

As a user, when I click the Job Forms Helper extension icon in the toolbar, I expect to see the popup UI with "Job Links" and "Job Forms Helper" tabs.

**Why this priority**: This is the primary interface users interact with. If the popup is blank, the entire extension is unusable regardless of other features working correctly.

**Independent Test**: Load the extension in Firefox (about:debugging > Load Temporary Add-on), click the extension icon, verify popup renders with header, tabs, and content panel visible.

**Acceptance Scenarios**:

1. **Given** the extension is loaded, **When** user clicks the toolbar icon, **Then** popup appears with visible header "Job Forms Helper"
2. **Given** the popup opens, **When** it completes loading, **Then** either job links list or loading spinner is visible
3. **Given** the popup renders, **When** user switches tabs, **Then** corresponding panel content renders

---

### User Story 2 - Job links load from background script (Priority: P2)

As a user, I expect to see my tracked job offers appear in the popup after it loads.

**Why this priority**: Core feature - the main purpose of the extension is job application tracking.

**Independent Test**: With backend running, open popup and verify either job list appears or error message shows if backend unavailable.

**Acceptance Scenarios**:

1. **Given** backend API is running, **When** popup opens, **Then** job offers load and display in the list
2. **Given** backend API is not running, **When** popup opens, **Then** error UI displays "Cannot connect" message
3. **Given** cache exists from previous session, **When** popup opens, **Then** cached job offers display immediately while refreshing

---

### User Story 3 - Form detection works (Priority: P3)

As a user on a job application page, I expect to be able to scan and auto-fill form fields.

**Why this priority**: Another core feature - automated form filling for job applications.

**Independent Test**: Navigate to Indeed/LinkedIn apply page, click "Scan Page", verify detected fields appear.

**Acceptance Scenarios**:

1. **Given** user is on a job application page, **When** they click "Scan Page", **Then** detected form fields appear in the panel
2. **Given** fields are detected, **When** user clicks "Fill All Fields", **Then** each field gets populated with AI-generated answers

---

### Edge Cases

- What happens when extension is loaded on a restricted URL (about:, chrome:, file:)?
- How does system handle API timeout when loading job offers?
- What displays when no job offers exist in the database?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display popup UI when user clicks the extension toolbar icon
- **FR-002**: System MUST render the "Job Forms Helper" header in the popup
- **FR-003**: System MUST render two tabs: "Job Links" and "Job Forms Helper" for navigation
- **FR-004**: System MUST display job offers from backend API or cached data
- **FR-005**: System MUST show error UI when backend is unavailable
- **FR-006**: System MUST allow scanning of active tab for form fields
- **FR-007**: System MUST allow filling of detected form fields

### Key Entities *(include if feature involves data)*

- **JobOffer**: Represents a job posting with id, title, url, applied status
- **DetectedField**: Represents a form field with label, name, type from page scan
- **Cache**: Local storage for job offers with timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see popup UI within 500ms of clicking extension icon
- **SC-002**: 100% of extension loads show visible header "Job Forms Helper" on first render
- **SC-003**: Job links panel shows either data (when API available) or appropriate error message (when unavailable)
- **SC-004**: Error states are recoverable - users can retry and see updated data

## Assumptions

- **Browser Environment**: User is loading extension in Firefox 109+ as temporary add-on
- **Backend Availability**: Backend may or may not be running - graceful error handling required
- **Existing Code**: The popup/popup.html contains complete React application - we're debugging why it doesn't render
- **User Testing**: User will test in browser and report specific error messages if any

## Root Cause Analysis *(diagnostic findings)*

### Issue: Popup shows empty rectangle when clicked

**Symptoms:**
- Clicking extension icon shows small empty rectangle
- No content renders in popup
- Extension shell loads but React UI fails to mount

**Root Cause:**
Firefox MV3 enforces strict Content Security Policy (CSP) that blocks:
1. `type="text/babel"` inline script execution
2. External CDN scripts from `unpkg.com` without explicit CSP whitelist

**Error Observed:**
```
Content-Security-Policy: blocked script (script-src-elem) at https://unpkg.com/@babel/standalone/babel.min.js
```

### Proposed Solution

1. **Move inline React code** from `popup.html` to external `popup.js` file (follows constitution: no inline scripts)
2. **Add CSP to manifest.json** allowing unpkg.com, cdn.tailwindcss.com
3. **Update React version** from v18 to v19 (latest stable)
4. **External script reference** in HTML: `<script src="popup.js"></script>`

**Files to Modify:**
| File | Change |
|------|--------|
| `popup/popup.html` | Remove inline script, add external JS reference |
| `popup/popup.js` | Extract inline React code to separate file |
| `manifest.json` | Add `content_security_policy` allowing CDN origins |

**Technology Stack (for implementation):**
- React 19 (from CDN)
- Tailwind CSS (via CDN)
- Babel Standalone (for JSX transformation)
- External JavaScript module pattern