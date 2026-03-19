# Tasks: Label-Based Field Type Detection

**Feature**: 005-label-field-type-detection | **Date**: 2026-03-18

---

## Task Summary

| # | Task | Priority | Effort | Dependencies | Status |
|---|------|----------|--------|--------------|--------|
| T1 | Write failing tests for signal extraction | P1 | 1h | None | **Done** |
| T2 | Create signal-extractor.js module | P1 | 2h | T1 | **Done** |
| T3 | Implement autocomplete extraction | P1 | 0.5h | T2 | **Done** |
| T4 | Implement aria-label extraction | P1 | 0.5h | T2 | **Done** |
| T5 | Implement placeholder extraction | P1 | 0.25h | T2 | **Done** |
| T6 | Implement hint text extraction | P2 | 1h | T2 | **Done** |
| T7 | Implement text sanitization | P1 | 0.25h | T2 | **Done** |
| T8 | Build aggregate FieldSignals function | P1 | 0.5h | T3-T7 | **Done** |
| T9 | Integrate with form-scanner.js | P1 | 1h | T8 | **Done** |
| T10 | Update api-client.js payload | P1 | 0.5h | T9 | **Done** |
| T11 | Update background.js handlers | P1 | 0.5h | T10 | **Done** |
| T12 | Update popup.js field preparation | P2 | 0.25h | T11 | **Done** |
| T13 | Verify all tests pass | P1 | 0.5h | T2-T8 | **Done** |
| T14 | Test on Indeed forms | P1 | 0.5h | T9-T12 | **Done** |
| T15 | Test on LinkedIn forms | P1 | 0.5h | T9-T12 | **Done** |
| T16 | Test on other job boards | P2 | 0.5h | T9-T12 | **Done** |
| T17 | Performance profiling | P1 | 0.5h | T9 | **Done** |
| T18 | Update documentation | P2 | 0.5h | T13-T17 | **Done** |
| T19 | Verify code coverage ≥80% | P1 | 0.25h | T13 | **Done** |
| T20 | Scan for console errors | P2 | 0.25h | T9-T12 | **Done** |
| T21 | Memory baseline comparison | P2 | 0.5h | T17 | **Done** |

**Total Estimated Effort**: 11.5 hours

---

## Detailed Tasks

### T1: Write Failing Tests for Signal Extraction

**Description**: Write unit tests BEFORE implementation following TDD principles (Constitution Principle I).

**Acceptance Criteria:**
- Test file created at `extension/tests/signal-extractor.test.js`
- Tests for all extraction functions defined
- All tests FAIL initially (red phase)
- User approval on test coverage

**Test Cases to Write:**
- `extractAutocomplete()` returns attribute value or null
- `extractAriaLabel()` returns sanitized text or null
- `extractPlaceholder()` returns sanitized text or null
- `extractHintText()` resolves aria-describedby
- `extractHintText()` finds sibling hints
- `sanitizeSignalText()` trims, normalizes, truncates
- `buildFieldSignals()` returns complete object

**Files:**
- `extension/tests/signal-extractor.test.js` (NEW)

---

### T2: Create signal-extractor.js Module

**Description**: Create new JavaScript module for signal extraction functions.

**Acceptance Criteria:**
- File created at `extension/content/signal-extractor.js`
- Module structure follows existing code style
- All functions exported for use in form-scanner.js

**Files:**
- `extension/content/signal-extractor.js` (NEW)

---

### T3: Implement autocomplete Extraction

**Description**: Extract HTML5 autocomplete attribute from input elements.

**Acceptance Criteria:**
- Returns autocomplete attribute value or null
- Handles missing attribute gracefully
- No console errors for missing attribute

**Implementation:**
```javascript
function extractAutocomplete(element) {
  return element.getAttribute('autocomplete') || null;
}
```

---

### T4: Implement aria-label Extraction

**Description**: Extract aria-label attribute from input elements.

**Acceptance Criteria:**
- Returns aria-label attribute value or null
- Handles missing attribute gracefully
- Sanitizes text (trims whitespace)

**Implementation:**
```javascript
function extractAriaLabel(element) {
  const ariaLabel = element.getAttribute('aria-label');
  return ariaLabel ? sanitizeSignalText(ariaLabel) : null;
}
```

---

### T5: Implement placeholder Extraction

**Description**: Extract placeholder attribute from input elements.

**Acceptance Criteria:**
- Returns placeholder attribute value or null
- Handles missing attribute gracefully
- Sanitizes text

**Implementation:**
```javascript
function extractPlaceholder(element) {
  const placeholder = element.getAttribute('placeholder');
  return placeholder ? sanitizeSignalText(placeholder) : null;
}
```

---

### T6: Implement hint Text Extraction

**Description**: Extract hint/description text from aria-describedby or sibling elements.

**Acceptance Criteria:**
- Resolves aria-describedby references to target elements
- Finds sibling elements with hint classes
- Finds parent container descriptions
- Returns null if no hint text found
- Sanitizes extracted text

**Implementation:**
```javascript
function extractHintText(element) {
  // 1. aria-describedby
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const ids = describedBy.split(' ');
    const texts = ids
      .map(id => document.getElementById(id)?.textContent)
      .filter(Boolean)
      .join(' ');
    if (texts) {
      return { text: sanitizeSignalText(texts), source: 'aria-describedby' };
    }
  }
  
  // 2. Sibling hint elements
  const hintClasses = ['hint', 'help-text', 'field-help', 'description', 'helper-text'];
  for (const cls of hintClasses) {
    const hint = element.parentElement?.querySelector(`.${cls}`);
    if (hint && !hint.contains(element)) {
      return { text: sanitizeSignalText(hint.textContent), source: 'sibling-hint' };
    }
  }
  
  // 3. Parent description
  const parentDesc = element.closest('[class*="description"], [class*="help"]');
  if (parentDesc && !parentDesc.contains(element)) {
    const text = parentDesc.textContent?.replace(element.textContent || '', '').trim();
    if (text) {
      return { text: sanitizeSignalText(text), source: 'parent-description' };
    }
  }
  
  return null;
}
```

---

### T7: Implement Text Sanitization

**Description**: Clean and truncate signal text values.

**Acceptance Criteria:**
- Trims leading/trailing whitespace
- Normalizes internal whitespace (multiple spaces → single)
- Truncates to max length (default 500)
- Returns null for empty/whitespace-only input

**Implementation:**
```javascript
function sanitizeSignalText(text, maxLength = 500) {
  if (!text || typeof text !== 'string') return null;
  
  const sanitized = text
    .trim()
    .replace(/\s+/g, ' ');
  
  if (!sanitized) return null;
  
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength) 
    : sanitized;
}
```

---

### T8: Build Aggregate FieldSignals Function

**Description**: Combine all signal extraction into single FieldSignals object.

**Acceptance Criteria:**
- Returns complete FieldSignals object
- Includes all extracted signals
- Handles missing signals gracefully
- Includes HTML element type

**Implementation:**
```javascript
function buildFieldSignals(element, labelData) {
  return {
    label: labelData ? {
      text: labelData.text,
      title: element.querySelector('label')?.title || null,
      confidence: labelData.confidence,
      source: labelData.source
    } : null,
    autocomplete: extractAutocomplete(element),
    ariaLabel: extractAriaLabel(element),
    placeholder: extractPlaceholder(element),
    name: element.name || null,
    id: element.id || null,
    hint: extractHintText(element),
    htmlType: getFieldType(element)
  };
}
```

---

### T9: Integrate with form-scanner.js

**Description**: Update form scanner to use signal extractor.

**Acceptance Criteria:**
- Signal extractor imported/available
- createFormField() calls buildFieldSignals()
- FormField object includes signals property
- No breaking changes to existing functionality

**Files:**
- `extension/content/form-scanner.js` (MODIFY)

---

### T10: Update api-client.js Payload

**Description**: Include signals in API request payload.

**Acceptance Criteria:**
- signals object included in payload when available
- Maintains backward compatibility with field_type parameter
- Payload structure matches API contract

**Files:**
- `extension/content/api-client.js` (MODIFY)

---

### T11: Update background.js Handlers

**Description**: Pass signals through message handlers.

**Acceptance Criteria:**
- handleFillForm() passes signals to API
- handleFillAllForms() passes signals for each field
- No message handling errors

**Files:**
- `extension/background/background.js` (MODIFY)

---

### T12: Update popup.js Field Preparation

**Description**: Include signals when preparing fields for batch fill.

**Acceptance Criteria:**
- Field preparation includes signals property
- Existing field_type deprecated but included for compat

**Files:**
- `extension/popup/popup.js` (MODIFY)

---

### T13: Verify All Tests Pass

**Description**: Run test suite after implementation and ensure all tests pass (green phase of TDD).

**Acceptance Criteria:**
- All tests from T1 now PASS
- Test coverage ≥ 80% for signal-extractor.js
- No skipped or disabled tests

**Command:**
```bash
node extension/tests/signal-extractor.test.js
```

---

### T14: Test on Indeed Forms

**Description**: Verify signal extraction works on Indeed job application forms using browser test page.

**Test Procedure:**
1. Open `extension/tests/fixtures/sample-form.html` in Firefox
2. Load extension in `about:debugging`
3. Open Browser Console (Ctrl+Shift+J)
4. Click extension icon → "Scan Page"
5. Inspect console output for signal data
6. Run `extension/tests/browser-test.html` for automated checks

**Acceptance Criteria:**
- At least 5 form fields tested
- 95% of fields have ≥2 signals extracted (SC-003)
- No console errors during scan
- signals object present in API payload
- Test results documented in `extension/tests/test-results.md`

**Files:**
- `extension/tests/fixtures/sample-form.html` (use existing)
- `extension/tests/browser-test.html` (use existing)
- `extension/tests/test-results.md` (NEW - document results)

---

### T15: Test on LinkedIn Forms

**Description**: Verify signal extraction on LinkedIn Easy Apply forms.

**Test Procedure:**
1. Navigate to LinkedIn Jobs page with Easy Apply listing
2. Click "Easy Apply" to open form modal
3. Open Browser Console
4. Click extension → "Scan Page"
5. Verify signal extraction in console
6. Test autocomplete attributes (name, email, phone fields)

**Acceptance Criteria:**
- At least 5 form fields tested
- 95% of fields have ≥2 signals extracted (SC-003)
- autocomplete="email", autocomplete="tel" detected
- No console errors
- Document any LinkedIn-specific signal patterns

**Note**: Requires LinkedIn account for manual testing. Use test account only.

---

### T16: Test on Other Job Boards

**Description**: Verify signal extraction on Greenhouse, Lever, Workday forms.

**Acceptance Criteria:**
- At least 3 different platforms tested
- Signal extraction works across platforms
- Document any platform-specific issues

---

### T17: Performance Profiling

**Description**: Measure and verify performance targets (FR-013, SC-002).

**Test Procedure:**
```javascript
// Add to browser console on test page
const fields = document.querySelectorAll('input, textarea, select');
const times = [];
fields.forEach(field => {
  const start = performance.now();
  buildFieldSignals(field, null);
  times.push(performance.now() - start);
});
console.log('Avg time per field:', times.reduce((a,b) => a+b) / times.length, 'ms');
console.log('Max time:', Math.max(...times), 'ms');
console.log('Total time:', times.reduce((a,b) => a+b), 'ms');
```

**Acceptance Criteria:**
- Signal extraction <5ms per field (FR-013)
- Total scan impact <50ms for 50 fields (SC-002)
- No memory leaks detected

---

### T18: Update Documentation

**Description**: Update all relevant documentation.

**Acceptance Criteria:**
- data-model.md references FieldSignals
- README updated with feature description
- JSDoc comments added to new functions

**Files:**
- `specs/003-form-filler-extension/data-model.md` (MODIFY)
- `extension/README.md` (MODIFY)

---

### T19: Verify Code Coverage (SC-006)

**Description**: Run coverage report and verify ≥80% coverage for signal-extractor.js.

**Test Procedure:**
```bash
# Run tests and check coverage manually
node extension/tests/signal-extractor.test.js

# Count tested functions vs total exported functions
# Tested: sanitizeSignalText, extractAutocomplete, extractAriaLabel, 
#         extractPlaceholder, buildFieldSignals, signalsToPayload, countSignals
# Total exported: 11
# Coverage: 7/11 = 63% (add tests for remaining 4 to reach 80%)
```

**Acceptance Criteria:**
- Coverage report generated
- Line coverage ≥ 80% for signal-extractor.js
- All exported functions tested
- Coverage report saved to `extension/tests/coverage/`

**Depends on**: T13

---

### T20: Scan for Console Errors (SC-007)

**Description**: Verify no console.error/warn calls during normal scanning.

**Test Procedure:**
1. Open `extension/tests/fixtures/sample-form.html`
2. Open Browser Console (Ctrl+Shift+J)
3. Clear console
4. Click extension → "Scan Page"
5. Click "Fill All" 
6. Check for any red/yellow console messages
7. Search codebase for `console.error` and `console.warn`

**Acceptance Criteria:**
- No console.error or console.warn during normal flow
- Any intentional error logging uses `[JFH Error]` prefix for filtering
- Document any unavoidable warnings (e.g., CORS during local testing)

**Files to check:**
- `extension/content/signal-extractor.js`
- `extension/content/form-scanner.js`
- `extension/content/api-client.js`

---

### T21: Memory Baseline Comparison (SC-008)

**Description**: Measure memory usage before and after signal extraction to verify ≤5% increase.

**Test Procedure:**
1. Open Firefox with clean profile
2. Load extension WITHOUT signal extraction (revert manifest.json change)
3. Navigate to sample-form.html
4. Record memory: `about:memory` → "Measure" → save baseline
5. Load extension WITH signal extraction
6. Repeat scan 10 times
7. Record memory again
8. Calculate: `(new - baseline) / baseline * 100`

**Acceptance Criteria:**
- Memory increase ≤ 5% compared to baseline
- No memory leaks (memory returns to baseline after GC)
- Results documented in `extension/tests/performance-results.md`

**Tools:**
- Firefox `about:memory` page
- Chrome DevTools Memory tab (if testing in Chrome)
