/**
 * Popup Script for Job Forms Helper
 * Handles UI interactions and communication with background/content scripts
 */

// State
let currentTabId = null;
let detectedFields = [];
let isScanning = false;
let isFilling = false;
let jobLinks = [];

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
  clearBtn: document.getElementById('clear-btn'),
  jobLinksList: document.getElementById('job-links-list'),
  jobLinksLoading: document.getElementById('job-links-loading'),
  jobLinksError: document.getElementById('job-links-error'),
  retryBtn: document.getElementById('retry-btn')
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
  
  // Load job links from background (replacing dummy data)
  await loadJobLinks();
}

/**
 * Set up button event listeners
 */
function setupEventListeners() {
  elements.scanBtn.addEventListener('click', handleScanClick);
  elements.fillAllBtn.addEventListener('click', handleFillAllClick);
  elements.clearBtn.addEventListener('click', handleClearClick);
  // Retry button for loading failures
  if (elements.retryBtn) {
    elements.retryBtn.addEventListener('click', handleRetryClick);
  }
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
 * Show skeleton loading state
 */
function showSkeleton() {
  elements.jobLinksList.style.display = 'none';
  elements.jobLinksError.style.display = 'none';
  elements.jobLinksLoading.style.display = 'flex';
}

/**
 * Hide loading state and show job list
 */
function hideLoading() {
  elements.jobLinksLoading.style.display = 'none';
  elements.jobLinksError.style.display = 'none';
  elements.jobLinksList.style.display = 'block';
}

/**
 * Show error state with retry
 * @param {string} message
 */
function showJobError(message) {
  elements.jobLinksLoading.style.display = 'none';
  elements.jobLinksError.style.display = 'flex';
  elements.jobLinksList.style.display = 'none';
  const errorMsg = elements.jobLinksError.querySelector('.error-message');
  if (errorMsg) errorMsg.textContent = message || 'Failed to load jobs';
}

/**
 * Handle retry button click
 */
async function handleRetryClick() {
  await loadJobLinks();
}

/**
 * Load job links from API (called on init and retry)
 */
async function loadJobLinks() {
  showSkeleton();
  try {
    const links = await fetchJobOffers();
    jobLinks = links;
    hideLoading();
    renderJobLinksList(jobLinks);
  } catch (err) {
    console.error('[Popup] loadJobLinks error:', err);
    showJobError('Failed to load jobs');
  }
}

/**
 * Fetch job offers from background script
 * @returns {Promise<Array>} JobLinkState array
 */
async function fetchJobOffers() {
  try {
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
  } catch (err) {
    throw err;
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
      label: field.label,
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
      <span class="field-confidence ${field.confidence}"></span>
      <span class="field-label" title="${field.label}">${field.label}</span>
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

/**
 * Get dummy job links data
 * @returns {Array}
 */
function getDummyJobLinks() {
  return [
    { id: '1', title: 'Senior Frontend Developer', url: 'https://example.com/jobs/1', status: 'new' },
    { id: '2', title: 'Full Stack Engineer - React/Node', url: 'https://example.com/jobs/2', status: 'new' },
    { id: '3', title: 'DevOps Engineer - Kubernetes', url: 'https://example.com/jobs/3', status: 'new' },
    { id: '4', title: 'Backend Developer - Python', url: 'https://example.com/jobs/4', status: 'new' },
    { id: '5', title: 'Mobile Developer - iOS/Swift', url: 'https://example.com/jobs/5', status: 'new' }
  ];
}

/**
 * Render job links list in popup
 * @param {Array} links
 */
function renderJobLinksList(links) {
  if (!links || links.length === 0) {
    elements.jobLinksList.innerHTML = '<p class="no-links">No job links available.</p>';
    return;
  }
  
  const html = links.map(link => `
    <div class="job-link-item" data-job-id="${link.id}">
      <span class="job-status-indicator ${link.applied ? 'job-status-applied' : 'job-status-new'}${link.pending ? ' job-status-pending' : ''}" 
            data-action="toggle" 
            data-job-id="${link.id}"
            title="${link.pending ? 'Updating...' : (link.applied ? 'Applied - click to mark as not applied' : 'Not applied - click to mark as applied')}"
            role="button" aria-label="${link.pending ? 'Updating...' : (link.applied ? 'Applied' : 'Not applied')}" ></span>
      <a class="job-link-title" href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.title}">${link.title}</a>
    </div>`
  ).join('');
  
  elements.jobLinksList.innerHTML = html;
  
  // Attach click listeners for status icons
  elements.jobLinksList.querySelectorAll('[data-action="toggle"]').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const jobId = parseInt(icon.dataset.jobId, 10);
      handleStatusClick(jobId);
    });
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        const jobId = parseInt(icon.dataset.jobId, 10);
        handleStatusClick(jobId);
      }
    });
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
/**
 * Handle status icon click — optimistic toggle
 * @param {number} jobId
 */
async function handleStatusClick(jobId) {
  const link = jobLinks.find(l => l.id === jobId);
  if (!link || link.pending) return; // debounce: ignore if already pending
  
  // Optimistic update
  link.pending = true;
  const oldApplied = link.applied;
  link.applied = !oldApplied;
  renderJobLinksList(jobLinks);
  
  try {
    const response = await browser.runtime.sendMessage({
      type: 'UPDATE_APPLIED',
      data: { job_offer_id: jobId, applied: link.applied }
    });
    
    if (response.success) {
      link.pending = false;
      link.error = false;
    } else {
      // Revert on failure
      link.pending = false;
      link.applied = oldApplied;
      link.error = true;
      showToggleError('Failed to update status');
    }
    renderJobLinksList(jobLinks);
  } catch (err) {
    // Revert on error
    link.pending = false;
    link.applied = oldApplied;
    link.error = true;
    renderJobLinksList(jobLinks);
    showToggleError('Failed to update status');
  }
}

/**
 * Show toggle error message
 * @param {string} message
 */
function showToggleError(message) {
  // Remove existing toggle errors
  document.querySelectorAll('.toggle-error').forEach(el => el.remove());
  const msgEl = document.createElement('div');
  msgEl.className = 'message message-error toggle-error';
  msgEl.textContent = message;
  elements.jobLinksList.parentElement.insertBefore(msgEl, elements.jobLinksList);
  setTimeout(() => msgEl.remove(), 3000);
}
