/**
 * Unit tests for signal-extractor.js
 * Run with: node extension/tests/signal-extractor.test.js
 */

const assert = require('assert');
const {
  sanitizeSignalText,
  extractAutocomplete,
  extractAriaLabel,
  extractPlaceholder,
  buildFieldSignals,
  signalsToPayload,
  countSignals
} = require('../content/signal-extractor.js');

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

// ========== sanitizeSignalText ==========

test('sanitizeSignalText: trims whitespace', () => {
  assert.strictEqual(sanitizeSignalText('  hello world  '), 'hello world');
});

test('sanitizeSignalText: normalizes internal whitespace', () => {
  assert.strictEqual(sanitizeSignalText('hello   world'), 'hello world');
});

test('sanitizeSignalText: truncates to max length', () => {
  const longText = 'a'.repeat(600);
  const result = sanitizeSignalText(longText, 500);
  assert.strictEqual(result.length, 500);
});

test('sanitizeSignalText: returns null for empty string', () => {
  assert.strictEqual(sanitizeSignalText(''), null);
});

test('sanitizeSignalText: returns null for whitespace only', () => {
  assert.strictEqual(sanitizeSignalText('   '), null);
});

test('sanitizeSignalText: returns null for null input', () => {
  assert.strictEqual(sanitizeSignalText(null), null);
});

test('sanitizeSignalText: returns null for undefined input', () => {
  assert.strictEqual(sanitizeSignalText(undefined), null);
});

// ========== extractAutocomplete ==========

test('extractAutocomplete: extracts autocomplete attribute', () => {
  const el = { getAttribute: (name) => name === 'autocomplete' ? 'email' : null };
  assert.strictEqual(extractAutocomplete(el), 'email');
});

test('extractAutocomplete: returns null for missing attribute', () => {
  const el = { getAttribute: () => null };
  assert.strictEqual(extractAutocomplete(el), null);
});

test('extractAutocomplete: returns null for null element', () => {
  assert.strictEqual(extractAutocomplete(null), null);
});

// ========== extractAriaLabel ==========

test('extractAriaLabel: extracts and sanitizes aria-label', () => {
  const el = { getAttribute: (name) => name === 'aria-label' ? '  Email Address  ' : null };
  assert.strictEqual(extractAriaLabel(el), 'Email Address');
});

test('extractAriaLabel: returns null for missing attribute', () => {
  const el = { getAttribute: () => null };
  assert.strictEqual(extractAriaLabel(el), null);
});

test('extractAriaLabel: returns null for null element', () => {
  assert.strictEqual(extractAriaLabel(null), null);
});

// ========== extractPlaceholder ==========

test('extractPlaceholder: extracts and sanitizes placeholder', () => {
  const el = { getAttribute: (name) => name === 'placeholder' ? '  john@example.com  ' : null };
  assert.strictEqual(extractPlaceholder(el), 'john@example.com');
});

test('extractPlaceholder: returns null for missing attribute', () => {
  const el = { getAttribute: () => null };
  assert.strictEqual(extractPlaceholder(el), null);
});

test('extractPlaceholder: returns null for null element', () => {
  assert.strictEqual(extractPlaceholder(null), null);
});

// ========== buildFieldSignals ==========

test('buildFieldSignals: returns complete signals object', () => {
  const el = {
    getAttribute: (name) => {
      if (name === 'autocomplete') return 'email';
      if (name === 'aria-label') return 'Email';
      if (name === 'placeholder') return 'you@example.com';
      if (name === 'aria-describedby') return null;
      return null;
    },
    name: 'user_email',
    id: 'email-field',
    tagName: 'INPUT',
    type: 'email',
    parentElement: null,
    closest: () => null
  };
  
  const labelData = {
    text: 'Email Address',
    confidence: 'high',
    source: 'for-id'
  };
  
  const signals = buildFieldSignals(el, labelData);
  
  assert.strictEqual(signals.autocomplete, 'email');
  assert.strictEqual(signals.ariaLabel, 'Email');
  assert.strictEqual(signals.placeholder, 'you@example.com');
  assert.strictEqual(signals.name, 'user_email');
  assert.strictEqual(signals.id, 'email-field');
  assert.strictEqual(signals.htmlType, 'email');
  assert.strictEqual(signals.label.text, 'Email Address');
  assert.strictEqual(signals.label.confidence, 'high');
  assert.strictEqual(signals.label.source, 'for-id');
});

test('buildFieldSignals: handles null element', () => {
  const signals = buildFieldSignals(null, null);
  
  assert.strictEqual(signals.label, null);
  assert.strictEqual(signals.autocomplete, null);
  assert.strictEqual(signals.htmlType, 'unknown');
});

test('buildFieldSignals: handles missing label data', () => {
  const el = {
    getAttribute: () => null,
    name: null,
    id: null,
    tagName: 'INPUT',
    type: 'text',
    parentElement: null,
    closest: () => null
  };
  
  const signals = buildFieldSignals(el, null);
  
  assert.strictEqual(signals.label, null);
  assert.strictEqual(signals.htmlType, 'text');
});

// ========== signalsToPayload ==========

test('signalsToPayload: converts to API format', () => {
  const signals = {
    label: {
      text: 'Email',
      title: 'Email tooltip',
      confidence: 'high',
      source: 'for-id'
    },
    autocomplete: 'email',
    ariaLabel: null,
    placeholder: 'you@example.com',
    name: 'email',
    id: 'email-field',
    hint: { text: 'Required field', source: 'sibling-hint' },
    htmlType: 'email'
  };
  
  const payload = signalsToPayload(signals);
  
  assert.strictEqual(payload.label_text, 'Email');
  assert.strictEqual(payload.label_title, 'Email tooltip');
  assert.strictEqual(payload.label_confidence, 'high');
  assert.strictEqual(payload.label_source, 'for-id');
  assert.strictEqual(payload.autocomplete, 'email');
  assert.strictEqual(payload.aria_label, null);
  assert.strictEqual(payload.placeholder, 'you@example.com');
  assert.strictEqual(payload.input_name, 'email');
  assert.strictEqual(payload.input_id, 'email-field');
  assert.strictEqual(payload.hint_text, 'Required field');
  assert.strictEqual(payload.hint_source, 'sibling-hint');
  assert.strictEqual(payload.html_type, 'email');
});

test('signalsToPayload: handles null signals', () => {
  assert.strictEqual(signalsToPayload(null), null);
});

// ========== countSignals ==========

test('countSignals: counts non-null signals', () => {
  const signals = {
    label: { text: 'Email' },
    autocomplete: 'email',
    ariaLabel: null,
    placeholder: 'you@example.com',
    name: 'email',
    id: 'email-field',
    hint: null
  };
  
  assert.strictEqual(countSignals(signals), 5);
});

test('countSignals: returns 0 for null signals', () => {
  assert.strictEqual(countSignals(null), 0);
});

// ========== Summary ==========
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
