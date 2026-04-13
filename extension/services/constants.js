/**
 * Centralized constants for the extension
 * All other files should import from here
 */

// API Configuration
const API_ENDPOINT = 'http://localhost:8000';
const API_TIMEOUT_MS = 10000;
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/writer';

// SSE Configuration
const SSE_ENDPOINT = `${API_ENDPOINT}/api/v1/stream`;
const SSE_TIMEOUT_MS = 60000;

// Cache Configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Storage Keys (all keys used across the extension)
const STORAGE_KEYS = {
  JOB_OFFERS: 'jobOffers',
  JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp',
  DETECTED_FIELDS: 'detectedFields',
  LAST_URL: 'lastUrl',
  LAST_TAB: 'lastTab',
  STORAGE_VERSION: 'storageVersion',
  SHOW_APPLIED_FILTER: 'showAppliedFilter',
  SSE_STATUS: 'sseStatus',
  VISITED_LINKS: 'visitedLinks',
  LAST_CLICKED_JOB_LINK: 'lastClickedJobLink'
};

const CURRENT_STORAGE_VERSION = 1;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_ENDPOINT,
    API_TIMEOUT_MS,
    N8N_WEBHOOK_URL,
    SSE_ENDPOINT,
    SSE_TIMEOUT_MS,
    CACHE_TTL_MS,
    STORAGE_KEYS,
    CURRENT_STORAGE_VERSION
  };
}

// Export for browser globals
if (typeof window !== 'undefined') {
  window.EXTENSION_CONSTANTS = {
    API_ENDPOINT,
    API_TIMEOUT_MS,
    N8N_WEBHOOK_URL,
    SSE_ENDPOINT,
    SSE_TIMEOUT_MS,
    CACHE_TTL_MS,
    STORAGE_KEYS,
    CURRENT_STORAGE_VERSION
  };
}
