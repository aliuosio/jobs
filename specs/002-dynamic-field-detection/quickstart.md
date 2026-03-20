# Quickstart: Dynamic Form Field Detection

## Overview

This feature extends the `FormObserver` class to detect dynamically loaded individual form fields (`<input>`, `<textarea>`, `<select>`) in addition to existing `<form>` element detection.

## Files to Modify

### 1. `extension/content/form-observer.js`

**Changes required**:

```javascript
// Constructor - add processedFields WeakSet and onFieldDetected callback
constructor(options = {}) {
  this.debounceMs = options.debounceMs || 300;
  this.maxWaitMs = options.maxWaitMs || 10000;
  this.onFormDetected = options.onFormDetected || (() => {});
  this.onFieldDetected = options.onFieldDetected || (() => {});  // NEW
  
  this.observer = null;
  this.processedForms = new WeakSet();
  this.processedFields = new WeakSet();  // NEW
  this.pendingMutations = [];
  this.debounceTimer = null;
  this.scanStartTime = null;
  this.isScanning = false;
}
```

```javascript
// processPendingMutations() - add field detection after form detection
processPendingMutations() {
  const formsToProcess = new Set();
  const fieldsToProcess = new Set();  // NEW
  
  this.pendingMutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Existing form detection...
        
        // NEW: Check for field elements directly
        const fieldTagNames = ['INPUT', 'TEXTAREA', 'SELECT'];
        if (fieldTagNames.includes(node.tagName)) {
          fieldsToProcess.add(node);
        }
        
        // NEW: Check for fields inside added nodes
        if (node.querySelectorAll) {
          node.querySelectorAll('input, textarea, select').forEach(f => fieldsToProcess.add(f));
        }
      }
    });
  });
  
  // Process new forms (existing)...
  
  // NEW: Process new fields
  fieldsToProcess.forEach(field => {
    if (!this.processedFields.has(field) && !this.processedForms.has(field)) {
      this.processedFields.add(field);
      this.onFieldDetected(field);
    }
  });
  
  this.pendingMutations = [];
  this.debounceTimer = null;
}
```

```javascript
// reset() - also reset processedFields
reset() {
  this.processedForms = new WeakSet();
  this.processedFields = new WeakSet();  // NEW
  this.pendingMutations = [];
  this._processedCount = 0;
}
```

### 2. `extension/content/content.js`

**Changes required**:

```javascript
// In initContentScript(), add onFieldDetected callback
formObserver = new FormObserver({
  debounceMs: 300,
  maxWaitMs: 10000,
  onFormDetected: handleFormDetected,
  onFieldDetected: handleFieldDetected  // NEW
});
```

```javascript
// NEW: Add field detection handler
function handleFieldDetected(fieldElement) {
  console.log('[Content] New field detected');
  
  // Scan the container for fields
  const container = fieldElement.closest('div, section, article, form') || fieldElement.parentElement;
  const newFields = scanForm(container);
  
  newFields.forEach(field => {
    const existing = detectedFields.find(f => f.element === field.element);
    if (!existing) {
      detectedFields.push(field);
      fieldCount++;
      
      if (field.isFillable) {
        field.element.classList.add('jfh-field-detected');
      }
    }
  });
  
  browser.runtime.sendMessage({
    type: 'FIELDS_UPDATED',
    data: { count: fieldCount }
  });
}
```

## Testing

### Run Existing Tests

```bash
node extension/tests/simulated-browser-test.js
node extension/tests/signal-extractor.test.js
node extension/tests/maxlength.test.js
```

### Manual Testing

1. **Open Firefox** and navigate to `about:debugging#/runtime/this-firefox`
2. **Load the extension** from `extension/` directory
3. **Navigate to test page**: `https://apply.proxify.io/?uuid=51379ba3-35c9-4190-b7ad-8a9fd28628d3&step=CurrentlyBasedOn`
4. **Open browser console** and filter for `[Content]`
5. **Click extension icon** to see detected fields
6. **Verify** fields appear as they load dynamically

### Debug Logging

Look for these console messages:
- `[Content] New form detected` - form-level detection (existing)
- `[Content] New field detected` - field-level detection (NEW)

## Verification Checklist

- [ ] Fields load dynamically appear in extension popup
- [ ] No duplicate fields when same element detected multiple times
- [ ] Popup shows updated field count after dynamic loading
- [ ] Visual indicators (`jfh-field-detected`) appear on new fields
- [ ] Existing tests still pass
