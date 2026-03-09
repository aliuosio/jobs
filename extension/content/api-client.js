/**
 * API Client for Job Forms Helper
 * Handles communication with the backend RAG API
 * Includes timeout handling and error management
 */

const API_CONFIG = {
  endpoint: 'http://localhost:8000',
  timeout: 10000, // 10 seconds (FR-015)
  endpoints: {
    fillForm: '/fill-form',
    health: '/health'
  }
};

/**
 * Error codes for API errors
 */
const API_ERROR_CODES = {
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  API_ERROR: 'API_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Make a POST request to the backend API
 * @param {string} label - The form field label text
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The API response
 */
async function fetchToBackend(label, options = {}) {
  const {
    contextHints = null,
    fieldType = null,
    formUrl = null
  } = options;

  const url = `${API_CONFIG.endpoint}${API_CONFIG.endpoints.fillForm}`;
  
  const payload = {
    label: label
  };

  if (contextHints) payload.context_hints = contextHints;
  if (fieldType) payload.field_type = fieldType;
  if (formUrl) payload.form_url = formUrl;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle HTTP error responses
      const errorMessage = await getErrorMessage(response);
      throw new ApiError(
        API_ERROR_CODES.API_ERROR,
        `API returned status ${response.status}: ${errorMessage}`,
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!validateFillResponse(data)) {
      throw new ApiError(
        API_ERROR_CODES.INVALID_RESPONSE,
        'API response missing required fields',
        { received: data }
      );
    }

    return {
      success: true,
      data: data
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle specific error types
    if (error instanceof ApiError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.API_TIMEOUT,
          message: `API request timed out after ${API_CONFIG.timeout / 1000} seconds`,
          details: { timeout: API_CONFIG.timeout }
        }
      };
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.API_UNAVAILABLE,
          message: `Cannot connect to API at ${API_CONFIG.endpoint}`,
          details: { endpoint: API_CONFIG.endpoint, error: error.message }
        }
      };
    }

    // Generic network error
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.NETWORK_ERROR,
        message: error.message,
        details: { error: error.toString() }
      }
    };
  }
}

/**
 * Check API health/availability
 * @returns {Promise<boolean>} True if API is available
 */
async function checkApiHealth() {
  const url = `${API_CONFIG.endpoint}${API_CONFIG.endpoints.health}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;

  } catch (error) {
    return false;
  }
}

/**
 * Get error message from response
 * @param {Response} response 
 * @returns {Promise<string>}
 */
async function getErrorMessage(response) {
  try {
    const data = await response.json();
    return data.detail || data.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

/**
 * Validate FillResponse structure
 * @param {Object} data 
 * @returns {boolean}
 */
function validateFillResponse(data) {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.answer === 'string' &&
    typeof data.has_data === 'boolean'
  );
}

/**
 * Map API error code to user-friendly message
 * @param {string} code 
 * @returns {string}
 */
function getErrorMessageForCode(code) {
  const messages = {
    [API_ERROR_CODES.API_UNAVAILABLE]: 'Unable to connect to the resume service. Please ensure the backend is running.',
    [API_ERROR_CODES.API_ERROR]: 'The resume service encountered an error. Please try again.',
    [API_ERROR_CODES.API_TIMEOUT]: 'The request took too long. Please try again.',
    [API_ERROR_CODES.INVALID_RESPONSE]: 'Received an invalid response from the service.',
    [API_ERROR_CODES.NETWORK_ERROR]: 'A network error occurred. Please check your connection.'
  };

  return messages[code] || 'An unexpected error occurred.';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchToBackend,
    checkApiHealth,
    getErrorMessageForCode,
    API_ERROR_CODES,
    ApiError
  };
}
