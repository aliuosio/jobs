/**
 * Popup Script for Job Forms Helper
 * Handles UI interactions and communication with background/content scripts
 */

// State
let currentTabId = null;
let detectedFields = [];
let isScanning = false;
let isFilling = false;

// DOM Elements
const elements = {
  statusValue: document.getElementById('status-value'),
  fieldCount: document.getElementById('field-count'),
  apiIndicator: document.getElementById('api-indicator'),
  apiStatus: document.getElementById('api-status'),
  scanBtn: document.getElementById('scan-btn'),
  fillAllBtn: document.getElementById('fill-all-btn'),
  fieldsList: document.getElementById('fields-list'),
  progressSection: document.getElementById('progress-section'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  clearBtn: document.getElementById('clear-btn')
};

/**
 * Initialize popup
 */
async function init() {
  // Get current tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  
  // Check API status
  await checkApiStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Try to get cached field count
  await updateFieldCount();
}

/**
 * Set up button event listeners
 */
function setupEventListeners() {
  elements.scanBtn.addEventListener('click', handleScanClick);
  elements.fillAllBtn.addEventListener('click', handleFillAllClick);
  elements.clearBtn.addEventListener('click', handleClearClick);
}

/**
 * Check API connectivity status
 */
async function checkApiStatus() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'GET_STATUS' });
    
    if (response.api_connected) {
      elements.apiIndicator.className = 'status-indicator status-connected';
      elements.apiStatus.className = 'status-value status-connected';
      elements.apiStatus.textContent = 'Connected';
    } else {
      elements.apiIndicator.className = 'status-indicator status-error';
      elements.apiStatus.className = 'status-value status-error';
      elements.apiStatus.textContent = 'Disconnected';
    }
  } catch (error) {
    elements.apiIndicator.className = 'status-indicator status-error';
    elements.apiStatus.className = 'status-value status-error';
    elements.apiStatus.textContent = 'Error';
  }
}

/**
 * Update field count from storage
 */
async function updateFieldCount() {
  try {
    const status = await browser.runtime.sendMessage({ type: 'GET_STATUS' });
    elements.fieldCount.textContent = status.field_count || 0;
  } catch (error) {
    elements.fieldCount.textContent = '0';
  }
}

/**
 * Handle Scan Page button click
 */
async function handleScanClick() {
  if (isScanning) return;
  
  isScanning = true;
  elements.scanBtn.disabled = true;
  elements.scanBtn.textContent = 'Scanning...';
  elements.statusValue.textContent = 'Scanning...';
  
  try {
    const response = await browser.runtime.sendMessage({
      type: 'SCAN_PAGE',
      data: { tab_id: currentTabId }
    });
    
    if (response.success) {
      detectedFields = response.fields || [];
      elements.fieldCount.textContent = detectedFields.length;
      elements.statusValue.textContent = `Found ${detectedFields.length} fields`;
      
      // Update fields list
      renderFieldsList(detectedFields);
      
      // Enable fill button if fields found
      elements.fillAllBtn.disabled = detectedFields.length === 0;
    } else {
      elements.statusValue.textContent = 'Scan failed';
      showError(response.error?.message || 'Failed to scan page');
    }
  } catch (error) {
    elements.statusValue.textContent = 'Scan error';
    showError(error.message);
  } finally {
    isScanning = false;
    elements.scanBtn.disabled = false;
    elements.scanBtn.textContent = 'Scan Page';
  }
}

/**
 * Handle Fill All Fields button click
 */
async function handleFillAllClick() {
  if (isFilling || detectedFields.length === 0) return;
  
  isFilling = true;
  elements.fillAllBtn.disabled = true;
  elements.scanBtn.disabled = true;
  elements.statusValue.textContent = 'Filling...';
  
  // Show progress section
  elements.progressSection.style.display = 'block';
  updateProgress(0, detectedFields.length);
  
  try {
    // Prepare field data for batch fill
    const fields = detectedFields.map(field => ({
      field_id: field.id,
      label: field.labelText,
      field_type: field.type,
      signals: field.signals || null
    }));
    
    const response = await browser.runtime.sendMessage({
      type: 'FILL_ALL_FORMS',
      data: {
        tab_id: currentTabId,
        fields: fields
      }
    });
    
    if (response.success) {
      const { completed, failed, total } = response;
      
      if (failed > 0) {
        elements.statusValue.textContent = `Filled ${completed}/${total} (${failed} failed)`;
        showError(`${failed} field(s) failed to fill`);
      } else {
        elements.statusValue.textContent = `All ${completed} fields filled`;
        showSuccess(`Successfully filled ${completed} fields`);
      }
      
      updateProgress(total, total);
    } else {
      elements.statusValue.textContent = 'Fill failed';
      showError(response.error?.message || 'Failed to fill fields');
    }
  } catch (error) {
    elements.statusValue.textContent = 'Fill error';
    showError(error.message);
  } finally {
    isFilling = false;
    elements.fillAllBtn.disabled = false;
    elements.scanBtn.disabled = false;
    
    // Hide progress after a delay
    setTimeout(() => {
      elements.progressSection.style.display = 'none';
    }, 2000);
  }
}

/**
 * Handle Clear Indicators button click
 */
async function handleClearClick() {
  try {
    await browser.tabs.sendMessage(currentTabId, { type: 'CLEAR_INDICATORS' });
    elements.statusValue.textContent = 'Indicators cleared';
  } catch (error) {
    console.error('Clear error:', error);
  }
}

/**
 * Render fields list in popup
 * @param {Array} fields
 */
function renderFieldsList(fields) {
  if (!fields || fields.length === 0) {
    elements.fieldsList.innerHTML = '<p class="no-fields">No fields detected. Click "Scan Page" to detect form fields.</p>';
    return;
  }
  
  const html = fields.map(field => `
    <div class="field-item">
      <span class="field-confidence ${field.labelConfidence}"></span>
      <span class="field-label" title="${field.labelText}">${field.labelText}</span>
      <span class="field-type">${field.type}</span>
    </div>
  `).join('');
  
  elements.fieldsList.innerHTML = html;
}

/**
 * Update progress bar
 * @param {number} current
 * @param {number} total
 */
function updateProgress(current, total) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  elements.progressFill.style.width = `${percentage}%`;
  elements.progressText.textContent = `Filling ${current}/${total} fields...`;
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
  // Remove existing messages
  document.querySelectorAll('.message').forEach(el => el.remove());
  
  const msgEl = document.createElement('div');
  msgEl.className = 'message message-error';
  msgEl.textContent = message;
  
  elements.fieldsList.parentElement.insertBefore(msgEl, elements.fieldsList);
  
  // Auto-remove after 5 seconds
  setTimeout(() => msgEl.remove(), 5000);
}

/**
 * Show success message
 * @param {string} message
 */
function showSuccess(message) {
  // Remove existing messages
  document.querySelectorAll('.message').forEach(el => el.remove());
  
  const msgEl = document.createElement('div');
  msgEl.className = 'message message-success';
  msgEl.textContent = message;
  
  elements.fieldsList.parentElement.insertBefore(msgEl, elements.fieldsList);
  
  // Auto-remove after 3 seconds
  setTimeout(() => msgEl.remove(), 3000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
