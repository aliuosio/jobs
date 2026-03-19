/**
 * Unit tests for maxlength handling
 * Run with: node extension/tests/maxlength.test.js
 */

const assert = require('assert');

const {
  fillField,
} = require('../content/field-filler.js');

const {
  sanitizeSignalText,
} = require('../content/signal-extractor.js');

const {
  extractAutocomplete,
  extractAriaLabel,
  extractPlaceholder,
  buildFieldSignals,
  signalsToPayload
  countSignals
  cleanLabelText
} = require('../content/signal-extractor.js');

const {
  scanForm,
} = require('../content/form-scanner.js');

const {
  getFieldType
} = require('../content/form-scanner.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
  }
}

// ========== maxlength handling tests ==========

test('fillField: no truncation when maxlength is -1', () => {
  // Create a mock element
  const element = {
    tagName: 'INPUT',
    type: 'text',
    value: '',
    maxLength: -1,
    focus: () => {},
    dispatchEvent: () => {},
    classList: { add: () => {}, remove: () => }
  };
  
  // Test with a 14-character value
  const result = fillField(element, 'This is 14 chars');
  
  // Verify no truncation occurred
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, false);
  assert.strictEqual(result.filledLength, 14);
});

test('fillField: no truncation when maxlength is undefined', () => {
  // Create a mock element without maxLength
  const element = {
    tagName: 'INPUT',
    type: 'text',
    value: '',
    focus: () => {},
    dispatchEvent: () => {},
    classList: { add: () => {}, remove: () => {} }
  };
  
  const result = fillField(element, 'This is 14 chars');
  
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, false);
  assert.strictEqual(result.filledLength, 14);
});

test('fillField: truncation occurs when maxlength is 5', () => {
  // Create a mock element with maxlength = 5
  const element = {
    tagName: 'INPUT',
    type: 'text',
    value: '',
    maxLength: 5,
    focus: () => {},
    dispatchEvent: () => {},
    classList: { add: () => {}, remove: () => {} }
  };
  
  const result = fillField(element, 'This is 14 chars', { maxlength: 5 });
  
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, true);
  assert.strictEqual(result.filledLength, 5);
});

test('fillField: no truncation when maxlength is 0', () => {
  // Create a mock element with maxlength = 0
  const element = {
    tagName: 'INPUT',
    type: 'text',
    value: '',
    maxLength: 0,
    focus: () => {},
    dispatchEvent: () => {},
    classList: { add: () => {}, remove: () => {} }
  };
  
  const result = fillField(element, 'This is 14 chars', { maxlength: 0 });
  
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, false);
    assert.strictEqual(result.filledLength, 14);
});

// ========== Summary ==========
console.log(`\n${passed} tests passed, ${failed} tests failed`);
