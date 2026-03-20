/**
 * Unit Tests for FormObserver - Dynamic Field Detection
 * 
 * Run with: node extension/tests/form-observer.test.js
 * 
 * Tests for FR-001, FR-003, FR-005: Dynamic field detection with WeakSet deduplication
 */

const assert = require('assert');

// Mock DOM elements for testing
class MockNode {
  constructor(nodeType = 1) {
    this.nodeType = nodeType;
    this.tagName = null;
    this.childNodes = [];
  }
}

class MockElement {
  constructor(tagName, attrs = {}) {
    this.nodeType = 1; // Node.ELEMENT_NODE
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.textContent = attrs.textContent || '';
    this.name = attrs.name || null;
    this.id = attrs.id || null;
    this.type = attrs.type || null;
    this.parentElement = attrs.parentElement || null;
    this.childNodes = [];
    this._children = [];
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  querySelector(selector) {
    // Simple implementation for testing
    const tagMap = {
      'input': 'INPUT',
      'textarea': 'TEXTAREA',
      'select': 'SELECT',
      'form': 'FORM'
    };
    
    for (const child of this._children) {
      if (selector.toLowerCase() === child.tagName.toLowerCase()) {
        return child;
      }
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    const selectors = selector.split(',').map(s => s.trim().toLowerCase());
    
    for (const child of this._children) {
      for (const sel of selectors) {
        if (child.tagName.toLowerCase() === sel) {
          results.push(child);
        }
      }
    }
    return results;
  }

  closest(selector) {
    return null;
  }

  contains(element) {
    return false;
  }

  appendChild(child) {
    this._children.push(child);
    child.parentElement = this;
  }
}

// Mock Node constant
global.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
  DOCUMENT_POSITION_FOLLOWING: 4,
  DOCUMENT_POSITION_PRECEDING: 2
};

// Mock MutationRecord
class MockMutationRecord {
  constructor(addedNodes = []) {
    this.addedNodes = addedNodes;
    this.removedNodes = [];
    this.type = 'childList';
  }
}

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

// ============================================================================
// Load FormObserver (simulated)
// ============================================================================

/**
 * Simulated FormObserver for testing
 * This mimics the behavior we're implementing
 */
class SimulatedFormObserver {
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 300;
    this.maxWaitMs = options.maxWaitMs || 10000;
    this.maxFields = options.maxFields || 200;
    this.onFormDetected = options.onFormDetected || (() => {});
    this.onFieldDetected = options.onFieldDetected || (() => {}); // NEW
    
    this.observer = null;
    this.processedForms = new WeakSet();
    this.processedFields = new WeakSet(); // NEW
    this.pendingMutations = [];
    this.debounceTimer = null;
    this.scanStartTime = null;
    this.isScanning = false;
    this.detectedFieldCount = 0; // NEW: for limit tracking
  }

  processPendingMutations() {
    const formsToProcess = new Set();
    const fieldsToProcess = new Set(); // NEW
    
    // Find all new forms in pending mutations (existing logic)
    this.pendingMutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Existing form detection
          if (node.tagName === 'FORM') {
            formsToProcess.add(node);
          } else if (node.querySelector) {
            const forms = node.querySelectorAll('form');
            forms.forEach(form => formsToProcess.add(form));
          }
          
          // NEW: Field detection
          const fieldTagNames = ['INPUT', 'TEXTAREA', 'SELECT'];
          if (fieldTagNames.includes(node.tagName)) {
            fieldsToProcess.add(node);
          }
          
          // Check for fields inside added nodes
          if (node.querySelectorAll) {
            const fields = node.querySelectorAll('input, textarea, select');
            fields.forEach(field => fieldsToProcess.add(field));
          }
        }
      });
    });
    
    // Process new forms (existing)
    formsToProcess.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form);
        this.onFormDetected(form);
      }
    });
    
    // NEW: Process new fields
    fieldsToProcess.forEach(field => {
      // Check deduplication
      if (!this.processedFields.has(field) && !this.processedForms.has(field)) {
        // Check field limit
        if (this.detectedFieldCount >= this.maxFields) {
          console.warn(`[FormObserver] Maximum field limit (${this.maxFields}) reached`);
          return;
        }
        
        this.processedFields.add(field);
        this.detectedFieldCount++;
        
        // Create field descriptor (per clarification Q2)
        const fieldDescriptor = {
          id: `jfh-field-${Date.now()}-${Math.random()}`,
          element: field,
          type: field.type || field.tagName.toLowerCase(),
          labelText: null, // Would be populated by label detection
          selector: field.id ? `#${field.id}` : field.name || null,
          isFillable: true
        };
        
        this.onFieldDetected(field, fieldDescriptor);
      }
    });
    
    // Clear pending mutations
    this.pendingMutations = [];
    this.debounceTimer = null;
  }

  reset() {
    this.processedForms = new WeakSet();
    this.processedFields = new WeakSet();
    this.pendingMutations = [];
    this.detectedFieldCount = 0;
  }
}

console.log('=== FormObserver Unit Tests ===\n');

// ============================================================================
// T001: Direct Field Element Detection
// ============================================================================

console.log('--- T001: Direct Field Element Detection ---\n');

test('Detects input element added directly', () => {
  let detectedFields = [];
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedFields.push({ element: fieldElement, descriptor: fieldDescriptor });
    }
  });
  
  const input = new MockElement('input', { type: 'text', name: 'email' });
  const mutation = new MockMutationRecord([input]);
  
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedFields.length, 1, 'Should detect 1 field');
  assert.strictEqual(detectedFields[0].element.tagName, 'INPUT', 'Should be INPUT element');
  assert.ok(detectedFields[0].descriptor, 'Should provide field descriptor');
  assert.ok(detectedFields[0].descriptor.id, 'Descriptor should have id');
});

test('Detects textarea element added directly', () => {
  let detectedFields = [];
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedFields.push({ element: fieldElement, descriptor: fieldDescriptor });
    }
  });
  
  const textarea = new MockElement('textarea', { name: 'message' });
  const mutation = new MockMutationRecord([textarea]);
  
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedFields.length, 1, 'Should detect 1 textarea');
  assert.strictEqual(detectedFields[0].element.tagName, 'TEXTAREA', 'Should be TEXTAREA element');
});

test('Detects select element added directly', () => {
  let detectedFields = [];
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedFields.push({ element: fieldElement, descriptor: fieldDescriptor });
    }
  });
  
  const select = new MockElement('select', { name: 'country' });
  const mutation = new MockMutationRecord([select]);
  
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedFields.length, 1, 'Should detect 1 select');
  assert.strictEqual(detectedFields[0].element.tagName, 'SELECT', 'Should be SELECT element');
});

// ============================================================================
// T002: Field Detection from Container Element
// ============================================================================

console.log('\n--- T002: Field Detection from Container Element ---\n');

test('Detects input inside div container', () => {
  let detectedFields = [];
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedFields.push({ element: fieldElement, descriptor: fieldDescriptor });
    }
  });
  
  const input = new MockElement('input', { type: 'text', name: 'email' });
  const div = new MockElement('div');
  div._children.push(input);
  input.parentElement = div;
  
  const mutation = new MockMutationRecord([div]);
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedFields.length, 1, 'Should detect field inside container');
});

test('Detects multiple fields inside container', () => {
  let detectedFields = [];
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedFields.push({ element: fieldElement, descriptor: fieldDescriptor });
    }
  });
  
  const input1 = new MockElement('input', { type: 'text', name: 'first_name' });
  const input2 = new MockElement('input', { type: 'text', name: 'last_name' });
  const div = new MockElement('div');
  div._children.push(input1, input2);
  
  const mutation = new MockMutationRecord([div]);
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedFields.length, 2, 'Should detect 2 fields inside container');
});

// ============================================================================
// T003: onFieldDetected Callback Signature
// ============================================================================

console.log('\n--- T003: onFieldDetected Callback Signature ---\n');

test('Callback receives element and descriptor in separate args', () => {
  let receivedElement = null;
  let receivedDescriptor = null;
  
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      receivedElement = fieldElement;
      receivedDescriptor = fieldDescriptor;
    }
  });
  
  const input = new MockElement('input', { type: 'email', name: 'user_email', id: 'email' });
  const mutation = new MockMutationRecord([input]);
  
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.ok(receivedElement, 'Should receive element');
  assert.ok(receivedDescriptor, 'Should receive descriptor');
  assert.strictEqual(typeof receivedElement.tagName, 'string', 'Element should have tagName');
  assert.strictEqual(typeof receivedDescriptor.id, 'string', 'Descriptor should have id');
  assert.strictEqual(typeof receivedDescriptor.type, 'string', 'Descriptor should have type');
  assert.strictEqual(receivedDescriptor.element, receivedElement, 'Descriptor.element should reference element');
});

// ============================================================================
// T012: Duplicate Field Prevention (WeakSet deduplication)
// ============================================================================

console.log('\n--- T012: Duplicate Field Prevention ---\n');

test('Same field not detected twice', () => {
  let detectedCount = 0;
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedCount++;
    }
  });
  
  const input = new MockElement('input', { type: 'text', name: 'email' });
  
  // Add same field twice
  const mutation1 = new MockMutationRecord([input]);
  const mutation2 = new MockMutationRecord([input]);
  
  observer.pendingMutations.push(mutation1);
  observer.processPendingMutations();
  
  observer.pendingMutations.push(mutation2);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedCount, 1, 'Should only detect same field once');
});

test('Different fields detected separately', () => {
  let detectedFields = [];
  const observer = new SimulatedFormObserver({
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedFields.push(fieldElement);
    }
  });
  
  const input1 = new MockElement('input', { type: 'text', name: 'email' });
  const input2 = new MockElement('input', { type: 'text', name: 'name' });
  
  const mutation = new MockMutationRecord([input1, input2]);
  observer.pendingMutations.push(mutation);
  observer.processPendingMutations();
  
  assert.strictEqual(detectedFields.length, 2, 'Should detect 2 different fields');
});

// ============================================================================
// T013: Field Limit Enforcement (200 fields)
// ============================================================================

console.log('\n--- T013: Field Limit Enforcement ---\n');

test('Warns when 200-field limit reached', () => {
  let detectedCount = 0;
  const observer = new SimulatedFormObserver({
    maxFields: 3, // Use small limit for testing
    onFieldDetected: (fieldElement, fieldDescriptor) => {
      detectedCount++;
    }
  });
  
  // Add 5 fields with limit of 3
  for (let i = 0; i < 5; i++) {
    const input = new MockElement('input', { type: 'text', name: `field_${i}` });
    const mutation = new MockMutationRecord([input]);
    observer.pendingMutations.push(mutation);
    observer.processPendingMutations();
  }
  
  assert.strictEqual(detectedCount, 3, 'Should only detect up to limit');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log(`FormObserver Unit Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
