# Implementation Checklist: Signal Extraction

**Feature**: 005-label-field-type-detection | **Date**: 2026-03-18

## Pre-Implementation

- [X] **CHK001** - Review existing form-scanner.js code structure
- [X] **CHK002** - Verify API backend readiness for signals payload (coordinate with backend team)
- [X] **CHK003** - Create feature branch from main
- [X] **CHK004** - Set up local test environment with sample job application forms

---

## Core Implementation

### Signal Extractor Module (`signal-extractor.js`)

- [X] **CHK010** - Create `extension/content/signal-extractor.js` file
- [X] **CHK011** - Implement `extractAutocomplete(element)` function
- [X] **CHK012** - Implement `extractAriaLabel(element)` function
- [X] **CHK013** - Implement `extractPlaceholder(element)` function
- [X] **CHK014** - Implement `extractHintText(element)` function:
  - [X] CHK014a - Handle `aria-describedby` resolution
  - [X] CHK014b - Handle sibling hint elements with common classes
  - [X] CHK014c - Handle parent container descriptions
- [X] **CHK015** - Implement `sanitizeSignalText(text, maxLength)` function
- [X] **CHK016** - Implement `buildFieldSignals(element, labelData)` function
- [X] **CHK017** - Add error handling for each extraction function
- [X] **CHK018** - Export all functions for use in form-scanner.js

### Form Scanner Integration

- [X] **CHK020** - Import signal extractor in `form-scanner.js`
- [X] **CHK021** - Update `createFormField()` to call signal extractor
- [X] **CHK022** - Add `signals` property to FormField return object
- [X] **CHK023** - Ensure backward compatibility (signals is additive)

### API Client Updates

- [X] **CHK030** - Update `fetchToBackend()` in `api-client.js`
- [X] **CHK031** - Add `signals` parameter to function signature
- [X] **CHK032** - Include `signals` object in API request payload
- [X] **CHK033** - Maintain backward compatibility with `field_type` parameter

### Background Script Updates

- [X] **CHK040** - Update `handleFillForm()` in `background.js`
- [X] **CHK041** - Pass `signals` from incoming message to API call
- [X] **CHK042** - Update `handleFillAllForms()` to include signals

### Popup Updates (Optional)

- [ ] **CHK050** - Update `renderFieldsList()` to optionally show signal count
- [ ] **CHK051** - Add debug mode toggle to show full signal data
- [ ] **CHK052** - Update field item template to display signal indicators

**Note**: Popup updates are optional (P2 priority) - core functionality works without these.

---

## Testing

### Unit Tests

- [X] **CHK060** - Test `extractAutocomplete()` with various attribute values
- [X] **CHK061** - Test `extractAriaLabel()` with present/missing attributes
- [X] **CHK062** - Test `extractPlaceholder()` with various text content
- [X] **CHK063** - Test `extractHintText()` with aria-describedby
- [X] **CHK064** - Test `extractHintText()` with sibling hint elements
- [X] **CHK065** - Test `sanitizeSignalText()` with edge cases:
  - [X] Empty strings
  - [X] Very long strings (>1000 chars)
  - [X] Strings with special characters
  - [X] Unicode/international text
- [X] **CHK066** - Test `buildFieldSignals()` returns complete object

### Integration Tests

- [X] **CHK070** - Test signal extraction on Indeed job application form
- [X] **CHK071** - Test signal extraction on LinkedIn job application form
- [X] **CHK072** - Test signal extraction on Greenhouse-hosted forms
- [X] **CHK073** - Test signal extraction on Lever-hosted forms
- [X] **CHK074** - Test signal extraction on Workday-hosted forms
- [X] **CHK075** - Verify all signals are included in API request payload

### Performance Tests

- [X] **CHK080** - Measure signal extraction time per field (<5ms target)
- [X] **CHK081** - Measure total scan time impact on 50-field form (<50ms increase)
- [X] **CHK082** - Profile memory usage before/after implementation

### Edge Case Tests

- [X] **CHK090** - Test field with no signals (no label, no attributes)
- [X] **CHK091** - Test field with contradictory signals (label vs autocomplete)
- [X] **CHK092** - Test field with aria-describedby pointing to non-existent element
- [X] **CHK093** - Test field with very long placeholder text
- [X] **CHK094** - Test field with special characters in name/id
- [X] **CHK095** - Test contenteditable fields
- [X] **CHK096** - Test select elements with signals

---

## Documentation

- [X] **CHK100** - Update `specs/003-form-filler-extension/data-model.md` with FieldSignals reference
- [X] **CHK101** - Update extension README with signal extraction feature
- [X] **CHK102** - Add JSDoc comments to all new functions
- [X] **CHK103** - Create API payload examples in documentation
- [X] **CHK104** - Document signal priority/confidence logic

---

## Quality Assurance

- [X] **CHK110** - No console errors during normal scanning
- [X] **CHK111** - No regression in existing field detection tests
- [X] **CHK112** - Code coverage ≥ 80% for signal-extractor.js
- [ ] **CHK113** - ESLint passes with no new warnings
- [ ] **CHK114** - Manual testing on 5+ different job board forms
- [X] **CHK115** - Verify backward compatibility with existing API

---

## Deployment

- [ ] **CHK120** - Merge feature branch to main
- [ ] **CHK121** - Update extension version in manifest.json
- [ ] **CHK122** - Coordinate API deployment with backend team
- [ ] **CHK123** - Test end-to-end flow with production-like API

---

## Acceptance Criteria Summary

| Criteria | Verification Method |
|----------|---------------------|
| Signal extraction adds <5ms per field | Performance test CHK080 |
| Total scan impact <50ms on 50 fields | Performance test CHK081 |
| 95% of fields have ≥2 signals on major job boards | Integration tests CHK070-074 |
| Zero regression in existing functionality | Test suite pass |
| API receives structured signals payload | Integration test CHK075 |
