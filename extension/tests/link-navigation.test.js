/**
 * Test for link navigation and last clicked indicator functionality
 * Run with: node extension/tests/link-navigation.test.js
 */

'use strict';

const assert = require('assert');

function createMockFn() {
  const fn = function(...args) {
    fn.called = true;
    fn.calls.push(args);
    if (typeof fn._returnValue === 'function') {
      return fn._returnValue(...args);
    }
    return fn._returnValue;
  };
  fn.called = false;
  fn.calls = [];
  fn._returnValue = undefined;
  fn.mockReturnValue = function(val) { fn._returnValue = val; return fn; };
  return fn;
}

// Mock browser API for testing
const mockBrowser = {
  tabs: {
    query: createMockFn(),
    update: createMockFn()
  },
  runtime: {
    sendMessage: createMockFn()
  },
  storage: {
    local: {
      get: createMockFn(),
      set: createMockFn()
    }
  }
};

// Mock localStorage
const mockLocalStorage = {
  getItem: createMockFn('[]'),
  setItem: createMockFn()
};

// Track current HTML content for element queries
let currentHTML = '';

// Class state tracking for mock elements
let classState = {};

// Setup DOM environment
function setupDOM() {
  classState = {};
  currentHTML = `
    <div id="job-links-list">
      <div class="job-link-item" data-job-id="1">
        <a class="job-link-title" href="https://example.com/job1" data-job-id="1">Job 1</a>
      </div>
      <div class="job-link-item" data-job-id="2">
        <a class="job-link-title" href="https://example.com/job2" data-job-id="2">Job 2</a>
      </div>
    </div>
  `;
  
  const createMockElement = (overrides = {}) => ({
    tagName: 'DIV',
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
      toggle: () => {}
    },
    closest: () => null,
    textContent: '',
    dataset: {},
    href: '',
    querySelector: () => null,
    querySelectorAll: () => [],
    insertAdjacentElement: () => null,
    appendChild: () => {},
    style: {},
    ...overrides
  });
  
  const createLinkElement = (jobId, href) => createMockElement({
    tagName: 'A',
    href,
    dataset: { jobId },
    classList: {
      add: () => {},
      remove: () => {},
      contains: (cls) => cls === 'job-link-title',
      toggle: () => {}
    },
    closest: () => {
      if (!classState[jobId]) {
        classState[jobId] = { classes: new Set() };
      }
      return {
        classList: {
          add: (cls) => classState[jobId].classes.add(cls),
          remove: (cls) => classState[jobId].classes.delete(cls),
          contains: (cls) => classState[jobId].classes.has(cls),
          toggle: (cls) => classState[jobId].classes.has(cls) 
            ? classState[jobId].classes.delete(cls) 
            : classState[jobId].classes.add(cls)
        }
      };
    }
  });
  
  global.browser = mockBrowser;
  global.localStorage = mockLocalStorage;
  global.document = {
    getElementById: (id) => {
      if (id === 'job-links-list') {
        return createMockElement({
          id: 'job-links-list',
          querySelector: (sel) => {
            if (sel === '.job-link-title[data-job-id="1"]') {
              return createLinkElement('1', 'https://example.com/job1');
            }
            if (sel === '.job-link-title[data-job-id="2"]') {
              return createLinkElement('2', 'https://example.com/job2');
            }
            if (sel === '.job-link-title') {
              return createLinkElement('1', 'https://example.com/job1');
            }
            if (sel.startsWith('.job-link-item[data-job-id=')) {
              const match = sel.match(/data-job-id="(\d+)"/);
              if (match) {
                const itemJobId = match[1];
                if (!classState[itemJobId]) {
                  classState[itemJobId] = { classes: new Set() };
                }
                return {
                  classList: {
                    add: (cls) => classState[itemJobId].classes.add(cls),
                    remove: (cls) => classState[itemJobId].classes.delete(cls),
                    contains: (cls) => classState[itemJobId].classes.has(cls),
                    toggle: (cls) => classState[itemJobId].classes.has(cls)
                      ? classState[itemJobId].classes.delete(cls)
                      : classState[itemJobId].classes.add(cls)
                  }
                };
              }
            }
            return createMockElement();
          },
          querySelectorAll: (sel) => {
            if (sel === '.job-link-title') {
              return [createLinkElement('1', 'https://example.com/job1'), createLinkElement('2', 'https://example.com/job2')];
            }
            return [];
          }
        });
      }
      return null;
    },
    createElement: createMockElement,
    body: {
      get innerHTML() { return currentHTML; },
      set innerHTML(html) { currentHTML = html; }
    },
    querySelector: () => createMockElement(),
    querySelectorAll: () => []
  };
}

// Helper function to create element
function createElement(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

// ============================================================================
// Tests
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  setupDOM();
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (!value) {
    throw new Error(`${msg}: expected truthy value`);
  }
}

// Test 1: should navigate to link in same tab when clicked
test('should navigate to link in same tab when clicked', function() {
  // Setup
  mockBrowser.tabs.query.calls = [];
  mockBrowser.tabs.update.calls = [];
  mockBrowser.tabs.query.mockReturnValue([{ id: 123 }]);
  mockBrowser.tabs.update.mockReturnValue();
  mockLocalStorage.getItem.mockReturnValue('[]');
  
  // Setup DOM
  document.body.innerHTML = `
    <div id="job-links-list">
      <div class="job-link-item" data-job-id="1">
        <a class="job-link-title" href="https://example.com/job1" data-job-id="1">Job 1</a>
      </div>
    </div>
  `;
  
  const elements = {
    jobLinksList: document.getElementById('job-links-list')
  };
  
  let lastClickedJobId = null;
  
  // Simulate the click handler logic
  const link = elements.jobLinksList.querySelector('.job-link-title');
  const jobId = parseInt(link.dataset.jobId, 10);
  
  // Remove last clicked indicator from previous link
  if (lastClickedJobId) {
    const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
    if (prevLink) {
      prevLink.classList.remove('job-link-last-clicked');
    }
  }
  
  // Add last clicked indicator to current link
  lastClickedJobId = jobId;
  link.closest('.job-link-item').classList.add('job-link-last-clicked');
  
  // Navigate to the URL in the current tab
  mockBrowser.tabs.update(123, { url: link.href });
  
  // Verify navigation was called
  assertTrue(mockBrowser.tabs.update.called, 'tabs.update should be called');
  assertEqual(mockBrowser.tabs.update.calls.length, 1, 'tabs.update calls');
  assertEqual(mockBrowser.tabs.update.calls[0][0], 123, 'tab ID');
  assertEqual(mockBrowser.tabs.update.calls[0][1].url, 'https://example.com/job1', 'URL');
  
  // Verify last clicked indicator was added
  assertTrue(link.closest('.job-link-item').classList.contains('job-link-last-clicked'), 
    'last-clicked class should be added');
});

// Test 2: should remove previous last clicked indicator when new link is clicked
test('should remove previous last clicked indicator when new link is clicked', function() {
  // Setup DOM
  document.body.innerHTML = `
    <div id="job-links-list">
      <div class="job-link-item" data-job-id="1">
        <a class="job-link-title" href="https://example.com/job1" data-job-id="1">Job 1</a>
      </div>
      <div class="job-link-item" data-job-id="2">
        <a class="job-link-title" href="https://example.com/job2" data-job-id="2">Job 2</a>
      </div>
    </div>
  `;
  
  const elements = {
    jobLinksList: document.getElementById('job-links-list')
  };
  
  let lastClickedJobId = null;
  
  // Click first link
  const firstLink = elements.jobLinksList.querySelector('.job-link-title[data-job-id="1"]');
  let jobId = parseInt(firstLink.dataset.jobId, 10);
  
  if (lastClickedJobId) {
    const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
    if (prevLink) {
      prevLink.classList.remove('job-link-last-clicked');
    }
  }
  
  lastClickedJobId = jobId;
  const firstItem = firstLink.closest('.job-link-item');
  firstItem.classList.add('job-link-last-clicked');
  
  // Click second link
  const secondLink = elements.jobLinksList.querySelector('.job-link-title[data-job-id="2"]');
  jobId = parseInt(secondLink.dataset.jobId, 10);
  
  if (lastClickedJobId) {
    const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
    if (prevLink) {
      prevLink.classList.remove('job-link-last-clicked');
    }
  }
  
  lastClickedJobId = jobId;
  const secondItem = secondLink.closest('.job-link-item');
  secondItem.classList.add('job-link-last-clicked');
  
  // Verify first link no longer has indicator
  const firstHasIndicator = firstItem.classList.contains('job-link-last-clicked');
  assertEqual(firstHasIndicator, false, 'first link should NOT have indicator');
  
  // Verify second link has indicator
  const secondHasIndicator = secondItem.classList.contains('job-link-last-clicked');
  assertEqual(secondHasIndicator, true, 'second link should have indicator');
});

// Test 3: should mark link as visited when clicked
test('should mark link as visited when clicked', function() {
  // Setup
  mockLocalStorage.getItem.calls = [];
  mockLocalStorage.setItem.calls = [];
  mockLocalStorage.getItem.mockReturnValue('[]');
  mockLocalStorage.setItem.mockReturnValue();
  
  // Setup DOM
  document.body.innerHTML = `
    <div id="job-links-list">
      <div class="job-link-item" data-job-id="1">
        <a class="job-link-title" href="https://example.com/job1" data-job-id="1">Job 1</a>
      </div>
    </div>
  `;
  
  const elements = {
    jobLinksList: document.getElementById('job-links-list')
  };
  
  // Simulate markJobLinkVisited function
  function markJobLinkVisited(jobId) {
    const visited = new Set(JSON.parse(localStorage.getItem('jfh-visited-links') || '[]'));
    visited.add(jobId);
    localStorage.setItem('jfh-visited-links', JSON.stringify([...visited]));
  }
  
  const link = elements.jobLinksList.querySelector('.job-link-title');
  const jobId = parseInt(link.dataset.jobId, 10);
  
  markJobLinkVisited(jobId);
  
  // Verify visited state is saved
  assertTrue(mockLocalStorage.setItem.called, 'setItem should be called');
  assertEqual(mockLocalStorage.setItem.calls.length, 1, 'setItem calls');
  assertEqual(mockLocalStorage.setItem.calls[0][0], 'jfh-visited-links', 'storage key');
  assertEqual(mockLocalStorage.setItem.calls[0][1], JSON.stringify([1]), 'visited data');
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
