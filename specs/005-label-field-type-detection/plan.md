# Implementation Plan: Label-Based Field Type Detection

**Feature**: 005-label-field-type-detection | **Date**: 2026-03-18

---

## Overview

This plan outlines the implementation approach for enhancing the Job Forms Helper extension to extract and transmit semantic signals from form fields.

---

## Phase 1: Signal Extractor Module (2-3 hours)

### Task 1.1: Create Core Module

**File**: `extension/content/signal-extractor.js`

**Functions to implement:**

1. `extractAutocomplete(element)` - Extract autocomplete attribute
2. `extractAriaLabel(element)` - Extract aria-label attribute
3. `extractPlaceholder(element)` - Extract placeholder attribute
4. `extractHintText(element)` - Extract hint/description text
5. `sanitizeSignalText(text, maxLength)` - Clean and truncate text
6. `buildFieldSignals(element, labelData)` - Aggregate all signals

**Dependencies:** None (standalone module)

### Task 1.2: Hint Text Extraction

Implement hint text extraction from multiple sources:

```javascript
function extractHintText(element) {
  // 1. Check aria-describedby
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const hintText = resolveAriaDescribedBy(describedBy);
    if (hintText) return { text: hintText, source: 'aria-describedby' };
  }
  
  // 2. Check sibling hint elements
  const siblingHint = findSiblingHint(element);
  if (siblingHint) {
    return { text: siblingHint, source: 'sibling-hint' };
  }
  
  // 3. Check parent description
  const parentDesc = findParentDescription(element);
  if (parentDesc) {
    return { text: parentDesc, source: 'parent-description' };
  }
  
  return null;
}
```

### Task 1.3: Sanitization

Implement text sanitization:

```javascript
function sanitizeSignalText(text, maxLength = 500) {
  if (!text) return null;
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, maxLength);
}
```

---

## Phase 2: Form Scanner Integration (1-2 hours)

### Task 2.1: Update createFormField()

**File**: `extension/content/form-scanner.js`

**Changes:**

```javascript
// Add import at top
// import { buildFieldSignals } from './signal-extractor.js';

function createFormField(pair) {
  const fillable = isElementFillable(pair.inputElement);
  
  // NEW: Extract signals
  const signals = buildFieldSignals(pair.inputElement, {
    text: pair.labelText,
    confidence: pair.confidence,
    source: pair.detectionMethod
  });
  
  return {
    id: generateFieldId(),
    element: pair.inputElement,
    type: pair.inputType,
    name: pair.inputName,
    elementId: pair.inputElement.id || null,
    labelText: pair.labelText,
    labelConfidence: pair.confidence,
    detectionMethod: pair.detectionMethod,
    isFillable: fillable,
    currentValue: pair.inputElement.value || null,
    filledValue: null,
    selector: generateSelector(pair.inputElement),
    formId: pair.inputElement.form?.id || null,
    
    // NEW: Structured signals
    signals: signals
  };
}
```

### Task 2.2: Add to Export

```javascript
// In module.exports
signalExtractor: {
  buildFieldSignals,
  extractAutocomplete,
  extractAriaLabel,
  extractPlaceholder,
  extractHintText
}
```

---

## Phase 3: API Integration (1-2 hours)

### Task 3.1: Update API Client

**File**: `extension/content/api-client.js`

**Changes to fetchToBackend():**

```javascript
async function fetchToBackend(label, options = {}) {
  const {
    signals = null,      // NEW: structured signals
    contextHints = null,
    fieldType = null,    // DEPRECATED: kept for backward compat
    formUrl = null
  } = options;

  const payload = {
    label: label
  };

  // NEW: Include signals if available
  if (signals) {
    payload.signals = {
      label_text: signals.label?.text,
      label_confidence: signals.label?.confidence,
      label_source: signals.label?.source,
      autocomplete: signals.autocomplete,
      aria_label: signals.ariaLabel,
      placeholder: signals.placeholder,
      input_name: signals.name,
      input_id: signals.id,
      hint_text: signals.hint?.text,
      hint_source: signals.hint?.source,
      html_type: signals.htmlType
    };
  }

  // DEPRECATED: Include for backward compat
  if (fieldType) payload.field_type = fieldType;
  if (contextHints) payload.context_hints = contextHints;
  if (formUrl) payload.form_url = formUrl;

  // ... rest of function unchanged
}
```

### Task 3.2: Update Background Handler

**File**: `extension/background/background.js`

**Changes to handleFillForm():**

```javascript
async function handleFillForm(data) {
  try {
    const response = await fetch(`${API_ENDPOINT}/fill-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: data.label,
        signals: data.signals,  // NEW: pass through signals
        context_hints: data.context_hints || null,
        field_type: data.field_type || null,  // DEPRECATED
        form_url: data.form_url || null
      }),
      signal: AbortSignal.timeout(10000)
    });
    // ... rest unchanged
  }
}
```

### Task 3.3: Update Popup

**File**: `extension/popup/popup.js`

**Changes to handleFillAllClick():**

```javascript
// Prepare field data for batch fill
const fields = detectedFields.map(field => ({
  field_id: field.id,
  label: field.labelText,
  field_type: field.type,  // DEPRECATED
  signals: field.signals     // NEW
}));
```

---

## Phase 4: Testing (2 hours)

### Task 4.1: Unit Tests

Create test file: `extension/tests/signal-extractor.test.js`

**Test cases:**
- `extractAutocomplete()` with various values
- `extractAriaLabel()` with present/missing attribute
- `extractPlaceholder()` with various text
- `extractHintText()` with aria-describedby
- `extractHintText()` with sibling hints
- `sanitizeSignalText()` edge cases
- `buildFieldSignals()` returns complete object

### Task 4.2: Integration Tests

Test on real job boards:

| Platform | Fields to Test | Signals to Verify |
|----------|---------------|-------------------|
| LinkedIn | Email, Name, Phone | autocomplete, label, placeholder |
| Indeed | Email, Phone, Address | label, name, id |
| Greenhouse | All standard fields | Full signal extraction |
| Lever | Email, LinkedIn URL | label, placeholder |
| Workday | Complex forms | All signals |

### Task 4.3: Performance Tests

```javascript
// Measure signal extraction time
console.time('Signal extraction');
const signals = buildFieldSignals(element, labelData);
console.timeEnd('Signal extraction');
// Should be <5ms per field
```

---

## Phase 5: Documentation (1 hour)

### Task 5.1: Update Data Model

Update `specs/003-form-filler-extension/data-model.md` to reference FieldSignals.

### Task 5.2: Add JSDoc

Add comprehensive JSDoc to all new functions in signal-extractor.js.

### Task 5.3: Update README

Document the new signal extraction feature in extension README.

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| form-scanner.js | Internal | Must be updated to call signal extractor |
| api-client.js | Internal | Must be updated to include signals payload |
| background.js | Internal | Must pass signals through message handlers |
| Backend API | External | Must be updated to process signals (separate task) |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Signal extraction fails | Try-catch around extraction, return partial signals |
| API doesn't support signals | Include signals as optional field, backward compat |
| Performance regression | Set strict time budget, profile before merge |
| Missing attributes cause errors | Check for null before accessing attributes |

---

## Rollout Plan

1. **Dev Testing**: Test on local job board mock pages
2. **Staging**: Deploy to test environment with updated API
3. **Production**: Coordinate API deployment with extension update
4. **Monitoring**: Watch for signal extraction errors in logs

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Signal extraction time | <5ms/field | Performance profiling |
| Total scan impact | <50ms increase on 50 fields | Before/after comparison |
| Fields with ≥2 signals | 95% on major job boards | Integration test results |
| API has_data rate | +20% improvement | API analytics comparison |
