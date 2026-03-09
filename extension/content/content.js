/**
 * Content Script - Main content script for DOM injection
 * Handles messages from popup, background, content scripts
 */

// State management
let detectedFields = [];
let pendingFills = new Map();
let fieldCount = 0;
let fillProgress = { total: 0, completed: 0, failed: 0, currentField: null };
let formObserver = null;
let isScanning = false;
let isInitialized = false;
let lastScanTime = null;

/**
 * Initialize content script
 */
function initContentScript() {
  if (isInitialized) return;
  
  isInitialized = true;
  lastScanTime = Date.now();
  
  // Initialize FormObserver for dynamic form detection
  if (typeof FormObserver !== 'undefined') {
    formObserver = new FormObserver({
      debounceMs: 300,
      maxWaitMs: 10000,
      onFormDetected: handleFormDetected
    });
    
    formObserver.setOnScanComplete(() => {
      console.log('[Content] Form scan complete');
      notifyScanComplete();
    });
    
    formObserver.start();
  }
  
  // Set up message listener
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('[Content] Message handler error:', error);
        sendResponse({
          success: false,
          error: {
            code: 'HANDLER_ERROR',
            message: error.message
          }
        });
      });
    return true; // Keep message channel open for async response
  });
  
  console.log('[Content] Job Forms Helper content script initialized');
}

/**
 * Handle incoming messages
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'DETECT_FIELDS':
      return handleDetectFields();
    
    case 'FILL_FIELD':
      return handleFillField(message.data);
    
    case 'FILL_FIELD_ERROR':
      return handleFillFieldError(message.data);
    
    case 'BATCH_FILL_STARTED':
      return handleBatchFillStarted(message.data);
    
    case 'BATCH_FILL_PROGRESS':
      return handleBatchFillProgress(message.data);
    
    case 'BATCH_FILL_COMPLETE':
      return handleBatchFillComplete(message.data);
    
    case 'CLEAR_INDICATORS':
      return handleClearIndicators();
    
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
 * Handle field detection request
 */
async function handleDetectFields() {
  try {
    // Clear previous indicators
    clearFieldIndicators();
    
    // Scan for fields
    detectedFields = scanPage();
    fieldCount = detectedFields.length;
    lastScanTime = Date.now();
    
    // Add visual indicators for detected fields
    detectedFields.forEach(field => {
      if (field.isFillable) {
        field.element.classList.add('jfh-field-detected');
      } else {
        field.element.classList.add('jfh-field-skipped');
      }
    });
    
    // Prepare response data
    const fieldsData = detectedFields.map(field => ({
      id: field.id,
      label: field.labelText,
      type: field.type,
      confidence: field.labelConfidence,
      is_fillable: field.isFillable
    }));
    
    return {
      success: true,
      fields: fieldsData,
      count: fieldsData.length
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'DETECTION_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * Handle single field fill request
 */
async function handleFillField(data) {
  const { field_id, value, has_data } = data;
  
  const field = detectedFields.find(f => f.id === field_id);
  if (!field) {
    return {
      success: false,
      error: {
        code: 'FIELD_NOT_FOUND',
        message: `Field ${field_id} not found`
      }
    };
  }
  
  try {
    const result = fillField(field.element, value, {
      hasData: has_data,
      maxlength: field.element.maxLength || null
    });
    
    if (result.success) {
      field.filledValue = value;
      
      // Notify background of successful fill
      browser.runtime.sendMessage({
        type: 'FIELD_FILLED',
        data: {
          field_id: field_id,
          success: true,
          value: value
        }
      });
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FILL_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * Handle fill field error from background
 */
async function handleFillFieldError(data) {
  const { field_id, error } = data;
  
  const field = detectedFields.find(f => f.id === field_id);
  if (field) {
    field.element.classList.remove('jfh-field-filled');
    field.element.classList.add('jfh-field-error');
  }
  
  return { success: true };
}

/**
 * Handle batch fill started notification
 */
async function handleBatchFillStarted(data) {
  const { total } = data;
  
  fillProgress = { total, completed: 0, failed: 0, currentField: null };
  
  // Show progress overlay
  showProgressOverlay(0, total);
  
  return { success: true };
}

/**
 * Handle batch fill progress notification
 */
async function handleBatchFillProgress(data) {
  const { current, total, field_id } = data;
  
  fillProgress.currentField = field_id;
  
  // Update progress overlay
  showProgressOverlay(current, total);
  
  return { success: true };
}

/**
 * Handle batch fill complete notification
 */
async function handleBatchFillComplete(data) {
  const { total, completed, failed, results } = data;
  
  fillProgress = { total, completed, failed, currentField: null };
  
  // Hide progress overlay
  hideProgressOverlay();
  
  // Show completion notification
  if (failed > 0) {
    showToast(`${completed}/${total} fields filled (${failed} failed)`, 'warning');
  } else {
    showToast(`All ${completed} fields filled successfully`, 'success');
  }
  
  return { success: true };
}

/**
 * Handle clear indicators request
 */
async function handleClearIndicators() {
  clearFieldIndicators();
  return { success: true };
}

/**
 * Handle form detected event from FormObserver
 */
function handleFormDetected(form) {
  console.log('[Content] New form detected');
  
  // Re-scan and update detected fields
  const newFields = scanForm(form);
  
  if (newFields.length > 0) {
    // Add new fields to our list
    newFields.forEach(field => {
      const existing = detectedFields.find(f => f.element === field.element);
      if (!existing) {
        detectedFields.push(field);
        fieldCount++;
        
        if (field.isFillable) {
          field.element.classList.add('jfh-field-detected');
        }
      }
    });
    
    // Notify popup of updated field count
    browser.runtime.sendMessage({
      type: 'FIELDS_UPDATED',
      data: {
        count: fieldCount
      }
    });
  }
}

/**
 * Notify that scan is complete
 */
function notifyScanComplete() {
  browser.runtime.sendMessage({
    type: 'SCAN_COMPLETE',
    data: {
      count: fieldCount,
      timestamp: Date.now()
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}
