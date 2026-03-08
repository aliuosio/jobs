# Research: Form Filler Browser Extension

**Feature**: 003-form-filler-extension | **Date**: 2026-03-08

## Summary

Research consolidated from librarian agents to resolve all technical unknowns for the Firefox WebExtension implementation.

---

## 1. Firefox Manifest V3 Structure

### Decision
Use **Manifest V3** with standard Firefox WebExtension structure.

### Rationale
- Firefox supports Manifest V3 since Firefox 109
- Standard action/background/content_scripts structure
- No service_worker (Firefox uses scripts array)
- Native promises support (no callbacks needed)

### Configuration
```json
{
  "manifest_version": 3,
  "name": "Job Forms Helper",
  "version": "1.0.0",
  "browser_specific_settings": {
    "gecko": {
      "id": "job-forms@example.com",
      "strict_min_version": "109.0"
    }
  },
  "permissions": ["activeTab", "storage", "scripting"],
  "background": {
    "scripts": ["background/background.js"],
    "type": "module"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    },
    "default_title": "Job Forms Helper",
    "default_popup": "popup/popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_idle"
    }
  ]
}
```

---

## 2. DOM Event Injection for React/Angular/Vue

### Decision
Use **native setter pattern + event dispatch** with `bubbles: true`.

### Rationale
- Direct `element.value = x` doesn't trigger React's onChange
- React uses `_valueTracker` to prevent duplicate events
- Native setters bypass virtual DOM tracking
- Works across all major frameworks

### Implementation Pattern
```javascript
function setFormValue(element, value) {
  // Focus element
  element.focus();
  
  // Get native setter from prototype
  const nativeSetter = Object.getOwnPropertyDescriptor(
    element.tagName === 'TEXTAREA' 
      ? window.HTMLTextAreaElement.prototype 
      : window.HTMLInputElement.prototype, 
    'value'
  ).set;
  
  // Call native setter
  nativeSetter.call(element, value);
  
  // Handle React's value tracker
  if (element._valueTracker) {
    element._valueTracker.setValue('');
  }
  
  // Dispatch events with bubbles: true
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}
```

### Event Dispatch Requirements (Constitution V)

Per Constitution Principle V, the extension must dispatch both `input` and `change` events with `bubbles: true`:

```javascript
// From spec FR-005
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
```

---

## 3. Label-Input Detection Patterns

### Decision
Use **multi-strategy detection** with for/id, wrapper, and proximity heuristics.

### Rationale
- Job boards use various form structures
- Some use explicit for/id attributes
- Others wrap inputs in labels
- Some use aria-labelledby or placeholder fallback

### Detection Strategies

#### Strategy 1: Explicit for/id Association
```javascript
function detectForIdLabels(form) {
  const pairs = [];
  const labels = form.querySelectorAll('label[for]');
  
  labels.forEach(label => {
    const input = document.getElementById(label.htmlFor);
    if (input) {
      pairs.push({
        label: label.textContent.trim(),
        input: input,
        confidence: 'high'
      });
    }
  });
  
  return pairs;
}
```

#### Strategy 2: Wrapper Pattern
```javascript
function detectWrapperLabels(form) {
  const pairs = [];
  const labels = form.querySelectorAll('label');
  
  labels.forEach(label => {
    if (!label.htmlFor) {
      const input = label.querySelector('input, textarea, select');
      if (input) {
        pairs.push({
          label: label.textContent.trim(),
          input: input,
          confidence: 'high'
        });
      }
    }
  });
  
  return pairs;
}
```

#### Strategy 3: Proximity Heuristic
```javascript
function detectProximityLabels(form) {
  const pairs = [];
  const inputs = form.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    // Skip if already paired
    if (input.dataset.paired) return;
    
    // Find nearest label-like element
    const container = input.closest('div, p, section');
    if (container) {
      const labelElement = container.querySelector('label, .label, [class*="label"]');
      if (labelElement) {
        pairs.push({
          label: labelElement.textContent.trim(),
          input: input,
          confidence: 'medium'
        });
      }
    }
  });
  
  return pairs;
}
```

---

## 4. MutationObserver for Dynamic Forms

### Decision
Use **debounced MutationObserver** with WeakSet tracking.

### Rationale
- SPA frameworks dynamically load forms
- Debouncing prevents excessive processing
- WeakSet prevents memory leaks and duplicate processing
- Re-scan on DOM changes

### Implementation
```javascript
class FormObserver {
  constructor(debounceMs = 300) {
    this.debounceMs = debounceMs;
    this.observer = null;
    this.processedForms = new WeakSet();
    this.pendingMutations = [];
    this.debounceTimer = null;
  }
  
  start(callback) {
    this.callback = callback;
    
    // Initial scan
    this.scanForForms();
    
    // Set up observer
    this.observer = new MutationObserver((mutations) => {
      this.handleMutationsDebounced(mutations);
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  handleMutationsDebounced(mutations) {
    this.pendingMutations.push(...mutations);
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processPendingMutations();
    }, this.debounceMs);
  }
  
  processPendingMutations() {
    const formsToProcess = new Set();
    
    this.pendingMutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'FORM') {
            formsToProcess.add(node);
          } else if (node.querySelector) {
            const forms = node.querySelectorAll('form');
            forms.forEach(form => formsToProcess.add(form));
          }
        }
      });
    });
    
    formsToProcess.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form);
        this.callback(form);
      }
    });
    
    this.pendingMutations = [];
    this.debounceTimer = null;
  }
  
  scanForForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form);
        this.callback(form);
      }
    });
  }
  
  stop() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.observer) this.observer.disconnect();
  }
}
```

---

## 5. Message Passing Architecture

### Decision
Use **WebExtensions runtime.sendMessage** pattern for content-to-background communication.

### Message Types
```javascript
// Content -> Background
{
  type: 'FILL_FORM',
  data: { label: 'Years of experience', context: '...' }
}

// Background -> Content
{
  type: 'FORM_FILLED',
  data: { value: '5 years', success: true }
}
```

### Background Script Handler
```javascript
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'FILL_FORM':
      return handleFillForm(message.data);
    default:
      return Promise.resolve({ error: 'Unknown message type' });
  }
});

async function handleFillForm(data) {
  const response = await fetch('http://localhost:8000/fill-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: data.label })
  });
  return response.json();
}
```

---

## 6. Popup UI Pattern

### Decision
Use **browser action popup** with HTML/CSS/JS.

### Rationale
- Standard Firefox extension pattern
- Dedicated UI without page modification
- Works across all sites
- Easy to implement and test

### Popup HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <h2>Job Forms Helper</h2>
    
    <div class="section">
      <button id="fill-all-btn">Fill All Forms</button>
      <button id="scan-btn">Scan Page</button>
    </div>
    
    <div class="section">
      <h3>Detected Fields: <span id="field-count">0</span></h3>
    </div>
    
    <div class="section">
      <p>Status: <span id="status">Ready</span></p>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

---

## 7. API Integration

### Decision
Use **fetch API** with POST to `http://localhost:8000/fill-form`.

### Configuration
```javascript
const API_ENDPOINT = 'http://localhost:8000';

async function getFormFillValue(labelText) {
  const response = await fetch(`${API_ENDPOINT}/fill-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      label: labelText
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.answer;
}
```

---

## 8. Constitution Compliance Summary

| Principle | Implementation |
|-----------|----------------|
| I. Data Integrity | N/A - Extension layer only |
| II. Retrieval Law | N/A - Extension layer only |
| III. Zero Hallucination | N/A - Extension layer only |
| IV. CORS Policy | localhost:8000 endpoint |
| V. DOM Injection | input/change events with bubbles: true + native setters |

---

## References

- [MDN WebExtensions Manifest V3](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
- [MDN Content Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
- [MDN Modify a Web Page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Modify_a_web_page)
- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [Testing Library fireEvent](https://testing-library.com/docs/dom-testing-library/api-events/)
