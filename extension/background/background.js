/**
 * Background Service Worker for Job Forms Helper
 * Handles message routing between popup and content scripts
 * Manages API communication and extension state
 */

const API_ENDPOINT = 'http://localhost:8000';

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
      return handleScanPage(message.data);
    
    case 'GET_STATUS':
      return handleGetStatus();
    
    case 'GET_JOB_OFFERS':
      return handleGetJobOffers(message.data);
    
    case 'FIELD_FILLED':
      return handleFieldFilled(message.data, sender);

    case 'UPDATE_APPLIED':
      return handleUpdateApplied(message.data);
    
    case 'FILL_ERROR':
      return handleFillError(message.data, sender);
    
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
        // ignore JSON parse errors
      }
      return {
        success: false,
        error: { code, message }
      };
    }

    // Try to parse JSON body if any (does not affect output)
    try {
      await response.json();
    } catch {
      // ignore if no JSON
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
  try {
    const response = await fetch(`${API_ENDPOINT}/fill-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        label: data.label,
        context_hints: data.context_hints || null,
        field_type: data.field_type || null,
        form_url: data.form_url || null,
        signals: data.signals || null
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
    
    // Use clean field_value for forms; fall back to conversational answer if unavailable
    const value = fillResponse.field_value || fillResponse.answer;
    
    return {
      success: true,
      field_id: data.field_id,
      value: value,
      has_data: fillResponse.has_data,
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
  try {
    // Build URL with optional query parameters
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
    // Normalize response to contract: { job_offers: [...] }
    const offers = json.job_offers ?? json.offers ?? [];

    return {
      success: true,
      job_offers: offers
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
 * Handle page scan request
 */
async function handleScanPage(data) {
  const { tab_id } = data;
  
  try {
    const response = await sendToContent(tab_id, { type: 'DETECT_FIELDS' });
    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CONTENT_SCRIPT_NOT_LOADED',
        message: 'Content script not ready or tab not accessible'
      }
    };
  }
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

/**
 * Handle field filled notification from content script
 */
async function handleFieldFilled(data, sender) {
  // Update extension storage with fill statistics
  const stats = await browser.storage.local.get(['totalFieldsFilled', 'lastFillTime']);
  await browser.storage.local.set({
    totalFieldsFilled: (stats.totalFieldsFilled || 0) + 1,
    lastFillTime: Date.now()
  });

  return { success: true };
}

/**
 * Handle fill error notification from content script
 */
async function handleFillError(data, sender) {
  console.error('[Background] Fill error:', data);
  return { success: true };
}

/**
 * Send message to content script in specific tab
 */
async function sendToContent(tabId, message) {
  try {
    const response = await browser.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CONTENT_SCRIPT_NOT_LOADED',
        message: 'Content script not ready'
      }
    };
  }
}

/**
 * Utility: Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize on install
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed:', details.reason);
  
  // Initialize storage with defaults
  await browser.storage.local.set({
    lastScanTime: null,
    fieldCount: 0,
    totalFieldsFilled: 0
  });
});

console.log('[Background] Job Forms Helper background script loaded');
