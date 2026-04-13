/**
 * Unit tests for maxlength handling
 * Run with: node extension/tests/maxlength.test.js
 */

'use strict';

const assert = require('assert');

const mockComputedStyles = new WeakMap();
global.window = {
  getComputedStyle: (el) => mockComputedStyles.get(el) || { display: '', visibility: 'visible' },
  HTMLTextAreaElement: { prototype: Object.create({}, { value: { set: () => {} } }) },
  HTMLInputElement: { prototype: Object.create({}, { value: { set: () => {} } }) }
};

// Mock document object
global.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    getAttribute: () => null,
    querySelector: () => null,
    appendChild: () => {},
    insertAdjacentElement: () => null,
    style: {}
  })
};

const scanner = require('../content/form-scanner.js');
global.scanForm = scanner.scanForm;
global.scanPage = scanner.scanPage;
global.isElementFillable = scanner.isElementFillable;
global.getFieldType = scanner.getFieldType;
global.getFieldType = (el) => {
  const tag = el.tagName?.toLowerCase() || '';
  if (tag === 'textarea') return 'textarea';
  if (tag === 'select') return 'select';
  if (el.isContentEditable) return 'contenteditable';
  return el.type?.toLowerCase() || 'text';
};

const { fillField } = require('../content/field-filler.js');

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

function createMockElement(overrides = {}) {
  const element = {
    tagName: 'INPUT',
    type: 'text',
    value: '',
    maxLength: -1,
    readOnly: false,
    disabled: false,
    focus: () => {},
    dispatchEvent: () => {},
    classList: { 
      add: () => {}, 
      remove: () => {}, 
      contains: () => false, 
      toggle: () => {} 
    },
    _valueTracker: { setValue: () => {} },
    getAttribute: () => null,
    style: { display: '', visibility: '' },
    ...overrides
  };
  mockComputedStyles.set(element, { display: '', visibility: 'visible' });
  return element;
}

// ========== maxlength handling tests ==========

test('fillField: no truncation when maxlength is -1', () => {
  const element = createMockElement({ maxLength: -1 });
  const result = fillField(element, 'This is 14 chars');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, false);
  assert.strictEqual(result.filledLength, 16);
});

test('fillField: no truncation when maxlength is undefined', () => {
  const element = createMockElement();
  const result = fillField(element, 'This is 14 chars');
  
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, false);
  assert.strictEqual(result.filledLength, 16);
});

test('fillField: truncation occurs when maxlength is 5', () => {
  const element = createMockElement({ maxLength: 5 });
  const result = fillField(element, 'This is 14 chars', { maxlength: 5 });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, true);
  assert.strictEqual(result.filledLength, 5);
});

test('fillField: no truncation when maxlength is 0', () => {
  const element = createMockElement({ maxLength: 0 });
  const result = fillField(element, 'This is 14 chars', { maxlength: 0 });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, false);
  assert.strictEqual(result.filledLength, 16);
});

test('fillField: rejects non-fillable element (password)', () => {
  const element = createMockElement({ type: 'password' });
  const result = fillField(element, 'secret');
  
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Field is not fillable');
});

test('fillField: rejects disabled element', () => {
  const element = createMockElement({ disabled: true });
  const result = fillField(element, 'value');
  
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Field is not fillable');
});

test('fillField: rejects readonly element', () => {
  const element = createMockElement({ readOnly: true });
  const result = fillField(element, 'value');
  
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Field is not fillable');
});

test('fillField: returns error for null element', () => {
  const result = fillField(null, 'value');
  
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Element not found');
});

test('fillField: handles textarea with maxlength', () => {
  const element = createMockElement({ tagName: 'TEXTAREA', maxLength: 10 });
  const result = fillField(element, 'This is longer than 10 chars', { maxlength: 10 });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.truncated, true);
  assert.strictEqual(result.filledLength, 10);
});

// ========== Summary ==========
console.log(`\n${passed} tests passed, ${failed} tests failed`);
if (failed > 0) {
  process.exit(1);
}
