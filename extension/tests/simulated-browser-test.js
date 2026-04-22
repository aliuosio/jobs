/**
 * Simulated Browser Test for Signal Extraction
 * Runs signal extraction tests without a browser by simulating DOM elements
 * 
 * Run with: node extension/tests/simulated-browser-test.js
 */

const assert = require('assert');

// Mock DOM elements
class MockElement {
  constructor(tagName, attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.textContent = attrs.textContent || '';
    this.name = attrs.name || null;
    this.id = attrs.id || null;
    this.type = attrs.type || null;
    this.parentElement = attrs.parentElement || null;
  }
  
  getAttribute(name) {
    return this.attributes[name] || null;
  }
  
  querySelector(selector) {
    return null;
  }
  
  closest(selector) {
    return null;
  }
  
  contains(element) {
    return false;
  }
}

global.document = {
  getElementById: (id) => null,
  querySelector: (selector) => null
};

// Load signal extractor functions
const {
  sanitizeSignalText,
  extractAutocomplete,
  extractAriaLabel,
  extractPlaceholder,
  buildFieldSignals,
  signalsToPayload,
  countSignals
} = require('../content/signal-extractor.js');

// Mock getFieldType since it uses document
global.getFieldType = function(element) {
  if (!element) return 'unknown';
  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';
  if (tagName === 'input') return element.type?.toLowerCase() || 'text';
  return 'unknown';
};

// Test counter
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

console.log('=== Simulated Browser Tests ===\n');

// ============================================================================
// T14: Indeed/Sample Form Tests
// ============================================================================

console.log('--- T14: Indeed/Sample Form Tests ---\n');

test('Email field with autocomplete="email"', () => {
  const el = new MockElement('input', {
    type: 'email',
    name: 'user_email',
    id: 'email',
    autocomplete: 'email',
    placeholder: 'you@example.com',
    'aria-describedby': 'email-hint'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Email Address',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'email', 'Expected autocomplete="email"');
  assert.strictEqual(signals.placeholder, 'you@example.com', 'Expected placeholder');
  assert.strictEqual(signals.name, 'user_email', 'Expected name');
  assert.strictEqual(signals.id, 'email', 'Expected id');
  assert.strictEqual(signals.htmlType, 'email', 'Expected htmlType="email"');
  assert.ok(countSignals(signals) >= 4, 'Expected at least 4 signals');
});

test('Phone field with autocomplete="tel"', () => {
  const el = new MockElement('input', {
    type: 'tel',
    name: 'phone_number',
    id: 'phone',
    autocomplete: 'tel',
    placeholder: '+1 555-123-4567'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Phone Number',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'tel', 'Expected autocomplete="tel"');
  assert.strictEqual(signals.htmlType, 'tel', 'Expected htmlType="tel"');
});

test('First name with autocomplete="given-name"', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'first_name',
    id: 'fname',
    autocomplete: 'given-name',
    placeholder: 'John'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'First Name',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'given-name', 'Expected autocomplete="given-name"');
});

test('Last name with autocomplete="family-name"', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'last_name',
    id: 'lname',
    autocomplete: 'family-name',
    placeholder: 'Doe'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Last Name',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'family-name', 'Expected autocomplete="family-name"');
});

test('LinkedIn URL with aria-label', () => {
  const el = new MockElement('input', {
    type: 'url',
    name: 'linkedin_url',
    id: 'linkedin',
    'aria-label': 'LinkedIn Profile URL',
    placeholder: 'https://linkedin.com/in/username'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'LinkedIn Profile',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.ariaLabel, 'LinkedIn Profile URL', 'Expected aria-label');
  assert.strictEqual(signals.htmlType, 'url', 'Expected htmlType="url"');
});

test('Company with autocomplete="organization"', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'company_name',
    id: 'company',
    autocomplete: 'organization',
    placeholder: 'Acme Inc.'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Current Company',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'organization', 'Expected autocomplete="organization"');
});

test('Job title with autocomplete="organization-title"', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'job_title',
    id: 'title',
    autocomplete: 'organization-title',
    placeholder: 'Software Engineer'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Job Title',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'organization-title', 'Expected autocomplete="organization-title"');
});

// ============================================================================
// T15: LinkedIn Form Tests (Simulated)
// ============================================================================

console.log('\n--- T15: LinkedIn Form Tests (Simulated) ---\n');

test('LinkedIn email field pattern', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'email',
    id: 'email-address',
    autocomplete: 'email',
    'aria-label': 'Email'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Email',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'email', 'Expected autocomplete="email"');
  assert.strictEqual(signals.ariaLabel, 'Email', 'Expected aria-label');
});

test('LinkedIn phone field pattern', () => {
  const el = new MockElement('input', {
    type: 'tel',
    name: 'phoneNumber',
    autocomplete: 'tel',
    'aria-label': 'Mobile phone number'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Phone',
    confidence: 'medium',
    source: 'proximity'
  });
  
  assert.strictEqual(signals.autocomplete, 'tel', 'Expected autocomplete="tel"');
  assert.strictEqual(signals.htmlType, 'tel', 'Expected htmlType="tel"');
});

// ============================================================================
// T16: Other Job Boards Tests (Simulated)
// ============================================================================

console.log('\n--- T16: Other Job Boards Tests (Simulated) ---\n');

test('Greenhouse name field pattern', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'candidate[name]',
    id: 'candidate_name',
    autocomplete: 'name',
    placeholder: 'Full Name'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Name',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'name', 'Expected autocomplete="name"');
  assert.ok(signals.name.includes('name'), 'Name attribute should contain "name"');
});

test('Lever email field pattern', () => {
  const el = new MockElement('input', {
    type: 'email',
    name: 'email',
    id: 'email',
    autocomplete: 'email',
    placeholder: 'your@email.com'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'Email address',
    confidence: 'high',
    source: 'for-id'
  });
  
  assert.strictEqual(signals.autocomplete, 'email', 'Expected autocomplete="email"');
  assert.strictEqual(signals.htmlType, 'email', 'Expected htmlType="email"');
});

test('Workday complex name pattern', () => {
  const el = new MockElement('input', {
    type: 'text',
    name: 'wd-PrimaryInformation-First Name',
    id: 'input-123',
    autocomplete: 'given-name'
  });
  
  const signals = buildFieldSignals(el, {
    text: 'First Name',
    confidence: 'high',
    source: 'aria-labelledby'
  });
  
  assert.strictEqual(signals.autocomplete, 'given-name', 'Expected autocomplete="given-name"');
});

// ============================================================================
// Coverage Summary
// ============================================================================

console.log('\n--- Signal Coverage Summary ---\n');

const testFields = [
  { type: 'email', autocomplete: 'email', label: 'Email' },
  { type: 'tel', autocomplete: 'tel', label: 'Phone' },
  { type: 'text', autocomplete: 'given-name', label: 'First Name' },
  { type: 'text', autocomplete: 'family-name', label: 'Last Name' },
  { type: 'text', autocomplete: 'name', label: 'Full Name' },
  { type: 'url', autocomplete: 'url', label: 'Website' },
  { type: 'text', autocomplete: 'organization', label: 'Company' },
  { type: 'text', autocomplete: 'organization-title', label: 'Job Title' }
];

let fieldsWith2PlusSignals = 0;
testFields.forEach((config, i) => {
  const el = new MockElement('input', {
    type: config.type,
    name: config.label.toLowerCase().replace(' ', '_'),
    autocomplete: config.autocomplete,
    placeholder: config.label
  });
  
  const signals = buildFieldSignals(el, {
    text: config.label,
    confidence: 'high',
    source: 'for-id'
  });
  
  const count = countSignals(signals);
  if (count >= 2) fieldsWith2PlusSignals++;
});

const coverage = (fieldsWith2PlusSignals / testFields.length) * 100;
console.log(`Fields with ≥2 signals: ${fieldsWith2PlusSignals}/${testFields.length} (${coverage.toFixed(1)}%)`);

if (coverage >= 95) {
  console.log('✓ SC-003 PASSED: ≥95% of fields have ≥2 signals');
  passed++;
} else {
  console.log('✗ SC-003 FAILED: <95% of fields have ≥2 signals');
  failed++;
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log(`Simulated Browser Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
