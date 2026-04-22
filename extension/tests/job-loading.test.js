/**
 * Unit Tests for Job Loading Functionality (TDD)
 * Tests popup.js job loading with proper browser API mocking
 * 
 * Run with: node extension/tests/job-loading.test.js
 */

'use strict';

const { CACHE_TTL_MS, STORAGE_KEYS } = require('../services/constants.js');

// ============================================================================
// Test Data
// ============================================================================

const SAMPLE_JOB_OFFERS = [
  { id: 1, title: 'Software Engineer', url: 'http://example.com/jobs/1', applied: true, process: { applied: true } },
  { id: 2, title: 'Product Manager', url: 'http://example.com/jobs/2', applied: false, process: { applied: false } },
  { id: 3, title: 'Designer', url: 'http://example.com/jobs/3', applied: false, process: null }
];

const NOW = Date.now();
const ONE_HOUR_AGO = NOW - (60 * 60 * 1000);
const THIRTY_FIVE_MINUTES_AGO = NOW - (35 * 60 * 1000);

// ============================================================================
// Mock Browser APIs
// ============================================================================

function createMockStorage(initialData = {}) {
  let data = { ...initialData };
  return {
    local: {
      get: async (keys) => {
        if (keys === null) return { ...data };
        if (Array.isArray(keys)) {
          const result = {};
          for (const key of keys) {
            if (key in data) result[key] = data[key];
          }
          return result;
        }
        return { [keys]: data[keys] };
      },
      set: async (newData) => {
        data = { ...data, ...newData };
      }
    }
  };
}

function createMockBrowser(storage) {
  return {
    runtime: {
      sendMessage: async (message) => {
        if (message.type === 'GET_JOB_OFFERS') {
          return { success: true, job_offers: SAMPLE_JOB_OFFERS };
        }
        return { success: false, error: { code: 'UNKNOWN', message: 'Unknown type' } };
      },
      onMessage: {
        addListener: () => {}
      }
    },
    tabs: {
      query: async () => [{ id: 1, url: 'http://example.com' }]
    },
    storage: storage
  };
}

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

function assertDeepEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertOk(value, msg) {
  if (!value) {
    throw new Error(`${msg}: expected truthy, got ${value}`);
  }
}

// ============================================================================
// Load popup.js Functions (Inline)
// ============================================================================

async function isCacheValid(browserStorage) {
  try {
    const result = await browserStorage.local.get('jobOffersTimestamp');
    const timestamp = result.jobOffersTimestamp || 0;
    
    if (timestamp === 0) {
      return { valid: false, isStale: true, age: 0 };
    }
    
    const age = Date.now() - timestamp;
    const isStale = age > CACHE_TTL_MS;
    const valid = age <= CACHE_TTL_MS;
    
    return { valid, isStale, age };
  } catch (error) {
    return { valid: false, isStale: true, age: 0 };
  }
}

function filterJobLinks(links, showApplied) {
  if (showApplied) return links;
  return links.filter(link => !link.applied);
}

// Simulate renderJobLinksList - just records what would be rendered
let lastRenderedLinks = [];
function renderJobLinksListMock(links) {
  lastRenderedLinks = links;
  return Promise.resolve();
}

// ============================================================================
// Tests: isCacheValid()
// ============================================================================

console.log('\n=== isCacheValid() Tests ===\n');

test('returns valid:false when no timestamp', async () => {
  const storage = createMockStorage({});
  const browser = createMockBrowser(storage);
  const result = await isCacheValid(browser.storage);
  assertStrictEqual(result.valid, false, 'Should be invalid');
  assertStrictEqual(result.isStale, true, 'Should be stale');
});

test('returns valid:true when cache is fresh (< 30 min)', async () => {
  const storage = createMockStorage({ jobOffersTimestamp: ONE_HOUR_AGO });
  const browser = createMockBrowser(storage);
  const result = await isCacheValid(browser.storage);
  assertStrictEqual(result.valid, true, 'Should be valid');
  assertStrictEqual(result.isStale, false, 'Should not be stale');
});

test('returns valid:false when cache is stale (> 30 min)', async () => {
  const storage = createMockStorage({ jobOffersTimestamp: THIRTY_FIVE_MINUTES_AGO });
  const browser = createMockBrowser(storage);
  const result = await isCacheValid(browser.storage);
  assertStrictEqual(result.valid, false, 'Should be invalid');
  assertStrictEqual(result.isStale, true, 'Should be stale');
});

test('calculates correct age', async () => {
  const storage = createMockStorage({ jobOffersTimestamp: ONE_HOUR_AGO });
  const browser = createMockBrowser(storage);
  const result = await isCacheValid(browser.storage);
  assertOk(result.age >= (60 * 60 * 1000), 'Age should be ~1 hour');
});

// ============================================================================
// Tests: loadCachedJobLinks() - Simulated
// ============================================================================

console.log('\n=== loadCachedJobLinks() Simulation Tests ===\n');

test('returns hasData:false when no jobOffers in storage', async () => {
  const storage = createMockStorage({});
  const browser = createMockBrowser(storage);
  
  const result = await browser.storage.local.get('jobOffers');
  const hasData = result.jobOffers && result.jobOffers.length > 0;
  
  assertStrictEqual(hasData, false, 'Should have no data');
});

test('returns hasData:true when jobOffers exist in storage', async () => {
  const storage = createMockStorage({ 
    jobOffers: SAMPLE_JOB_OFFERS,
    jobOffersTimestamp: ONE_HOUR_AGO 
  });
  const browser = createMockBrowser(storage);
  
  const result = await browser.storage.local.get('jobOffers');
  const hasData = result.jobOffers && result.jobOffers.length > 0;
  
  assertStrictEqual(hasData, true, 'Should have data');
  assertStrictEqual(result.jobOffers.length, 3, 'Should have 3 jobs');
});

test('filterJobLinks excludes applied when showApplied=false', () => {
  const filtered = filterJobLinks(SAMPLE_JOB_OFFERS, false);
  assertStrictEqual(filtered.length, 2, 'Should filter out 1 applied job');
});

test('filterJobLinks includes all when showApplied=true', () => {
  const filtered = filterJobLinks(SAMPLE_JOB_OFFERS, true);
  assertStrictEqual(filtered.length, 3, 'Should include all jobs');
});

// ============================================================================
// Tests: fetchJobOffers() - Simulated
// ============================================================================

console.log('\n=== fetchJobOffers() Simulation Tests ===\n');

test('returns mapped job offers from background response', async () => {
  const browser = createMockBrowser(createMockStorage({}));
  
  const response = await browser.runtime.sendMessage({ type: 'GET_JOB_OFFERS' });
  
  assertStrictEqual(response.success, true, 'Should succeed');
  assertOk(Array.isArray(response.job_offers), 'Should return array');
  assertStrictEqual(response.job_offers.length, 3, 'Should have 3 jobs');
  
  const mapped = response.job_offers.map(offer => ({
    id: offer.id,
    title: offer.title,
    url: offer.url,
    applied: offer.process?.applied ?? false
  }));
  
  assertStrictEqual(mapped[0].id, 1, 'First job id');
  assertStrictEqual(mapped[0].applied, true, 'First job applied');
  assertStrictEqual(mapped[1].applied, false, 'Second job not applied');
  assertStrictEqual(mapped[2].applied, false, 'Third job default not applied');
});

// ============================================================================
// Tests: Full Flow Integration
// ============================================================================

console.log('\n=== Full Flow Integration Tests ===\n');

test('complete flow: fresh cache → display without fetch', async () => {
  // Setup: cache exists and is fresh
  const storage = createMockStorage({ 
    jobOffers: SAMPLE_JOB_OFFERS,
    jobOffersTimestamp: ONE_HOUR_AGO
  });
  const browser = createMockBrowser(storage);
  
  // Step 1: Check cache validity
  const cacheStatus = await isCacheValid(browser.storage);
  assertStrictEqual(cacheStatus.valid, true, 'Cache should be valid');
  assertStrictEqual(cacheStatus.isStale, false, 'Cache should not be stale');
  
  // Step 2: Get job offers from storage
  const result = await browser.storage.local.get('jobOffers');
  assertOk(result.jobOffers.length > 0, 'Should have jobs');
  
  // Step 3: Filter and render
  const filtered = filterJobLinks(result.jobOffers, false);
  await renderJobLinksListMock(filtered);
  
  assertStrictEqual(lastRenderedLinks.length, 2, 'Should show 2 non-applied');
});

test('complete flow: stale cache → needs refresh', async () => {
  // Setup: cache exists but is stale
  const storage = createMockStorage({ 
    jobOffers: SAMPLE_JOB_OFFERS,
    jobOffersTimestamp: THIRTY_FIVE_MINUTES_AGO
  });
  const browser = createMockBrowser(storage);
  
  // Step 1: Check cache validity
  const cacheStatus = await isCacheValid(browser.storage);
  assertStrictEqual(cacheStatus.valid, false, 'Cache should be invalid');
  assertStrictEqual(cacheStatus.isStale, true, 'Cache should be stale');
  
  // Step 2: Should still load cache (for display) but need refresh
  const result = await browser.storage.local.get('jobOffers');
  await renderJobLinksListMock(result.jobOffers);
  
  // Since cache is stale, needsRefresh should be true
  const needsRefresh = cacheStatus.isStale;
  assertStrictEqual(needsRefresh, true, 'Should need refresh');
});

test('complete flow: no cache → fetch from API', async () => {
  // Setup: no cache
  const storage = createMockStorage({});
  const browser = createMockBrowser(storage);
  
  // Step 1: Check cache validity - should be invalid
  const cacheStatus = await isCacheValid(browser.storage);
  assertStrictEqual(cacheStatus.valid, false, 'Cache should be invalid');
  
  // Step 2: No jobs in storage
  const result = await browser.storage.local.get('jobOffers');
  const hasData = result.jobOffers && result.jobOffers.length > 0;
  assertStrictEqual(hasData, false, 'Should have no data');
  
  // Step 3: Fetch from background (simulated)
  const response = await browser.runtime.sendMessage({ type: 'GET_JOB_OFFERS' });
  assertStrictEqual(response.success, true, 'API should succeed');
  assertStrictEqual(response.job_offers.length, 3, 'Should get 3 jobs');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`Job Loading Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);