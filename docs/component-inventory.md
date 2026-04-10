# Component Inventory - Firefox Extension

**Project:** Job Forms Helper Extension  
**Type:** Browser Extension (Manifest v3)  
**Browser:** Firefox 109.0+

---

## Overview

The Firefox extension consists of content scripts for form handling and a popup UI for job links management.

---

## Content Scripts

### 1. content.js
**Purpose:** Main entry point for content script injection  
**Type:** Orchestrator

| Property | Value |
|----------|-------|
| Runs at | document_idle |
| Matches | `<all_urls>` |

---

### 2. signal-extractor.js
**Purpose:** Extract browser signals for field classification

**Functions:**
- `getFieldSignals(field)` - Get autocomplete, html_type, name, label
- `extractAutocomplete(element)` - Parse autocomplete attribute
- `extractHtmlType(element)` - Get HTML type
- `extractLabel(element)` - Get associated label text

---

### 3. form-scanner.js
**Purpose:** Detect form fields using 5-strategy label detection

**Strategies:**
1. **for-id**: Label with `for` attribute matching input `id`
2. **wrapper**: Label wrapping the input
3. **aria-labelledby**: `aria-labelledby` reference
4. **proximity**: Label within reasonable distance (above, left, contained)
5. **name-id fallback**: Use `name` or `id` attributes as last resort

**Functions:**
- `scanPage()` - Find all form fields on page
- `detectLabel(element)` - Apply 5 strategies to find label
- `getFieldType(element)` - Infer field type from attributes

---

### 4. field-filler.js
**Purpose:** Inject values into form fields (React/Angular compatible)

**Features:**
- Direct value injection for text inputs
- Dispatch correct events (input, change, blur)
- Handle maxlength constraints
- Support for React controlled components
- Support for Angular ng-model

**Functions:**
- `fillField(element, value)` - Fill a single field
- `fillFields(fields)` - Fill multiple fields
- `setInputValue(element, value)` - Set value with events

---

### 5. form-observer.js
**Purpose:** Detect dynamically added forms (MutationObserver)

**Features:**
- Watch for DOM mutations
- Detect new form elements
- Re-scan on changes
- Debounced scanning

**Functions:**
- `startObserving()` - Start MutationObserver
- `stopObserving()` - Stop observer
- `handleMutations(mutations)` - Process DOM changes

---

## Popup Components

### popup.html
**Purpose:** Popup container with two tabs

**Tabs:**
1. **Job Links Manager** - Track job applications
2. **Job Forms Helper** - Form filling controls (scans page when opened)

---

### popup.js
**Purpose:** Popup logic and UI handling

**Features:**
- Tab switching
- Job list rendering (cache-first)
- Status filtering (Applied/In Progress/Not Applied)
- Refresh from backend
- CSV export
- SSE real-time updates

**Functions:**
- `loadJobs()` - Load from cache, then backend
- `renderJobList()` - Display jobs with status badges
- `filterJobs()` - Filter by status
- `exportCSV()` - Export applied jobs
- `initSSE()` - Connect to real-time stream

---

### popup.css
**Purpose:** Popup styling

---

## Services

### api-service.js
**Purpose:** Backend API client

**Endpoints:**
- `GET /job-offers` - List jobs
- `GET /job-offers/{id}` - Get job
- `PATCH /job-offers/{id}/process` - Update status
- `POST /api/v1/search` - Search resume (form filling)

**Features:**
- 10-second timeout
- Structured error handling
- JSON response parsing

---

### storage-service.js
**Purpose:** browser.storage.local wrapper

**Functions:**
- `get(key)` - Get value from storage
- `set(key, value)` - Set value in storage
- `remove(key)` - Remove from storage
- `getJobs()` - Get cached job list
- `setJobs(jobs)` - Cache job list

---

### sse-service.js
**Purpose:** Server-Sent Events client for real-time updates

**Events:**
- `job_offer_created`
- `job_offer_updated`
- `job_offer_deleted`

**Functions:**
- `connect(url)` - Connect to SSE stream
- `disconnect()` - Close connection
- `onEvent(callback)` - Register event handler

---

## Background Script

### background.js
**Purpose:** Handle extension events

**Features:**
- Message passing between content scripts and popup
- API service initialization
- Storage service initialization

---

## UI Components (by Category)

### Layout
- Popup container with tabs
- Job list scrollable container

### Form Elements
- Status filter checkboxes
- Refresh button
- Export button
- Job status toggle

### Display
- Job cards (title, company, status badge)
- Status badges: 🟢 Applied, 🟡 In Progress, ⚪ Not Applied

---

## Related Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Development Guide](./development-guide.md)