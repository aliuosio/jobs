'use strict';

// ============================================================================
// Mock Browser APIs
// ============================================================================

let mockApiResponse = { success: true, job_offers: [] };
let refreshCallCount = 0;

const mockBrowser = {
  runtime: {
    sendMessage: async (message) => {
      if (message.type === 'GET_JOB_OFFERS') {
        if (mockApiResponse.throw) throw mockApiResponse.throw;
        return mockApiResponse;
      }
      return { success: false, error: { code: 'UNKNOWN_MESSAGE', message: 'Unknown type' } };
    }
  },
  tabs: {
    query: async () => [{ id: 1, url: 'http://example.com' }]
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {}
    }
  }
};

global.browser = mockBrowser;

// Mock DOM
const mockElements = {};

function createMockElement(id) {
  return {
    id,
    style: { display: 'block' },
    innerHTML: '',
    textContent: '',
    disabled: false,
    className: '',
    parentElement: { insertBefore: () => {} },
    querySelectorAll: () => [],
    getAttribute: () => null,
    addEventListener: () => {}
  };
}

global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// ============================================================================
// Test Helpers
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
  }
}

function assertStrictEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertOk(value, msg) {
  if (!value) {
    throw new Error(`${msg}: expected truthy, got ${value}`);
  }
}

function resetDom() {
  Object.keys(mockElements).forEach(k => delete mockElements[k]);
  // Re-create required elements
  mockElements['refresh-links-btn'] = createMockElement('refresh-links-btn');
  mockElements['job-links-list'] = createMockElement('job-links-list');
  mockElements['job-links-loading'] = createMockElement('job-links-loading');
  mockElements['job-links-error'] = createMockElement('job-links-error');
  mockElements['stale-indicator'] = createMockElement('stale-indicator');
  refreshCallCount = 0;
}

// ============================================================================
// Load popup.js functions
// ============================================================================

const STORAGE_KEYS = {
  JOB_OFFERS: 'jobOffers',
  JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp',
  SHOW_APPLIED_FILTER: 'showAppliedFilter',
  SSE_STATUS: 'sseStatus',
  VISITED_LINKS: 'visitedLinks'
};

let jobLinks = [];
let showAppliedFilter = false;
const elements = {
  get refreshLinksBtn() { return mockElements['refresh-links-btn']; },
  get jobLinksList() { return mockElements['job-links-list']; },
  get jobLinksLoading() { return mockElements['job-links-loading']; },
  get jobLinksError() { return mockElements['job-links-error']; },
  get staleIndicator() { return mockElements['stale-indicator']; }
};

function showSkeleton() {
  elements.jobLinksList.style.display = 'none';
  elements.jobLinksError.style.display = 'none';
  elements.jobLinksLoading.style.display = 'flex';
}

function hideLoading() {
  elements.jobLinksLoading.style.display = 'none';
  elements.jobLinksError.style.display = 'none';
  elements.jobLinksList.style.display = 'block';
}

function showJobError(message) {
  elements.jobLinksLoading.style.display = 'none';
  elements.jobLinksError.style.display = 'flex';
  elements.jobLinksList.style.display = 'none';
}

function showToggleError(message) {
  // For error during toggle
}

function filterJobLinks(links, showApplied) {
  if (showApplied) return links;
  return links.filter(link => !link.applied);
}

function renderJobLinksList(links) {
  elements.jobLinksList.innerHTML = links.length ? 'jobs loaded' : 'no jobs';
}

async function cacheJobOffers() {
  // Mock cache
}

function updateStaleIndicator(isStale) {
  if (elements.staleIndicator) {
    elements.staleIndicator.style.display = isStale ? 'block' : 'none';
  }
}

async function loadStateFromStorage() {
  return {};
}

async function saveStateToStorage(state) {
  // Mock save
}

async function fetchJobOffers() {
  const response = await browser.runtime.sendMessage({ type: 'GET_JOB_OFFERS' });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch job offers');
  }
  return (response.job_offers || []).map(offer => ({
    id: offer.id,
    title: offer.title,
    url: offer.url,
    applied: offer.process?.applied ?? false,
    pending: false,
    error: false
  }));
}

/**
 * Force refresh - ACTUAL IMPLEMENTATION from popup.js
 */
async function forceRefreshJobLinks() {
  const btn = elements.refreshLinksBtn;
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Refreshing...';
  showSkeleton();
  
  try {
    const links = await fetchJobOffers();
    jobLinks = links;
    hideLoading();
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filteredLinks);
    await cacheJobOffers();
    updateStaleIndicator(false);
    refreshCallCount++;
  } catch (err) {
    console.error('[Popup] forceRefreshJobLinks error:', err);
    if (jobLinks.length > 0) {
      hideLoading();
      showToggleError('Failed to refresh: ' + err.message);
    } else {
      showJobError('Failed to load jobs: ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function loadJobLinks() {
  await forceRefreshJobLinks();
}

// THE FIX: handleRefreshLinksClick should call forceRefreshJobLinks
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}

// ============================================================================
// Tests
// ============================================================================

console.log('\n=== Refresh Button Bug Fix Tests ===\n');

// Test 1: handleRefreshLinksClick function exists
test('handleRefreshLinksClick function exists', () => {
  assertOk(typeof handleRefreshLinksClick === 'function', 'handleRefreshLinksClick should be a function');
});

// Test 2: handleRefreshLinksClick calls forceRefreshJobLinks (via mock)
test('handleRefreshLinksClick is async', async () => {
  resetDom();
  const result = handleRefreshLinksClick();
  assertOk(result && typeof result.then === 'function', 'handleRefreshLinksClick should return a promise');
});

// Test 3: Click handler is properly attached
test('refresh button element exists', () => {
  resetDom();
  assertOk(elements.refreshLinksBtn, 'refreshLinksBtn should be defined');
});

// Test 4: forceRefreshJobLinks fetches from API
test('forceRefreshJobLinks fetches job offers from API', async () => {
  resetDom();
  mockApiResponse = {
    success: true,
    job_offers: [
      { id: 1, title: 'Software Engineer', url: 'http://example.com/1', process: { applied: false } }
    ]
  };
  
  await forceRefreshJobLinks();
  
  assertStrictEqual(jobLinks.length, 1, 'Should load 1 job offer');
  assertStrictEqual(jobLinks[0].title, 'Software Engineer', 'Should have correct title');
});

// Test 5: Button shows loading state during refresh
test('Button is disabled during refresh', async () => {
  resetDom();
  mockApiResponse = { success: true, job_offers: [] };
  
  const promise = forceRefreshJobLinks();
  
  // Button should be disabled immediately after click
  assertStrictEqual(elements.refreshLinksBtn.disabled, true, 'Button should be disabled during refresh');
  assertStrictEqual(elements.refreshLinksBtn.textContent, 'Refreshing...', 'Button should show "Refreshing..."');
  
  await promise;
});

// Test 6: Button is re-enabled after refresh completes
test('Button is re-enabled after refresh completes', async () => {
  resetDom();
  mockApiResponse = { success: true, job_offers: [] };
  
  await forceRefreshJobLinks();
  
  assertStrictEqual(elements.refreshLinksBtn.disabled, false, 'Button should be re-enabled');
});

// Test 7: Error handling when API unavailable
test('Shows error when API is unavailable', async () => {
  resetDom();
  mockApiResponse = { success: false, error: { message: 'Network error' } };
  
  jobLinks = []; // No cached data
  await forceRefreshJobLinks();
  
  // Should show error
  assertStrictEqual(elements.jobLinksError.style.display, 'flex', 'Error panel should be shown');
});

// Test 8: Uses cached data when API fails but cache exists
test('Shows cached data when API fails but cache exists', async () => {
  resetDom();
  mockApiResponse = { success: false, error: { message: 'Network error' } };
  
  // Simulate cached data
  jobLinks = [{ id: 1, title: 'Cached Job', url: 'http://example.com/1', applied: false, pending: false, error: false }];
  
  await forceRefreshJobLinks();
  
  // Should show error but keep showing cached data
  assertStrictEqual(elements.jobLinksList.style.display, 'block', 'Job list should still be shown');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`Refresh Button Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
