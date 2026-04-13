/**
 * Background Service Worker for Job Forms Helper
 * Handles message routing between popup and content scripts
 * Manages API communication and extension state
 * Supports SSE for real-time job offer updates
 */

const { API_ENDPOINT, SSE_ENDPOINT, SSE_TIMEOUT_MS, CACHE_TTL_MS } = require('../services/constants.js');

// =============================================================================
// SSE CLIENT (T019, T020, T022)
// =============================================================================

/** @type {?EventSource} Current SSE connection */
let eventSource = null;

/** @type {number} Current reconnection attempt count */
let reconnectAttempts = 0;

/** @type {?number} Reconnection timeout ID */
let reconnectTimeout = null;

/** @type {string} Current connection status */
let connectionStatus = 'disconnected';

/** @type {Map<number, Object>} In-memory map of job offer ID to latest process data */
const jobOffersMap = new Map();

/** @type {number} Maximum reconnection attempts before giving up (0 = infinite) */
const MAX_RECONNECT_ATTEMPTS = 0;

/** @type {number} Base delay for exponential backoff in milliseconds */
const BASE_RECONNECT_DELAY_MS = 1000;

/** @type {number} Maximum delay for exponential backoff in milliseconds */
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Get current connection status
 * @returns {string} 'connected' | 'disconnected' | 'reconnecting'
 */
function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Update connection status and notify all tabs
 * @param {string} status - New connection status
 */
async function updateConnectionStatus(status) {
  connectionStatus = status;
  // Notify popup of status change
  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      browser.tabs.sendMessage(tab.id, {
        type: 'SSE_STATUS_CHANGE',
        data: { status, timestamp: Date.now() }
      }).catch(() => {});
    }
  } catch {
    // Ignore errors when notifying
  }
}

/**
 * Calculate delay with exponential backoff
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay() {
  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY_MS
  );
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Connect to SSE endpoint
 */
function connectSSE() {
  if (eventSource) {
    eventSource.close();
  }

  updateConnectionStatus('reconnecting');
  console.log('[Background] Connecting to SSE:', SSE_ENDPOINT);

  try {
    eventSource = new EventSource(SSE_ENDPOINT);

    // Handle successful connection
    eventSource.onopen = () => {
      reconnectAttempts = 0;
      updateConnectionStatus('connected');
    };

    // Handle messages
    eventSource.onmessage = (event) => {
      let jobOffers;
      try {
        jobOffers = JSON.parse(event.data);
      } catch (err) {
        console.error('[Background] Malformed JSON in SSE message:', err);
        return;
      }
      
      if (!Array.isArray(jobOffers)) {
        console.error('[Background] Expected array in SSE message, got:', typeof jobOffers);
        return;
      }
      
      console.log('[Background] SSE received', jobOffers.length, 'job offers');

      // Update in-memory map
      for (const offer of jobOffers) {
        if (offer && typeof offer.id !== 'undefined') {
          jobOffersMap.set(offer.id, offer);
        }
      }

      // Broadcast to all tabs
      broadcastJobOffers(jobOffers);
    };

    // Handle errors
    eventSource.onerror = (err) => {
      console.error('[Background] SSE error:', err);
      updateConnectionStatus('disconnected');

      // Don't reconnect if connection was intentionally closed
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        return;
      }

      // Attempt reconnection with exponential backoff
      scheduleReconnect();
    };
  } catch (err) {
    console.error('[Background] Failed to create EventSource:', err);
    scheduleReconnect();
  }
}

/**
 * Schedule reconnection with exponential backoff
 */
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  // Check if max attempts reached
  if (MAX_RECONNECT_ATTEMPTS > 0 && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('[Background] Max reconnection attempts reached');
    updateConnectionStatus('disconnected');
    return;
  }

  const delay = calculateBackoffDelay();
  reconnectAttempts++;
  console.log(`[Background] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts})`);

  reconnectTimeout = setTimeout(() => {
    connectSSE();
  }, delay);
}

/**
 * Disconnect from SSE endpoint
 */
function disconnectSSE() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  updateConnectionStatus('disconnected');
  console.log('[Background] SSE disconnected');
}

/**
 * Broadcast job offers to all open popup tabs
 * @param {Array} jobOffers - Array of job offers with process data
 */
async function broadcastJobOffers(jobOffers) {
  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      browser.tabs.sendMessage(tab.id, {
        type: 'JOB_OFFERS_UPDATE',
        data: { jobOffers, timestamp: Date.now() }
      }).catch(() => {
        // Tab might not have content script loaded
      });
    }
  } catch (err) {
    console.error('[Background] Failed to broadcast job offers:', err);
  }
}

// Initialize SSE connection on startup
connectSSE();

// Pre-load cache on browser startup
browser.runtime.onStartup.addListener(async () => {
  console.log('[Background] Browser started - pre-loading job cache');
  try {
    const state = await browser.storage.local.get(['jobOffers', 'jobOffersTimestamp']);
    const timestamp = state.jobOffersTimestamp || 0;
    const cacheAge = Date.now() - timestamp;
    
    if (state.jobOffers && state.jobOffers.length > 0 && cacheAge <= CACHE_TTL_MS) {
      console.log('[Background] Using existing cache, no fetch needed');
      return;
    }
    
    console.log('[Background] Cache missing or stale - fetching fresh data');
    await handleGetJobOffers({});
  } catch (error) {
    console.error('[Background] Startup cache pre-load failed:', error);
  }
});

/**
 * Message handler for all extension messages
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => sendResponse({
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error.message
      }
    }));
  return true; // Keep message channel open for async response
});

/**
 * Route messages to appropriate handlers
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'FILL_FORM':
      return handleFillForm(message.data);
    
    case 'FILL_ALL_FORMS':
      return handleFillAllForms(message.data);
    
    case 'SCAN_PAGE':
      const tabId = message.data?.tab_id;
      if (!tabId) {
        return { success: false, error: { code: 'INVALID_TAB', message: 'No tab ID provided' } };
      }
      return sendToContent(tabId, { type: 'DETECT_FIELDS' });
    
    case 'GET_STATUS':
      return handleGetStatus();
    
    case 'GET_JOB_OFFERS':
      return handleGetJobOffers(message.data);

    case 'UPDATE_APPLIED':
      return handleUpdateApplied(message.data);
    
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_MESSAGE',
          message: `Unknown message type: ${message.type}`
        }
      };
  }
}

/**
 * Handle update applied status for a job offer
 */
async function handleUpdateApplied(data) {
  try {
    const { job_offer_id, applied } = data;
    console.log('[Background] UPDATE_APPLIED', job_offer_id, applied);
    const response = await fetch(`${API_ENDPOINT}/job-offers/${job_offer_id}/process`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ applied }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const status = response.status;
      const code = status === 404 ? 'NOT_FOUND' : 'API_ERROR';
      let message = response.statusText || `API returned status ${status}`;
      try {
        const json = await response.json();
        if (json && json.message) message = json.message;
      } catch (e) {
      }
      return {
        success: false,
        error: { code, message }
      };
    }

    try {
      await response.json();
    } catch {
    }

    try {
      const state = await browser.storage.local.get(['jobOffers']);
      if (state.jobOffers) {
        const updatedOffers = state.jobOffers.map(offer => {
          if (offer.id === job_offer_id) {
            return { ...offer, applied };
          }
          return offer;
        });
        await browser.storage.local.set({
          jobOffers: updatedOffers,
          jobOffersTimestamp: Date.now()
        });
      }
    } catch (storageError) {
      console.error('[Background] Failed to update job offers cache:', storageError);
    }

    return {
      success: true,
      job_offer_id,
      applied
    };
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'API_TIMEOUT',
          message: 'API request timed out after 10 seconds'
        }
      };
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: `Cannot connect to ${API_ENDPOINT}`,
          details: error.message
        }
      };
    }
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * Handle single field fill request
 */
async function handleFillForm(data) {
  console.log('[Background] search request:', JSON.stringify({
    query: data.label,
    signals: data.signals || null,
    generate: true
  }));
  
  try {
    const response = await fetch(`${API_ENDPOINT}/api/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: data.label,
        signals: data.signals || null,
        generate: true
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: `API returned status ${response.status}`,
          details: response.statusText
        }
      };
    }

    const fillResponse = await response.json();
    console.log('[Background] search response:', JSON.stringify(fillResponse));
    
    const value = fillResponse.generated_answer;
    const hasData = fillResponse.results && fillResponse.results.length > 0;
    
    return {
      success: true,
      field_id: data.field_id,
      value: value,
      has_data: hasData,
      confidence: fillResponse.confidence,
      field_type: fillResponse.field_type || null
    };
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'API_TIMEOUT',
          message: 'API request timed out after 10 seconds'
        }
      };
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: `Cannot connect to ${API_ENDPOINT}`,
          details: error.message
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * Fetch job offers from backend with optional pagination
 */
async function handleGetJobOffers(data) {
  console.log('[Background] handleGetJobOffers called');
  try {
    const url = new URL(`${API_ENDPOINT}/job-offers`);
    if (data && typeof data.limit !== 'undefined') {
      url.searchParams.append('limit', String(data.limit));
    }
    if (data && typeof data.offset !== 'undefined') {
      url.searchParams.append('offset', String(data.offset));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    console.log('[Background] API response status:', response.status);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: `API returned status ${response.status}`,
          details: response.statusText
        }
      };
    }

    const json = await response.json();
    const offers = json.job_offers ?? json.offers ?? [];
    console.log('[Background] offers from API:', offers.length);

    try {
      await browser.storage.local.set({
        jobOffers: offers,
        jobOffersTimestamp: Date.now()
      });
    } catch (storageError) {
      console.error('[Background] Failed to cache job offers:', storageError);
    }

    return {
      success: true,
      job_offers: offers
    };
  } catch (error) {
    console.error('[Background] handleGetJobOffers error:', error);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'API_TIMEOUT',
          message: 'API request timed out after 10 seconds'
        }
      };
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: `Cannot connect to ${API_ENDPOINT}`,
          details: error.message
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * Handle batch fill request for all fields
 */
async function handleFillAllForms(data) {
  const { tab_id, fields } = data;
  const results = [];
  let completed = 0;
  let failed = 0;

  // Send initial status to content script
  await sendToContent(tab_id, {
    type: 'BATCH_FILL_STARTED',
    data: { total: fields.length }
  });

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    
    // Notify content script of current field
    await sendToContent(tab_id, {
      type: 'BATCH_FILL_PROGRESS',
      data: {
        current: i + 1,
        total: fields.length,
        field_id: field.field_id
      }
    });

    const fillResult = await handleFillForm(field);
    
    if (fillResult.success) {
      completed++;
      // Send fill instruction to content script
      await sendToContent(tab_id, {
        type: 'FILL_FIELD',
        data: {
          field_id: field.field_id,
          value: fillResult.value,
          has_data: fillResult.has_data
        }
      });
    } else {
      failed++;
      // Notify content script of error
      await sendToContent(tab_id, {
        type: 'FILL_FIELD_ERROR',
        data: {
          field_id: field.field_id,
          error: fillResult.error
        }
      });
    }

    results.push({
      field_id: field.field_id,
      success: fillResult.success,
      value: fillResult.success ? fillResult.value : null,
      error: fillResult.success ? null : fillResult.error
    });

    // Small delay between fills (75ms as per FR-014)
    if (i < fields.length - 1) {
      await sleep(75);
    }
  }

  // Send completion notification
  await sendToContent(tab_id, {
    type: 'BATCH_FILL_COMPLETE',
    data: {
      total: fields.length,
      completed,
      failed,
      results
    }
  });

  return {
    success: true,
    results,
    total: fields.length,
    completed,
    failed
  };
}

/**
 * Handle get status request
 */
async function handleGetStatus() {
  let apiConnected = false;
  
  try {
    const response = await fetch(`${API_ENDPOINT}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    apiConnected = response.ok;
  } catch (error) {
    apiConnected = false;
  }

  const status = await browser.storage.local.get(['lastScanTime', 'fieldCount']);

  return {
    api_connected: apiConnected,
    api_endpoint: API_ENDPOINT,
    last_scan_time: status.lastScanTime || null,
    field_count: status.fieldCount || 0,
    version: '1.0.0'
  };
}

async function sendToContent(tabId, message, maxRetries = 3, baseDelayMs = 500) {
  try {
    const tab = await browser.tabs.get(tabId);
    
    if (tab.url && (
      tab.url.startsWith('about:') ||
      tab.url.startsWith('chrome:') ||
      tab.url.startsWith('file:') ||
      tab.url.startsWith('moz-extension:')
    )) {
      return {
        success: false,
        error: {
          code: 'INVALID_TAB_URL',
          message: `Cannot inject content script into ${tab.url}`
        }
      };
    }
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'TAB_NOT_FOUND',
        message: 'Tab not found or inaccessible'
      }
    };
  }

  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await browser.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    error: {
      code: 'CONTENT_SCRIPT_NOT_LOADED',
      message: 'Content script not ready. Try reloading the extension.'
    }
  };
}

/**
 * Utility: Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize on install (only set defaults if keys don't exist)
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed:', details.reason);
  
  const existing = await browser.storage.local.get(['lastScanTime', 'fieldCount', 'totalFieldsFilled']);
  const defaults = {
    lastScanTime: existing.lastScanTime ?? null,
    fieldCount: existing.fieldCount ?? 0,
    totalFieldsFilled: existing.totalFieldsFilled ?? 0
  };
  await browser.storage.local.set(defaults);
});

console.log('[Background] Job Forms Helper background script loaded');
