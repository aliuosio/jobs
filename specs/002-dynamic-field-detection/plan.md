# Implementation Plan: Dynamic Form Field Detection

**Branch**: `002-dynamic-field-detection` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Status**: ✅ COMPLETE

## Summary

Extend the `FormObserver` class to detect dynamically loaded individual form fields (`<input>`, `<textarea>`, `<select>`) in addition to existing `<form>` element detection. Enables the extension to work with SPA-style job application pages ( like Proxify) where fields load progressively after initial page load.

## Technical Context

**Language/Version**: JavaScript (ES6+) - Firefox Extension Manifest v3  
**Primary Dependencies**: Pure DOM APIs (no external libraries)  
**Storage**: Extension memory only (no persistent storage)  
**Testing**: Node.js with mock DOM (`simulated-browser-test.js` pattern)  
**Target Platform**: Firefox Browser Extension  
**Project Type**: browser-extension  
**Performance Goals**: <1s field detection, <100ms main thread blocking during mutation processing  
**Constraints**: 300ms debounce, 200 field limit, WeakSet deduplication  
**Scale/Scope**: Single-page applications with dynamic forms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID Design | ✅ PASS | Single responsibility per observer, single callback per field |
| II. DRY | ✅ PASS | WeakSet deduplication reused from existing pattern |
| III. YAGNI | ✅ PASS | Only required fields implemented |
| IV. KISS | ✅ PASS | Direct extension, no over-engineering |
| V. Type Safety | ✅ PASS | JSDoc annotations maintained |
| VI. Composition | ✅ PASS | No inheritance used |
| VII. Git-Flow | ✅ PASS | Feature branch `002-dynamic-field-detection` |

## Project Structure

### Documentation (this feature)

```text
specs/002-dynamic-field-detection/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Data model documentation
├── quickstart.md        # Implementation guide
├── tasks.md             # Task breakdown (26 tasks)
└── checklists/
    └── requirements.md  # Requirements checklist
```

### Source Code (repository root)

```text
extension/
├── content/
│   ├── content.js         # MODIFIED - Added onFieldDetected callback
│   ├── form-observer.js  # MODIFIED - Extended for field detection
│   ├── form-scanner.js   # UNCHANGED - No modifications needed
│   └── ...
└── tests/
    ├── form-observer.test.js  # NEW - Unit tests (9 tests)
    ├── signal-extractor.test.js
    └── maxlength.test.js
```

**Structure Decision**: Single Firefox extension with content scripts. The `FormObserver` class was extended in place to maintain the single observer pattern.

## Implementation Details

### form-observer.js Changes

| Addition | Purpose |
|----------|---------|
| `MAX_TRACKED_FIELDS = 200` | Field limit constant (Clarification Q4) |
| `processedFields` WeakSet | Track processed field elements |
| `detectedFieldCount` | Count of tracked fields |
| `onFieldDetected` callback | Notify caller of new fields |
| `maxFields` option | Configurable field limit |
| `_getFieldType()` | Determine field type from element |
| `_generateSelector()` | Generate CSS selector for element |
| `_isFieldFillable()` | Check if field can be filled |
| `reconcileFields()` | Re-scan DOM to remove stale fields (Clarification Q5) |

### content.js Changes

| Addition | Purpose |
|----------|---------|
| `onFieldDetected` option | Wire callback to FormObserver |
| `handleFieldDetected()` | Process detected fields with deduplication |

### Callback Signature

```javascript
onFieldDetected(fieldElement, fieldDescriptor)
```

Where `fieldDescriptor`:
```javascript
{
  id: 'jfh-field-N',
  element: HTMLElement,
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'unknown',
  labelText: '',
  selector: 'css selector string',
  isFillable: boolean
}
```

## Testing

### Unit Tests (9 tests, all passing)

| Test | Description |
|------|-------------|
| T001 | Direct field element detection (input, textarea, select) |
| T002 | Field detection from container element |
| T003 | onFieldDetected callback signature verification |
| T012 | Duplicate field prevention via WeakSet |
| T013 | Field limit enforcement (200 fields) |

### Regression Tests

- `signal-extractor.test.js`: 30/30 passing
- `maxlength.test.js`: Pre-existing syntax error (unrelated to this feature)

## Verification

- [x] All unit tests pass
- [x] LSP diagnostics clean
- [ ] Manual testing on Proxify URL (requires browser)

## Completion Status

| Phase | Status |
|-------|--------|
| Phase 0: Research | ✅ Complete |
| Phase 1: Design | ✅ Complete |
| Phase 2: Implementation | ✅ Complete |
| Phase 3: Testing | ✅ Complete |
| Phase 4: Integration | ⏳ Manual testing required |
