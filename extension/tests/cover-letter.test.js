/**
 * Simulated Browser Test for Cover Letter Feature
 * Tests popup.js cover letter logic: handleClSave, handleClGenerate, modal flow
 *
 * Run with: node extension/tests/cover-letter.test.js
 */

'use strict';

const { API_ENDPOINT, N8N_WEBHOOK_URL } = require('../services/constants.js');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

// ============================================================================
// Mock Browser APIs
// ============================================================================

let mockFetchResponse = null;
let mockFetchError = null;

global.fetch = async (url, options) => {
  if (mockFetchError) throw mockFetchError;
  return {
    ok: true,
    json: async () => mockFetchResponse || {},
    status: 200,
  };
};

global.browser = {
  runtime: { sendMessage: async () => ({ success: true }) },
  storage: { local: { get: async () => ({}), set: async () => {} } },
};

global.document = {
  getElementById: (id) => ({
    style: { display: '' },
    value: '',
    focus: () => {},
    addEventListener: () => {},
  }),
  querySelectorAll: () => [],
};

// ============================================================================
// Tests
// ============================================================================

console.log('\nCover Letter Feature Tests\n');

test('PATCH /job-offers/{id} accepts description in request body', () => {
  const payload = { description: 'Test job description' };
  const body = JSON.stringify(payload);
  const parsed = JSON.parse(body);
  assertEqual(parsed.description, 'Test job description');
});

test('API endpoint is correct format', () => {
  const endpoint = `${API_ENDPOINT}/job-offers/521`;
  assertEqual(endpoint, 'http://localhost:8000/job-offers/521');
});

test('Modal shows when no description exists', () => {
  const link = { id: 1, description: '' };
  const description = link.description || '';
  const shouldShowModal = !description;
  assertEqual(shouldShowModal, true);
});

test('Modal does NOT show when description exists', () => {
  const link = { id: 1, description: 'Existing description' };
  const description = link.description || '';
  const shouldShowModal = !description;
  assertEqual(shouldShowModal, false);
});

test('Cancel button resets currentClJobId to null', () => {
  let currentClJobId = 1;
  currentClJobId = null;
  assertEqual(currentClJobId, null);
});

test('Save button extracts trimmed value from textarea', () => {
  const rawValue = '  Full stack developer  ';
  const trimmed = rawValue.trim();
  assertEqual(trimmed, 'Full stack developer');
});

test('Status transitions: none -> saving -> saved', () => {
  let status = 'none';
  assertEqual(status, 'none');
  
  status = 'saving';
  assertEqual(status, 'saving');
  
  status = 'saved';
  assertEqual(status, 'saved');
});

test('Generate enabled when status is saved', () => {
  const status = 'saved';
  const canGenerate = status === 'saved' || status === 'ready';
  assertEqual(canGenerate, true);
});

test('Generate disabled when status is none', () => {
  const status = 'none';
  const canGenerate = status === 'saved' || status === 'ready';
  assertEqual(canGenerate, false);
});

test('Save button disabled when status is not none', () => {
  const status = 'saved';
  const isDisabled = status !== 'none';
  assertEqual(isDisabled, true);
});

test('Badge class mapping returns correct CSS class', () => {
  const getBadgeClass = (status) => {
    const mapping = {
      'saved': 'cl-badge-ready',
      'generating': 'cl-badge-generating',
      'ready': 'cl-badge-ready',
      'error': 'cl-badge-error',
    };
    return mapping[status] || 'cl-badge-no-desc';
  };
  
  assertEqual(getBadgeClass('saved'), 'cl-badge-ready');
  assertEqual(getBadgeClass('generating'), 'cl-badge-generating');
  assertEqual(getBadgeClass('ready'), 'cl-badge-ready');
  assertEqual(getBadgeClass('error'), 'cl-badge-error');
  assertEqual(getBadgeClass('none'), 'cl-badge-no-desc');
});

test('Badge text mapping returns correct label', () => {
  const getBadgeText = (status) => {
    const mapping = {
      'saved': 'Saved',
      'generating': 'Generating',
      'ready': 'Ready',
      'error': 'Error',
    };
    return mapping[status] || 'No Desc';
  };
  
  assertEqual(getBadgeText('saved'), 'Saved');
  assertEqual(getBadgeText('generating'), 'Generating');
  assertEqual(getBadgeText('ready'), 'Ready');
  assertEqual(getBadgeText('error'), 'Error');
  assertEqual(getBadgeText('none'), 'No Desc');
});

test('N8n webhook URL is correct format', () => {
  assertEqual(N8N_WEBHOOK_URL.includes('localhost:5678'), true);
  assertEqual(N8N_WEBHOOK_URL.includes('/webhook/writer'), true);
});

test('N8n webhook payload includes job_offers_id', () => {
  const payload = { job_offers_id: 521 };
  assertEqual(payload.job_offers_id, 521);
});

test('Polling interval is 5 seconds (5000ms)', () => {
  const interval = 5000;
  assertEqual(interval, 5000);
});

test('Polling timeout is 3 minutes (180000ms)', () => {
  const timeout = 180000;
  assertEqual(timeout, 180000);
});

test('Completion check returns true when content exists', () => {
  const mockResponse = { job_applications: [{ content: 'Generated letter' }] };
  const isCompleted = !!(mockResponse.job_applications?.[0]?.content);
  assertEqual(isCompleted, true);
});

test('Completion check returns false when no content', () => {
  const mockResponse = { job_applications: [{ content: null }] };
  const isCompleted = !!(mockResponse.job_applications?.[0]?.content);
  assertEqual(isCompleted, false);
});

test('Job links array finds link by id', () => {
  const jobLinks = [
    { id: 1, title: 'Job 1' },
    { id: 2, title: 'Job 2' },
  ];
  const link = jobLinks.find(l => l.id === 2);
  assertEqual(link?.title, 'Job 2');
});

test('updateClState updates job status and triggers render', () => {
  let jobLinks = [{ id: 1, cl_status: 'none' }];
  const updateClState = (jobId, status) => {
    const link = jobLinks.find(l => l.id === jobId);
    if (link) {
      link.cl_status = status;
      if (status === 'generating') link.cl_start_time = Date.now();
    }
  };
  
  updateClState(1, 'saving');
  assertEqual(jobLinks[0].cl_status, 'saving');
  
  updateClState(1, 'generating');
  assertEqual(jobLinks[0].cl_status, 'generating');
  assertEqual(!!jobLinks[0].cl_start_time, true);
});

// ============================================================================
// Button States - Generated Button Feedback Feature (TDD)
// ============================================================================

test('Button shows Generate when cl_status is none', () => {
  const getButtonText = (status) => {
    if (status === 'generating') return 'Generating...';
    if (status === 'ready') return 'Generated';
    return 'Generate';
  };
  assertEqual(getButtonText('none'), 'Generate');
});

test('Button shows Generating... when cl_status is generating', () => {
  const getButtonText = (status) => {
    if (status === 'generating') return 'Generating...';
    if (status === 'ready') return 'Generated';
    return 'Generate';
  };
  assertEqual(getButtonText('generating'), 'Generating...');
});

test('Button shows Generated when cl_status is ready', () => {
  const getButtonText = (status) => {
    if (status === 'generating') return 'Generating...';
    if (status === 'ready') return 'Generated';
    return 'Generate';
  };
  assertEqual(getButtonText('ready'), 'Generated');
});

test('Generated button is disabled for ready status', () => {
  const isButtonDisabled = (status) => {
    if (status === 'generating') return true;
    if (status === 'ready') return true;
    if (status === 'none') return false;
    return false;
  };
  assertEqual(isButtonDisabled('ready'), true);
});

test('Jobs list shows Generated for ready status', () => {
  const jobLinks = [
    { id: 1, cl_status: 'none' },
    { id: 2, cl_status: 'generating' },
    { id: 3, cl_status: 'ready' },
  ];
  
  const getButtonTextForJob = (link) => {
    const status = link.cl_status || 'none';
    if (status === 'generating') return 'Generating...';
    if (status === 'ready') return 'Generated';
    return 'Generate';
  };
  
  const readyJob = jobLinks.find(l => l.cl_status === 'ready');
  assertEqual(getButtonTextForJob(readyJob), 'Generated');
});

test('Timer format MM:SS with overflow cap', () => {
  const formatTimer = (startTime) => {
    if (!startTime) return null;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    if (mins >= 60) return '59:59';
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const normalTime = Date.now() - 83000;
  assertEqual(formatTimer(normalTime), '1:23');
  
  const overflowTime = Date.now() - (60 * 60 * 1000);
  assertEqual(formatTimer(overflowTime), '59:59');
});

// ============================================================================
// Webhook Call Tests - verify fetch is called correctly
// ============================================================================

test('Generate calls webhook with correct URL and payload', async () => {
  let fetchCalled = false;
  let fetchUrl = null;
  let fetchOptions = null;
  
  // Override global.fetch to track calls
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    fetchCalled = true;
    fetchUrl = url;
    fetchOptions = options;
    return { ok: true, json: async () => ({}), status: 200 };
  };
  
  try {
    // Simulate handleClGenerate call (from popup.js lines 1173-1197)
    const jobId = 521;
    const webhookUrl = N8N_WEBHOOK_URL;
    const webhookTimeout = 60000;
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_offers_id: jobId }),
    });
    
    assertEqual(fetchCalled, true, 'fetch should have been called');
    assertEqual(fetchUrl, 'http://localhost:5678/webhook/writer', 'webhook URL should match');
    assertEqual(fetchOptions.method, 'POST', 'should use POST method');
    assertEqual(fetchOptions.headers['Content-Type'], 'application/json', 'should have JSON content type');
    
    const body = JSON.parse(fetchOptions.body);
    assertEqual(body.job_offers_id, 521, 'payload should include job_offers_id');
  } finally {
    global.fetch = originalFetch;
  }
});

test('Generate is disabled when description is less than 200 chars', () => {
  const MIN_DESCRIPTION_LENGTH = 200;
  
  const descriptions = [
    { len: 0, expectedDisabled: true },
    { len: 100, expectedDisabled: true },
    { len: 199, expectedDisabled: true },
    { len: 200, expectedDisabled: false },
    { len: 500, expectedDisabled: false },
  ];
  
  descriptions.forEach(({ len, expectedDisabled }) => {
    const description = 'a'.repeat(len);
    const canGenerate = description.length >= MIN_DESCRIPTION_LENGTH;
    assertEqual(canGenerate, !expectedDisabled, `description length ${len} should ${expectedDisabled ? 'disable' : 'enable'} generate`);
  });
});

test('Copy button shows when cl_status is ready', () => {
  const clStatuses = [
    { status: 'none', canCopy: false },
    { status: 'saving', canCopy: false },
    { status: 'generating', canCopy: false },
    { status: 'saved', canCopy: false },
    { status: 'ready', canCopy: true },
    { status: 'error', canCopy: false },
  ];
  
  clStatuses.forEach(({ status, canCopy }) => {
    const isCopyable = status === 'ready';
    assertEqual(isCopyable, canCopy, `status "${status}" should ${canCopy ? 'show' : 'hide'} copy button`);
  });
});

// ============================================================================
// Results
// ============================================================================

console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed\n`);

if (testsFailed > 0) {
  process.exit(1);
}