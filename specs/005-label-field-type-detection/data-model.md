# Data Model: Label-Based Field Type Detection

**Feature**: 005-label-field-type-detection | **Date**: 2026-03-18

## Overview

This document defines the data models for the enhanced signal extraction system that enables API-based semantic field type classification.

---

## Core Entities

### FieldSignals (NEW)

Represents all extractable signals from a form field. These signals are sent to the API for semantic field type classification.

```typescript
interface FieldSignals {
  /**
   * Primary signal - the associated label text
   * Highest priority for classification
   */
  label: {
    text: string;              // Cleaned label text content
    title?: string;            // Label's title attribute (tooltip text)
    confidence: 'high' | 'medium' | 'low';  // Detection confidence
    source: LabelSource;       // How the label was detected
  } | null;
  
  /**
   * HTML autocomplete attribute
   * Standardized hint for field purpose
   * High priority - follows HTML5 specification
   */
  autocomplete?: string;       // e.g., "email", "tel", "given-name", "family-name"
  
  /**
   * ARIA label attribute
   * Accessibility label, often more descriptive
   * High priority - explicitly describes field purpose
   */
  ariaLabel?: string;          // aria-label attribute value
  
  /**
   * Placeholder text
   * Contains hints or example values
   * Medium priority - may contain example data
   */
  placeholder?: string;        // e.g., "john@example.com", "+49..."
  
  /**
   * Input name attribute
   * Form submission identifier, often semantic
   * Medium priority - developer-chosen identifier
   */
  name?: string;               // e.g., "user_email", "phone_number", "first_name"
  
  /**
   * Element ID attribute
   * DOM identifier, sometimes semantic
   * Low priority - often auto-generated
   */
  id?: string;                 // e.g., "email-field", "phone-input"
  
  /**
   * Help/hint text associated with field
   * Descriptive text near the field
   */
  hint?: {
    text: string;
    source: 'aria-describedby' | 'sibling-hint' | 'parent-description';
  };
  
  /**
   * Original HTML input type
   * Technical type, not semantic type
   */
  htmlType: HtmlInputType;
}

type LabelSource = 
  | 'for-id'           // Explicit <label for="id"> association
  | 'wrapper'          // Label wraps the input element
  | 'aria-labelledby'  // Using aria-labelledby attribute
  | 'proximity'        // Heuristic: nearest label-like element
  | 'name-id-fallback' // No label, using name/id as label text
  | 'none';            // No label detected

type HtmlInputType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'url' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'contenteditable'
  | 'unknown';
```

---

### EnhancedFormField (EXTENDED)

Extended FormField interface including extracted signals.

```typescript
interface EnhancedFormField extends FormField {
  /**
   * Extracted signals for API classification
   */
  signals: FieldSignals;
  
  // Inherited from FormField:
  // id: string;
  // element: HTMLElement;
  // type: HtmlInputType;
  // name: string | null;
  // elementId: string | null;
  // labelText: string;
  // labelConfidence: Confidence;
  // detectionMethod: DetectionMethod;
  // isFillable: boolean;
  // currentValue: string | null;
  // filledValue: string | null;
  // selector: string;
  // formId: string | null;
}
```

---

### EnhancedFillRequest (EXTENDED)

Extended request payload with structured signals for API.

```typescript
interface EnhancedFillRequest {
  /**
   * Primary label text (backward compatible)
   * Derived from signals.label.text
   */
  label: string;
  
  /**
   * Structured signals for semantic classification
   * API uses these to determine field type
   */
  signals: {
    label_text?: string;
    label_title?: string;
    label_confidence?: 'high' | 'medium' | 'low';
    label_source?: LabelSource;
    autocomplete?: string;
    aria_label?: string;
    placeholder?: string;
    input_name?: string;
    input_id?: string;
    hint_text?: string;
    hint_source?: string;
    html_type: HtmlInputType;
  };
  
  /**
   * Optional context hints (existing)
   */
  context_hints?: string;
  
  /**
   * Page/form URL for context (existing)
   */
  form_url?: string;
}
```

**API Request Example:**

```json
{
  "label": "Your Email Address",
  "signals": {
    "label_text": "Your Email Address",
    "label_confidence": "high",
    "label_source": "for-id",
    "autocomplete": "email",
    "placeholder": "Enter your email",
    "input_name": "user_email",
    "input_id": "email-field",
    "html_type": "email"
  }
}
```

---

## Autocomplete Attribute Values

Reference for common `autocomplete` attribute values relevant to job applications:

### Personal Information

| Value | Semantic Type |
|-------|---------------|
| `name` | Full name |
| `given-name` | First name |
| `family-name` | Last name |
| `additional-name` | Middle name |
| `email` | Email address |
| `tel` | Phone number |
| `tel-national` | National phone format |
| `tel-international` | International phone format |

### Location

| Value | Semantic Type |
|-------|---------------|
| `street-address` | Street address |
| `address-line1` | Address line 1 |
| `address-line2` | Address line 2 |
| `city` | City |
| `country` | Country |
| `country-name` | Country name |
| `postal-code` | ZIP/Postal code |

### Professional

| Value | Semantic Type |
|-------|---------------|
| `organization` | Company/Organization |
| `organization-title` | Job title |
| `url` | Website/Profile URL |

---

## Signal Priority Matrix

| Signal | Priority | Reliability | Notes |
|--------|----------|-------------|-------|
| `label.text` | Highest | High (if confidence=high) | Most reliable when properly associated |
| `autocomplete` | High | Very High | Standardized HTML5 attribute |
| `aria-label` | High | High | Explicitly describes purpose |
| `label.title` | Medium | Medium | Additional context from tooltip |
| `placeholder` | Medium | Medium | May contain examples or hints |
| `name` | Medium | Medium | Developer-chosen, often semantic |
| `hint` | Medium | Medium | Contextual help text |
| `id` | Low | Low | Often auto-generated |
| `htmlType` | Context | High | Technical type, not semantic |

---

## Signal Extraction Sources

### Label Detection Sources

```
┌─────────────────────────────────────────────────────────────┐
│ Label Detection Hierarchy (existing from 003)               │
├─────────────────────────────────────────────────────────────┤
│ 1. for-id         → <label for="email">Email</label>        │
│                     <input id="email">                       │
├─────────────────────────────────────────────────────────────┤
│ 2. wrapper        → <label>Email <input></label>            │
├─────────────────────────────────────────────────────────────┤
│ 3. aria-labelledby→ <span id="lbl">Email</span>             │
│                     <input aria-labelledby="lbl">           │
├─────────────────────────────────────────────────────────────┤
│ 4. proximity      → <div><label>Email</label><input></div>  │
├─────────────────────────────────────────────────────────────┤
│ 5. name-id        → <input name="email_address">            │
│                     (use "Email Address" as label)          │
└─────────────────────────────────────────────────────────────┘
```

### Hint Text Sources

```
┌─────────────────────────────────────────────────────────────┐
│ Hint Text Detection                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. aria-describedby                                          │
│    <input aria-describedby="email-hint">                    │
│    <span id="email-hint">We'll never share your email</span>│
├─────────────────────────────────────────────────────────────┤
│ 2. Sibling hint elements                                     │
│    <input>                                                   │
│    <small class="hint">Format: +49 123 456789</small>       │
│    Classes: .hint, .help-text, .field-description,          │
│             .form-text, .helper-text                         │
├─────────────────────────────────────────────────────────────┤
│ 3. Parent container description                              │
│    <div class="form-group">                                  │
│      <label>Phone</label>                                    │
│      <p class="description">Include country code</p>        │
│      <input>                                                 │
│    </div>                                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## State Transitions

### Signal Extraction Flow

```
Form Field Detected
        │
        ▼
┌───────────────────┐
│ Extract Label     │ (existing logic)
│ - for-id          │
│ - wrapper         │
│ - aria-labelledby │
│ - proximity       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Extract HTML Attrs│
│ - autocomplete    │
│ - aria-label      │
│ - placeholder     │
│ - name            │
│ - id              │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Extract Hint Text │
│ - aria-describedby│
│ - sibling hints   │
│ - parent desc     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Build FieldSignals│
│ - Sanitize text   │
│ - Set confidence  │
│ - Record sources  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Attach to         │
│ FormField object  │
└───────────────────┘
```

---

## Backward Compatibility

### API Request Migration

**Before (v1):**
```json
{
  "label": "Email Address",
  "context_hints": null,
  "field_type": "email",
  "form_url": "https://example.com/apply"
}
```

**After (v2):**
```json
{
  "label": "Email Address",
  "signals": {
    "label_text": "Email Address",
    "label_confidence": "high",
    "label_source": "for-id",
    "autocomplete": "email",
    "placeholder": "you@example.com",
    "input_name": "email",
    "html_type": "email"
  },
  "context_hints": null,
  "form_url": "https://example.com/apply"
}
```

The `field_type` parameter is deprecated; API derives semantic type from `signals`.

---

## Validation Rules

### FieldSignals Validation

| Field | Rule | Error Handling |
|-------|------|----------------|
| `label.text` | Max 500 chars, trimmed | Truncate with warning |
| `autocomplete` | Valid HTML5 value or null | Pass as-is, API validates |
| `aria-label` | Max 500 chars, trimmed | Truncate with warning |
| `placeholder` | Max 500 chars, trimmed | Truncate with warning |
| `name` | Max 200 chars | Truncate if needed |
| `id` | Max 200 chars | Truncate if needed |
| `hint.text` | Max 1000 chars, trimmed | Truncate with warning |
| `htmlType` | Must be valid HtmlInputType | Default to 'unknown' |

---

## Error States

| Error Code | Description | Recovery |
|------------|-------------|----------|
| `SIGNAL_EXTRACTION_FAILED` | Exception during extraction | Log error, return partial signals |
| `INVALID_AUTOCOMPLETE` | Malformed autocomplete value | Pass as-is, API handles |
| `HINT_ELEMENT_NOT_FOUND` | aria-describedby target missing | Skip hint, continue |
| `TEXT_TOO_LONG` | Signal text exceeds limit | Truncate and include |

---

## File Structure Updates

| File | Changes |
|------|---------|
| `extension/content/signal-extractor.js` | **NEW**: Signal extraction functions |
| `extension/content/form-scanner.js` | Import and use signal extractor |
| `extension/content/api-client.js` | Include signals in payload |
| `extension/background/background.js` | Pass signals through message handlers |
| `extension/lib/types.ts` | Add FieldSignals interface |
| `specs/003-form-filler-extension/data-model.md` | Reference new FieldSignals |
