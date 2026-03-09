# Data Model: Form Filler Browser Extension

**Feature**: 003-form-filler-extension | **Date**: 2026-03-08

## Overview

This document defines the data models for the Form Filler Browser Extension, including form field entities, label-input pairs, and message types.

---

## Core Entities

### FormField

Represents a detected form field on a web page.

```typescript
interface FormField {
  // Identification
  id: string;                    // Unique identifier (generated)
  element: HTMLElement;          // Reference to DOM element
  
  // Field Properties
  type: FieldType;               // Input type
  name: string | null;           // Form field name attribute
  id: string | null;             // Element ID
  
  // Label Information
  labelText: string;             // Extracted label text
  labelConfidence: Confidence;   // Detection confidence level
  
  // State
  isFillable: boolean;           // Can be filled (not readonly/disabled)
  currentValue: string | null;   // Current field value
  filledValue: string | null;    // Value after filling
  
  // Location
  selector: string;              // CSS selector for element
  formId: string | null;         // Parent form ID
}

type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number' | 'url' | 'unknown';
type Confidence = 'high' | 'medium' | 'low';
```

### LabelInputPair

Represents the association between a label and its target input.

```typescript
interface LabelInputPair {
  // Label Information
  labelElement: HTMLLabelElement | HTMLElement;
  labelText: string;             // Cleaned label text
  labelFor: string | null;       // for attribute value
  
  // Input Information
  inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  inputType: FieldType;
  inputName: string | null;
  
  // Detection Method
  detectionMethod: DetectionMethod;
  confidence: Confidence;
}

type DetectionMethod = 
  | 'for-id'          // Explicit for/id association
  | 'wrapper'         // Label wraps input
  | 'aria-labelledby' // Using aria-labelledby
  | 'proximity'       // Proximity heuristic
  | 'placeholder';    // Fallback to placeholder
```

### FillRequest

Request payload sent to the backend API.

```typescript
interface FillRequest {
  label: string;                 // The form field label
  context_hints?: string;        // Optional context hints
  
  // Metadata (optional, for debugging)
  field_type?: FieldType;
  form_url?: string;
}
```

### FillResponse

Response from the backend API. See [002-rag-backend](../002-rag-backend/spec.md) for API contract.

```typescript
interface FillResponse {
  answer: string;                // Generated answer text
  has_data: boolean;             // Whether relevant data was found
  confidence: 'high' | 'medium' | 'low' | 'none';
  context_chunks: number;        // Number of context chunks retrieved (0-5)
}
```

**Confidence Levels** (determined by backend based on similarity scores):

| Level | Meaning |
|-------|--------|
| `high` | Multiple relevant chunks with clear match |
| `medium` | Some relevant context found |
| `low` | Weak or ambiguous matches |
| `none` | No relevant context retrieved |

---

## Message Types

### Content Script → Background Script

```typescript
// Request to fill a form field
interface FillFormMessage {
  type: 'FILL_FORM';
  data: FillRequest;
}

// Request to fill all forms
interface FillAllFormsMessage {
  type: 'FILL_ALL_FORMS';
  data: {
    fields: FillRequest[];
  };
}

// Scan request
interface ScanPageMessage {
  type: 'SCAN_PAGE';
}

// Get status
interface GetStatusMessage {
  type: 'GET_STATUS';
}
```

### Background Script → Content Script

```typescript
// Fill result
interface FormFilledMessage {
  type: 'FORM_FILLED';
  data: {
    fieldId: string;
    value: string;
    success: boolean;
    error?: string;
  };
}

// Scan result
interface ScanResultMessage {
  type: 'SCAN_RESULT';
  data: {
    fieldCount: number;
    fields: FormField[];
  };
}

// Status response
interface StatusResponse {
  type: 'STATUS';
  data: {
    apiConnected: boolean;
    lastScanTime: number | null;
    fieldCount: number;
  };
}
```

---

## Extension State

### PopupState

State managed by the popup UI.

```typescript
interface PopupState {
  // Scan State
  isScanning: boolean;
  lastScanTime: number | null;
  
  // Form State
  detectedFields: FormField[];
  selectedFields: string[];       // Field IDs selected for filling
  
  // Fill State
  isFilling: boolean;
  fillProgress: FillProgress;
  
  // Status
  apiConnected: boolean;
  errorMessage: string | null;
}

interface FillProgress {
  total: number;
  completed: number;
  failed: number;
  current: string | null;        // Current field being filled
}
```

### ContentScriptState

State managed by the content script.

```typescript
interface ContentScriptState {
  // Detection State
  formObserver: FormObserver | null;
  processedForms: WeakSet<HTMLFormElement>;
  
  // Field Cache
  detectedFields: Map<string, FormField>;
  
  // Fill State
  pendingFills: Map<string, Promise<void>>;
  
  // Status
  isInitialized: boolean;
  lastScanTime: number;
}
```

---

## Storage Schema

### Local Storage Keys

```typescript
// Extension settings
interface ExtensionSettings {
  apiEndpoint: string;           // Default: http://localhost:8000
  autoScan: boolean;             // Auto-scan on page load
  fillDelay: number;             // Delay between fills (ms)
  showNotifications: boolean;    // Show fill notifications
}

// Saved profiles (future feature)
interface SavedProfile {
  id: string;
  name: string;
  url: string;
  formData: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}
```

---

## State Transitions

### Form Detection Flow

```
1. Page Load
   └── Initialize FormObserver
   
2. MutationObserver Triggers
   ├── Debounce mutations (300ms)
   ├── Check for new forms
   └── Scan forms for fields
   
3. Field Detection
   ├── Detect for/id labels (high confidence)
   ├── Detect wrapper labels (high confidence)
   ├── Detect proximity labels (medium confidence)
   └── Store in detectedFields map
   
4. Notify Popup
   └── Send SCAN_RESULT message
```

### Form Filling Flow

```
1. User Clicks "Fill All"
   └── Popup sends FILL_ALL_FORMS message

2. Content Script Receives
   ├── Filter fillable fields
   ├── Sort by DOM order
   └── Queue for sequential fill

3. For Each Field
   ├── Extract label text
   ├── Send FILL_FORM to background
   ├── Background calls API
   ├── Receive response
   └── Dispatch input/change events

4. Update UI
   ├── Mark field as filled
   ├── Update progress
   └── Show success/error
```

---

## Error States

| Error Type | Description | Recovery |
|------------|-------------|----------|
| `API_UNAVAILABLE` | Cannot reach backend API | Show error, suggest checking backend |
| `NO_FIELDS_DETECTED` | No form fields found on page | Show message, suggest manual scan |
| `FILL_FAILED` | API returned error or no data | Skip field, continue with others |
| `INVALID_RESPONSE` | Malformed API response | Log error, use fallback |
| `FIELD_NOT_FILLABLE` | Field is readonly/disabled | Skip field, mark in UI |

---

## File Structure

| File | Content |
|------|---------|
| `extension/content/form-scanner.js` | FormField, LabelInputPair detection |
| `extension/content/field-filler.js` | Fill event dispatch logic |
| `extension/content/api-client.js` | API request/response handling |
| `extension/background/background.js` | Message routing, state management |
| `extension/popup/popup.js` | PopupState, UI logic |
| `extension/lib/types.ts` | TypeScript type definitions |
