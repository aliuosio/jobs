/**
 * Popup Script for Job Forms Helper
 * Handles UI interactions and communication with background/content scripts
 */

// =============================================================================
// STORAGE CONSTANTS (T004)
// =============================================================================

/** @type {Object} Storage keys for browser.storage.local */
const STORAGE_KEYS = {
  JOB_OFFERS: 'jobOffers',
  JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp',
  DETECTED_FIELDS: 'detectedFields',
  LAST_URL: 'lastUrl',
  LAST_TAB: 'lastTab',
  STORAGE_VERSION: 'storageVersion',
  LAST_CLICKED_JOB_ID: 'lastClickedJobId',
  SHOW_APPLIED_FILTER: 'showAppliedFilter',
  SSE_STATUS: 'sseStatus'
};

/** @type {number} Stale threshold in milliseconds (1 hour) */
const STALE_THRESHOLD_MS = 60 * 60 * 1000;

/** @type {number} Current storage schema version */
const CURRENT_STORAGE_VERSION = 1;

// =============================================================================
// STATE
// =============================================================================

/** @type {?number} Current tab ID */
let currentTabId = null;
/** @type {Array} Detected form fields */
let detectedFields = [];
/** @type {boolean} Scanning state */
let isScanning = false;
/** @type {boolean} Filling state */
let isFilling = false;
/** @type {Array} Job links from API */
let jobLinks = [];
/** @type {?number} Last clicked job ID */
let lastClickedJobId = null;
/** @type {?string} Current page URL for field cache validation */
let currentUrl = null;
/** @type {boolean} Filter state for showing applied jobs */
let showAppliedFilter = false;
/** @type {string} SSE connection status */
let sseStatus = 'disconnected';

// DOM Elements
const elements = {
  // Tab Navigation
  tabForms: document.getElementById('tab-forms'),
  tabLinks: document.getElementById('tab-links'),
  
  // Forms Panel Elements
  scanBtn: document.getElementById('scan-btn'),
  fillAllBtn: document.getElementById('fill-all-btn'),
  fieldsList: document.getElementById('fields-list'),
  progressSection: document.getElementById('progress-section'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  clearBtn: document.getElementById('clear-btn'),
  
  // Links Tab Elements
  refreshLinksBtn: document.getElementById('refresh-links-btn'),
  exportAppliedBtn: document.getElementById('export-applied-btn'),
  jobLinksList: document.getElementById('job-links-list'),
  jobLinksLoading: document.getElementById('job-links-loading'),
  jobLinksError: document.getElementById('job-links-error'),
  retryBtn: document.getElementById('retry-btn'),
  staleIndicator: document.getElementById('stale-indicator')
};

/**
 * Update stale indicator visibility
 * @param {boolean} isStale - Whether the cache is stale
 */
function updateStaleIndicator(isStale) {
  if (elements.staleIndicator) {
    elements.staleIndicator.style.display = isStale ? 'block' : 'none';
  }
}

/**
 * Initialize popup
 */
async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  currentUrl = tab.url;
  
  setupEventListeners();
  setupSSEMessageListener();
  
  await restoreTabPreference();
  await restoreLastClickedJobId();
  await restoreFormFieldsState();
  await restoreShowAppliedFilter();
  await loadJobLinks();
}

/**
 * Set up listener for SSE updates from background script
 */
function setupSSEMessageListener() {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JOB_OFFERS_UPDATE') {
      handleJobOffersUpdate(message.data);
      return false;
    }
    if (message.type === 'SSE_STATUS_CHANGE') {
      handleSSEStatusChange(message.data);
      return false;
    }
  });
}

/**
 * Handle job offers update from SSE
 * @param {Object} data - { jobOffers: Array, timestamp: number }
 */
function handleJobOffersUpdate(data) {
  const { jobOffers } = data;
  console.log('[Popup] SSE update received:', jobOffers.length, 'offers');
  
  jobLinks = jobOffers.map(offer => ({
    id: offer.id,
    title: offer.title,
    url: offer.url,
    applied: offer.process?.applied ?? false,
    pending: false,
    error: false
  }));
  
  const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
  renderJobLinksList(filteredLinks);
  cacheJobOffers();
}

/**
 * Handle SSE connection status change
 * @param {Object} data - { status: string, timestamp: number }
 */
function handleSSEStatusChange(data) {
  sseStatus = data.status;
  console.log('[Popup] SSE status changed:', sseStatus);
  
  if (data.status === 'disconnected') {
    updateStaleIndicator(true);
  }
}

/**
 * Restore last clicked job ID from storage
 */
async function restoreLastClickedJobId() {
  try {
    const state = await loadStateFromStorage();
    lastClickedJobId = state[STORAGE_KEYS.LAST_CLICKED_JOB_ID] || null;
  } catch (error) {
    console.error('[Popup] Failed to restore lastClickedJobId:', error);
  }
}

/**
 * Restore tab preference from storage
 */
async function restoreTabPreference() {
  try {
    const state = await loadStateFromStorage();
    const lastTab = state[STORAGE_KEYS.LAST_TAB];
    if (lastTab === 'forms' || lastTab === 'links') {
      switchTab(lastTab);
    }
  } catch (error) {
    console.error('[Popup] Failed to restore tab preference:', error);
  }
}

/**
 * Restore form fields from storage if on same URL
 */
async function restoreFormFieldsState() {
  try {
    const state = await loadStateFromStorage();
    const cachedFields = state[STORAGE_KEYS.DETECTED_FIELDS] || [];
    const cachedUrl = state[STORAGE_KEYS.LAST_URL];
    
    if (cachedFields.length > 0 && cachedUrl === currentUrl) {
      detectedFields = cachedFields;
      renderFieldsList(detectedFields);
      elements.fillAllBtn.disabled = detectedFields.length === 0;
    }
  } catch (error) {
    console.error('[Popup] Failed to restore form fields state:', error);
  }
}

/**
 * Set up button event listeners
 */
function setupEventListeners() {
  // Tab navigation
  elements.tabForms.addEventListener('click', () => switchTab('forms'));
  elements.tabLinks.addEventListener('click', () => switchTab('links'));
  
  // Forms panel buttons
  elements.scanBtn.addEventListener('click', handleScanClick);
  elements.fillAllBtn.addEventListener('click', handleFillAllClick);
  elements.clearBtn.addEventListener('click', handleClearClick);
  
  // Links tab buttons
  elements.refreshLinksBtn.addEventListener('click', handleRefreshLinksClick);
  
  // Export applied jobs button
  if (elements.exportAppliedBtn) {
    elements.exportAppliedBtn.addEventListener('click', handleExportAppliedClick);
  }
  
  // Retry button for loading failures
  if (elements.retryBtn) {
    elements.retryBtn.addEventListener('click', handleRetryClick);
  }
  
  // Show applied filter toggle
  const showAppliedToggle = document.getElementById('show-applied-toggle');
  if (showAppliedToggle) {
    showAppliedToggle.addEventListener('change', handleShowAppliedToggle);
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
 * Load job links with cache-first strategy
 * 1. Try to restore from storage first
 * 2. Fetch from API in background
 * 3. Cache new data to storage
 */
async function loadJobLinks() {
  showSkeleton();
  
  try {
    const state = await loadStateFromStorage();
    const cachedOffers = state[STORAGE_KEYS.JOB_OFFERS] || [];
    const cachedTimestamp = state[STORAGE_KEYS.JOB_OFFERS_TIMESTAMP] || 0;
    const isStale = isCacheStale(cachedTimestamp);
    
    console.log('[Popup] loadJobLinks - cachedOffers:', cachedOffers.length, 'isStale:', isStale);
    
    if (cachedOffers.length > 0) {
      jobLinks = cachedOffers;
      hideLoading();
      const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(filteredLinks);
      
      if (isStale) {
        updateStaleIndicator(true);
        fetchAndCacheJobOffers();
      }
    } else {
      console.log('[Popup] No cache, fetching from API...');
      const links = await fetchJobOffers();
      console.log('[Popup] fetchJobOffers returned:', links.length, 'items');
      jobLinks = links;
      hideLoading();
      const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(filteredLinks);
      
      await cacheJobOffers();
    }
  } catch (err) {
    console.error('[Popup] loadJobLinks error:', err);
    showJobError('Failed to load jobs: ' + err.message);
  }
}

/**
 * Fetch job offers from API and cache them
 */
async function fetchAndCacheJobOffers() {
  try {
    const links = await fetchJobOffers();
    jobLinks = links;
    
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filteredLinks);
    
    await cacheJobOffers();
    updateStaleIndicator(false);
  } catch (err) {
    console.error('[Popup] fetchAndCacheJobOffers error:', err);
  }
}

/**
 * Cache current job offers to storage
 */
async function cacheJobOffers() {
  try {
    await saveStateToStorage({
      [STORAGE_KEYS.JOB_OFFERS]: jobLinks,
      [STORAGE_KEYS.JOB_OFFERS_TIMESTAMP]: Date.now()
    });
  } catch (err) {
    console.error('[Popup] Failed to cache job offers:', err);
  }
}

/**
 * Filter job links based on applied status filter
 * @param {Array} links - Job links to filter
 * @param {boolean} showApplied - Whether to show applied jobs
 * @returns {Array} Filtered links
 */
function filterJobLinks(links, showApplied) {
  if (showApplied) {
    return links;
  }
  return links.filter(link => !link.applied);
}

/**
 * Filter job links to show only "not applied for" jobs
 * @param {Array} links
 * @returns {Array} Filtered links where applied is false or null
 */
function filterNotAppliedLinks(links) {
  return links.filter(link => !link.applied);
}

/**
 * Restore show applied filter state from storage
 */
async function restoreShowAppliedFilter() {
  try {
    const state = await loadStateFromStorage();
    showAppliedFilter = state[STORAGE_KEYS.SHOW_APPLIED_FILTER] || false;
    const checkbox = document.getElementById('show-applied-toggle');
    if (checkbox) {
      checkbox.checked = showAppliedFilter;
    }
  } catch (error) {
    console.error('[Popup] Failed to restore showAppliedFilter:', error);
  }
}

/**
 * Handle show applied toggle change
 */
async function handleShowAppliedToggle() {
  showAppliedFilter = document.getElementById('show-applied-toggle').checked;
  await saveStateToStorage({ [STORAGE_KEYS.SHOW_APPLIED_FILTER]: showAppliedFilter });
  const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
  renderJobLinksList(filteredLinks);
}

/**
 * Get all job links (including applied ones)
 * @param {Array} links
 * @returns {Array} All links
 */
function getAllJobLinks(links) {
  return links;
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
  
  try {
    const response = await browser.runtime.sendMessage({
      type: 'SCAN_PAGE',
      data: { tab_id: currentTabId }
    });
    
    if (response.success) {
      detectedFields = response.fields || [];
      currentUrl = (await browser.tabs.get(currentTabId)).url;
      
      renderFieldsList(detectedFields);
      elements.fillAllBtn.disabled = detectedFields.length === 0;
      
      await cacheDetectedFields();
    } else {
      showError(response.error?.message || 'Failed to scan page');
    }
  } catch (error) {
    showError(error.message);
  } finally {
    isScanning = false;
    elements.scanBtn.disabled = false;
    elements.scanBtn.textContent = 'Scan Page';
  }
}

/**
 * Cache detected fields with current URL
 */
async function cacheDetectedFields() {
  try {
    await saveStateToStorage({
      [STORAGE_KEYS.DETECTED_FIELDS]: detectedFields,
      [STORAGE_KEYS.LAST_URL]: currentUrl
    });
  } catch (err) {
    console.error('[Popup] Failed to cache detected fields:', err);
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
        showError(`${failed} field(s) failed to fill`);
      } else {
        showSuccess(`Successfully filled ${completed} fields`);
      }
      
      updateProgress(total, total);
    } else {
      showError(response.error?.message || 'Failed to fill fields');
    }
  } catch (error) {
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
 * Load state from browser storage.local
 * @returns {Promise<Object>} Stored state object
 */
async function loadStateFromStorage() {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const state = await browser.storage.local.get(keys);
    return state;
  } catch (error) {
    console.error('[Popup] Failed to load state from storage:', error);
    return {};
  }
}

/**
 * Save state to browser storage.local
 * @param {Object} state - State object with keys from STORAGE_KEYS
 * @returns {Promise<void>}
 */
async function saveStateToStorage(state) {
  try {
    await browser.storage.local.set(state);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('[Popup] Storage quota exceeded:', error);
    } else {
      console.error('[Popup] Failed to save state to storage:', error);
    }
    throw error;
  }
}

/**
 * Check if cached data is stale based on timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean} True if cache is stale (> 1 hour old)
 */
function isCacheStale(timestamp) {
  if (!timestamp) return true;
  const now = Date.now();
  return (now - timestamp) > STALE_THRESHOLD_MS;
}

/**
 * Migrate storage data if version mismatch detected
 * @param {Object} state - Current stored state
 * @returns {Promise<Object>} Migrated state
 */
async function migrateStorageIfNeeded(state) {
  const storedVersion = state[STORAGE_KEYS.STORAGE_VERSION] || 0;
  
  if (storedVersion === CURRENT_STORAGE_VERSION) {
    return state;
  }
  
  console.log('[Popup] Storage migration needed:', storedVersion, '->', CURRENT_STORAGE_VERSION);
  
  let migratedState = { ...state };
  
  migratedState[STORAGE_KEYS.STORAGE_VERSION] = CURRENT_STORAGE_VERSION;
  
  try {
    await saveStateToStorage({ [STORAGE_KEYS.STORAGE_VERSION]: CURRENT_STORAGE_VERSION });
    console.log('[Popup] Storage migration complete');
  } catch (error) {
    console.error('[Popup] Storage migration failed:', error);
  }
  
  return migratedState;
}

/**
 * Get visited job links from localStorage
 * @returns {Set<number>}
 */
function getVisitedJobLinks() {
  try {
    const visited = localStorage.getItem('jfh-visited-links');
    return visited ? new Set(JSON.parse(visited)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Mark a job link as visited in localStorage
 * @param {number} jobId
 */
function markJobLinkVisited(jobId) {
  try {
    const visited = getVisitedJobLinks();
    visited.add(jobId);
    localStorage.setItem('jfh-visited-links', JSON.stringify([...visited]));
  } catch (err) {
    console.error('[Popup] Failed to save visited state:', err);
  }
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
  
  const visitedLinks = getVisitedJobLinks();
  
  const html = links.map(link => {
    const isVisited = visitedLinks.has(link.id);
    const isLastClicked = link.id === lastClickedJobId;
    return `
    <div class="job-link-item${isVisited ? ' job-link-visited' : ''}${isLastClicked ? ' job-link-last-clicked' : ''}" data-job-id="${link.id}">
      <span class="job-status-indicator ${link.applied ? 'job-status-applied' : 'job-status-new'}${link.pending ? ' job-status-pending' : ''}" 
            data-action="toggle" 
            data-job-id="${link.id}"
            title="${link.pending ? 'Updating...' : (link.applied ? 'Applied - click to mark as not applied' : 'Not applied - click to mark as applied')}"
            role="button" aria-label="${link.pending ? 'Updating...' : (link.applied ? 'Applied' : 'Not applied')}" ></span>
      <a class="job-link-title" href="${link.url}" title="${link.title}" data-job-id="${link.id}">${link.title}</a>
    </div>`;
  }).join('');
  
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
  
  // Attach click listeners for job links to track visited state and handle navigation
  elements.jobLinksList.querySelectorAll('.job-link-title').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const jobId = parseInt(link.dataset.jobId, 10);
      
      // Mark as visited
      markJobLinkVisited(jobId);
      // Add visited class immediately for visual feedback
      link.closest('.job-link-item').classList.add('job-link-visited');
      
      // Remove last clicked indicator from previous link
      if (lastClickedJobId) {
        const prevLink = elements.jobLinksList.querySelector(`.job-link-item[data-job-id="${lastClickedJobId}"]`);
        if (prevLink) {
          prevLink.classList.remove('job-link-last-clicked');
        }
      }
      
      // Add last clicked indicator to current link
      lastClickedJobId = jobId;
      link.closest('.job-link-item').classList.add('job-link-last-clicked');
      
      // Persist last clicked job ID
      saveStateToStorage({ [STORAGE_KEYS.LAST_CLICKED_JOB_ID]: jobId }).catch(err => {
        console.error('[Popup] Failed to persist lastClickedJobId:', err);
      });
      
      // Navigate to the URL in the current tab
      try {
        await browser.tabs.update(currentTabId, { url: link.href });
      } catch (error) {
        console.error('Failed to navigate to job link:', error);
      }
    });
  });
}

/**
 * Switch between tabs
 * @param {string} tabName - 'forms' or 'links'
 */
function switchTab(tabName) {
  if (tabName === 'forms') {
    elements.tabForms.classList.add('active');
    elements.tabLinks.classList.remove('active');
    document.getElementById('panel-forms').classList.add('active');
    document.getElementById('panel-links').classList.remove('active');
  } else {
    elements.tabForms.classList.remove('active');
    elements.tabLinks.classList.add('active');
    document.getElementById('panel-forms').classList.remove('active');
    document.getElementById('panel-links').classList.add('active');
  }
  
  persistTabPreference(tabName);
}

/**
 * Persist tab preference to storage
 * @param {string} tabName - 'forms' or 'links'
 */
async function persistTabPreference(tabName) {
  try {
    await saveStateToStorage({ [STORAGE_KEYS.LAST_TAB]: tabName });
  } catch (err) {
    console.error('[Popup] Failed to persist tab preference:', err);
  }
}

/**
 * Handle Refresh Jobs button click
 */
async function handleRefreshLinksClick() {
  await loadJobLinks();
}

/**
 * Handle Export Applied button click
 */
async function handleExportAppliedClick() {
  const btn = elements.exportAppliedBtn;
  if (!btn || btn.disabled) return;
  
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Exporting...';
  
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/job-offers?format=csv`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(errorData.detail || `Export failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `applied-jobs-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv`;
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess(`Exported ${filename}`);
  } catch (error) {
    console.error('[Popup] Export failed:', error);
    showToggleError(error.message || 'Export failed');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/**
 * Get API base URL for extension
 */
async function getApiUrl() {
  return 'http://localhost:8000';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
/**
 * Handle status icon click — optimistic toggle
 * @param {number} jobId
 */
async function handleStatusClick(jobId) {
  const link = jobLinks.find(l => l.id === jobId);
  if (!link || link.pending) return;
  
  link.pending = true;
  const oldApplied = link.applied;
  link.applied = !oldApplied;
  
  await persistJobOffersState();
  
  try {
    const response = await browser.runtime.sendMessage({
      type: 'UPDATE_APPLIED',
      data: { job_offer_id: jobId, applied: link.applied }
    });
    
    if (response.success) {
      link.pending = false;
      link.error = false;
      
      await persistJobOffersState();
      
      // Re-render with current filter state
      const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(filteredLinks);
    } else {
      link.pending = false;
      link.applied = oldApplied;
      link.error = true;
      showToggleError('Failed to update status');
      // Revert UI with current filter state
      const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(filteredLinks);
    }
  } catch (err) {
    link.pending = false;
    link.applied = oldApplied;
    link.error = true;
    // Revert UI with current filter state
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filteredLinks);
    showToggleError('Failed to update status');
  }
}

/**
 * Persist current job offers state to storage
 */
async function persistJobOffersState() {
  try {
    await saveStateToStorage({
      [STORAGE_KEYS.JOB_OFFERS]: jobLinks,
      [STORAGE_KEYS.JOB_OFFERS_TIMESTAMP]: Date.now()
    });
  } catch (err) {
    console.error('[Popup] Failed to persist job offers state:', err);
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
