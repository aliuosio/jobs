/**
 * Popup Script for Job Forms Helper
 * Handles UI interactions and communication with background/content scripts
 */
console.log('[Popup] Script loaded, waiting for DOM...');

import {
  API_ENDPOINT,
  API_TIMEOUT_MS,
  N8N_WEBHOOK_URL,
  CACHE_TTL_MS,
  STORAGE_KEYS,
  CURRENT_STORAGE_VERSION
} from '../services/constants.js';
import { timeoutSignal } from '../services/timeout-signal.js';

const MIN_DESCRIPTION_LENGTH = 200;

/**
 * Check if cached job offers are still valid
 * @returns {Promise<{valid: boolean, isStale: boolean, age: number}>}
 */
async function isCacheValid() {
  try {
    const result = await browser.storage.local.get('jobOffersTimestamp');
    const timestamp = result.jobOffersTimestamp || 0;
    
    if (timestamp === 0) {
      return { valid: false, isStale: true, age: 0 };
    }
    
    const age = Date.now() - timestamp;
    const isStale = age > CACHE_TTL_MS;
    const valid = age <= CACHE_TTL_MS;
    
    return { valid, isStale, age };
  } catch (error) {
    console.error('[Popup] Error checking cache validity:', error);
    return { valid: false, isStale: true, age: 0 };
  }
}

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
/** @type {?string} Current page URL for field cache validation */
let currentUrl = null;
/** @type {boolean} Filter state for showing applied jobs */
let showAppliedFilter = false;
/** @type {string} SSE connection status */
let sseStatus = 'disconnected';

/** @type {Map<number, boolean>} Letter status cache per job ID */
let letterStatusCache = new Map();

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

async function init() {
  console.log('[Popup] init() START');
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id;
    currentUrl = tab.url;
    console.log('[Popup] Tab loaded:', tab.id);
    
    setupEventListeners();
    setupSSEMessageListener();
    setupDescModal();
    setupClEventListeners();
    console.log('[Popup] Event listeners set up');
    
    await restoreTabPreference();
    await restoreFormFieldsState();
    await restoreShowAppliedFilter();
    console.log('[Popup] State restored');

    const cacheResult = await loadCachedJobLinks();
    console.log('[Popup] Cache result:', cacheResult);
    
    if (!cacheResult.hasData) {
      console.log('[Popup] No cache - calling forceRefreshJobLinks');
      await forceRefreshJobLinks();
    } else if (cacheResult.needsRefresh) {
      console.log('[Popup] Cache stale - background refresh');
      forceRefreshJobLinks().catch(err => 
        console.error('[Popup] Background refresh failed:', err)
      );
    }
    console.log('[Popup] init() COMPLETE');
  } catch (e) {
    console.error('[Popup] init() FAILED:', e);
  }
}

/**
 * Load cached job links from storage for instant display
 * @returns {Promise<{hasData: boolean, needsRefresh: boolean}>}
 */
async function loadCachedJobLinks() {
  try {
    const cacheStatus = await isCacheValid();
    const result = await browser.storage.local.get('jobOffers');
    
    if (!result.jobOffers || result.jobOffers.length === 0) {
      return { hasData: false, needsRefresh: true };
    }
    
    jobLinks = result.jobOffers;
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    await renderJobLinksList(filteredLinks);
    
    if (cacheStatus.isStale) {
      updateStaleIndicator(true);
      return { hasData: true, needsRefresh: true };
    }
    
    return { hasData: true, needsRefresh: false };
  } catch (error) {
    return { hasData: false, needsRefresh: true };
  }
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
  
  jobLinks = jobOffers.map(offer => {
    const existing = jobLinks.find(j => j.id === offer.id);
    return {
      id: offer.id,
      title: offer.title,
      url: offer.url,
      description: offer.description || '',
      applied: offer.process?.applied ?? false,
      pending: false,
      error: false,
      cl_status: existing?.cl_status || 'none',
      cl_start_time: existing?.cl_start_time || null
    };
  });
  
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
 * Handle Refresh Jobs button click - force fresh fetch
 */
async function forceRefreshJobLinks() {
  console.log('[Popup] forceRefreshJobLinks() called');
  
  if (elements.refreshLinksBtn) {
    const btn = elements.refreshLinksBtn;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Refreshing...';
  }
  
  if (elements.jobLinksLoading && elements.jobLinksList && elements.jobLinksError) {
    showSkeleton();
  }
  
  try {
    console.log('[Popup] Fetching job offers from background...');
    const links = await fetchJobOffers();
    console.log('[Popup] Got', links.length, 'links from background');
    jobLinks = links;
    
    if (elements.jobLinksLoading && elements.jobLinksList && elements.jobLinksError) {
      hideLoading();
    }
    
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filteredLinks);
    await cacheJobOffers();
    updateStaleIndicator(false);
    console.log('[Popup] Jobs rendered successfully');
  } catch (err) {
    console.error('[Popup] forceRefreshJobLinks error:', err);
    if (jobLinks.length > 0) {
      if (elements.jobLinksLoading && elements.jobLinksList && elements.jobLinksError) {
        hideLoading();
      }
      showToggleError('Failed to refresh: ' + err.message);
    } else {
      if (elements.jobLinksLoading && elements.jobLinksList && elements.jobLinksError) {
        showJobError('Failed to load jobs: ' + err.message);
      }
    }
  } finally {
    if (elements.refreshLinksBtn) {
      elements.refreshLinksBtn.disabled = false;
      elements.refreshLinksBtn.textContent = 'Refresh Jobs';
    }
  }
}

async function loadJobLinks() {
  await forceRefreshJobLinks();
}

async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}

async function handleRetryClick() {
  await forceRefreshJobLinks();
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
  const applied = link => link.process?.applied ?? link.applied ?? false;
  return links.filter(link => !applied(link));
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
 * Fetch job offers from background script
 * @returns {Promise<Array>} JobLinkState array
 */
async function fetchJobOffers() {
  console.log('[Popup] fetchJobOffers() - sending message to background');
  try {
    const response = await browser.runtime.sendMessage({ type: 'GET_JOB_OFFERS' });
    console.log('[Popup] fetchJobOffers() - response:', response);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch job offers');
    }
    return (response.job_offers || []).map(offer => {
      const existing = jobLinks.find(j => j.id === offer.id);
      return {
        id: offer.id,
        title: offer.title,
        url: offer.url,
        description: offer.description || existing?.description || '',
        applied: offer.process?.applied ?? false,
        pending: false,
        error: false,
        cl_status: existing?.cl_status || 'none',
        cl_start_time: existing?.cl_start_time || null
      };
    });
  } catch (err) {
    console.error('[Popup] fetchJobOffers() - error:', err);
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
      label: field.labelText || field.label,
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
 * Get visited job links from storage
 * @returns {Promise<Set<number>>}
 */
async function getVisitedJobLinks() {
  try {
    const state = await loadStateFromStorage();
    const visited = state[STORAGE_KEYS.VISITED_LINKS] || [];
    return new Set(visited);
  } catch {
    return new Set();
  }
}

/**
 * Get last clicked job link from storage
 * @returns {Promise<number|null>}
 */
async function loadLastClickedJobLink() {
  try {
    const state = await loadStateFromStorage();
    return state[STORAGE_KEYS.LAST_CLICKED_JOB_LINK] || null;
  } catch {
    return null;
  }
}

/**
 * Mark a job link as visited in storage
 * @param {number} jobId
 */
async function markJobLinkVisited(jobId) {
  try {
    const visited = await getVisitedJobLinks();
    visited.add(jobId);
    await saveStateToStorage({
      [STORAGE_KEYS.VISITED_LINKS]: [...visited]
    });
  } catch (err) {
    console.error('[Popup] Failed to save visited state:', err);
  }
}

/**
 * Save last clicked job link to storage
 * @param {number} jobId
 */
async function saveLastClickedJobLink(jobId) {
  try {
    await saveStateToStorage({
      [STORAGE_KEYS.LAST_CLICKED_JOB_LINK]: jobId
    });
  } catch (err) {
    console.error('[Popup] Failed to save last clicked job link:', err);
  }
}

/**
 * Render job links list in popup
 * @param {Array} links
 */
async function renderJobLinksList(links) {
  if (!links || links.length === 0) {
    elements.jobLinksList.innerHTML = '<p class="no-links">No job links available.</p>';
    return;
  }
  
  const visitedLinks = await getVisitedJobLinks();
  const lastClickedJobLink = await loadLastClickedJobLink();
  
  const html = links.map(link => {
    const isVisited = visitedLinks.has(link.id);
    const isLastClicked = link.id === lastClickedJobLink;
    const clStatus = link.cl_status || 'none';
    const clStartTime = link.cl_start_time || null;
    const descriptionLength = link.description ? link.description.trim().length : 0;
    const hasLongDescription = descriptionLength >= MIN_DESCRIPTION_LENGTH;
    const hasDescription = descriptionLength > 0;
    const canGenerate = descriptionLength >= MIN_DESCRIPTION_LENGTH;
    const badgeClass = getClBadgeClass(link, hasLongDescription);
    const badgeText = getClBadgeText(link, hasLongDescription);
    const canGenerateReason = clStatus === 'ready' ? 'Letter available' : (!hasDescription ? 'Enter a description' : `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
    const isGenerating = clStatus === 'generating';
    const isDeleting = link.delete_pending === true;
    return `
    <div class="job-link-item${isVisited ? ' job-link-visited' : ''}${isLastClicked ? ' job-link-highlight' : ''}" data-job-id="${link.id}">
      <span class="job-status-indicator ${link.applied ? 'job-status-applied' : 'job-status-new'}${link.pending ? ' job-status-pending' : ''}" 
            data-action="toggle" 
            data-job-id="${link.id}"
            title="${link.pending ? 'Updating...' : (link.applied ? 'Applied - click to mark as not applied' : 'Not applied - click to mark as applied')}"
            role="button" aria-label="${link.pending ? 'Updating...' : (link.applied ? 'Applied' : 'Not applied')}" ></span>
      <a class="job-link-title" href="${link.url}" title="${link.title}" data-job-id="${link.id}">${link.title}</a>
      <button class="btn-delete" data-action="delete" data-job-id="${link.id}" title="Delete job" ${isDeleting ? 'disabled' : ''}>${isDeleting ? '...' : '×'}</button>
      <span class="cl-badge ${badgeClass}">${badgeText}</span>
      <div class="cl-actions">
        <button class="btn btn-xs btn-secondary cl-save-btn" data-job-id="${link.id}">Save Desc</button>
        <button class="btn btn-xs btn-primary cl-generate-btn" data-job-id="${link.id}" ${!canGenerate ? 'disabled' : ''} title="${canGenerateReason}">${isGenerating ? 'Generating...' : 'Generate'}</button>
      </div>
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
  
  setupClEventListeners();
  
  // Attach click listeners for job links to track visited state and handle navigation
  elements.jobLinksList.querySelectorAll('.job-link-title').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const jobId = parseInt(link.dataset.jobId, 10);
      
      // Mark as visited
      await markJobLinkVisited(jobId);
      await saveLastClickedJobLink(jobId);
      link.closest('.job-link-item').classList.add('job-link-highlight');
      link.closest('.job-link-item').classList.add('job-link-visited');
      
      // Navigate to the URL in the current tab
      try {
        await browser.tabs.update(currentTabId, { url: link.href });
      } catch (error) {
        console.error('Failed to navigate to job link:', error);
      }
    });
  });

  elements.jobLinksList.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const jobId = parseInt(btn.dataset.jobId, 10);
      await handleDeleteClick(jobId);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        const jobId = parseInt(btn.dataset.jobId, 10);
        handleDeleteClick(jobId);
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

// Backup: call init after a short delay anyway
setTimeout(() => {
  console.log('[Popup] Backup init called');
  init().catch(e => console.error('[Popup] Backup init error:', e));
}, 500);

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

async function handleDeleteClick(jobId) {
  const link = jobLinks.find(l => l.id === jobId);
  if (!link || link.delete_pending) return;

  link.delete_pending = true;
  await persistJobOffersState();

  const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
  renderJobLinksList(filteredLinks);

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/job-offers/${jobId}`, {
      method: 'DELETE',
      signal: timeoutSignal(API_TIMEOUT_MS)
    });

    if (response.ok) {
      jobLinks = jobLinks.filter(l => l.id !== jobId);
      await persistJobOffersState();
      showDeleteSuccess('Job deleted');
      const newFilteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
      renderJobLinksList(newFilteredLinks);
    } else {
      link.delete_pending = false;
      await persistJobOffersState();
      renderJobLinksList(filteredLinks);
      showDeleteError('Delete failed. Please try again.');
    }
  } catch (err) {
    link.delete_pending = false;
    await persistJobOffersState();
    renderJobLinksList(filteredLinks);
    showDeleteError('Delete failed. Please try again.');
  }
}

function showDeleteSuccess(message) {
  document.querySelectorAll('.delete-message').forEach(el => el.remove());
  const msgEl = document.createElement('div');
  msgEl.className = 'message message-success delete-message';
  msgEl.textContent = message;
  elements.jobLinksList.parentElement.insertBefore(msgEl, elements.jobLinksList);
  setTimeout(() => msgEl.remove(), 3000);
}

function showDeleteError(message) {
  document.querySelectorAll('.delete-message').forEach(el => el.remove());
  const msgEl = document.createElement('div');
  msgEl.className = 'message message-error delete-message';
  msgEl.textContent = message;
  elements.jobLinksList.parentElement.insertBefore(msgEl, elements.jobLinksList);
  setTimeout(() => msgEl.remove(), 3000);
}

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

function getClBadgeClass(link, hasLongDescription) {
  const status = link.cl_status || 'none';
  if (status === 'generating') return 'cl-badge-generating';
  if (status === 'error') return 'cl-badge-error';
  if (status === 'saved' || status === 'ready') return 'cl-badge-ready';
  if (hasLongDescription) return 'cl-badge-ready';
  return 'cl-badge-no-desc';
}

function getClBadgeText(link, hasLongDescription) {
  const status = link.cl_status || 'none';
  const startTime = link.cl_start_time || null;
  if (status === 'generating' && startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  if (status === 'generating') return 'Generating';
  if (status === 'error') return 'Error';
  if (status === 'saved' || status === 'ready') return 'Saved';
  if (hasLongDescription) return 'Saved';
  return 'No Desc';
}

function updateClState(jobId, status) {
  const link = jobLinks.find(l => l.id === jobId);
  if (link) {
    link.cl_status = status;
    if (status === 'generating') {
      link.cl_start_time = Date.now();
    } else {
      link.cl_start_time = null;
    }
    const filtered = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filtered);
  }
}

let currentClJobId = null;

function openDescModal(jobId, existingDescription) {
  currentClJobId = jobId;
  document.getElementById('desc-modal').style.display = 'flex';
  document.getElementById('desc-textarea').value = existingDescription || '';
  document.getElementById('desc-textarea').focus();
}

async function handleClSave(jobId) {
  const link = jobLinks.find(l => l.id === jobId);
  if (!link) return;
  
  const description = link.description || '';
  openDescModal(jobId, description);
}

function setupDescModal() {
  document.getElementById('desc-cancel-btn').addEventListener('click', () => {
    document.getElementById('desc-modal').style.display = 'none';
    currentClJobId = null;
  });
  
  document.getElementById('desc-save-btn').addEventListener('click', async () => {
    if (!currentClJobId) return;
    
    const description = document.getElementById('desc-textarea').value.trim();
    if (!description) return;
    
    const link = jobLinks.find(l => l.id === currentClJobId);
    if (link) link.description = description;
    
    document.getElementById('desc-modal').style.display = 'none';
    updateClState(currentClJobId, 'saving');
    
    try {
      await fetch(`${API_ENDPOINT}/job-offers/${currentClJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
        signal: timeoutSignal(API_TIMEOUT_MS)
      });
      updateClState(currentClJobId, 'saved');
    } catch (err) {
      console.error('Save description failed:', err);
      updateClState(currentClJobId, 'error');
    }
    
    currentClJobId = null;
  });
}

async function handleClGenerate(jobId) {
  updateClState(jobId, 'generating');
  
  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_offers_id: jobId }),
      signal: timeoutSignal(API_TIMEOUT_MS)
    });
    
    const result = await pollForCompletion(jobId, 180000);
    if (result.completed) {
      updateClState(jobId, 'ready');
    } else {
      updateClState(jobId, 'error');
    }
  } catch (err) {
    console.error('Generate failed:', err);
    updateClState(jobId, 'error');
  }
}

async function pollForCompletion(jobId, timeoutMs) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, 5000));
    
    try {
      const letterGenerated = await window.apiService.checkLetterStatus(jobId);
      if (letterGenerated) {
        const link = jobLinks.find(l => l.id === jobId);
        if (link) {
          link.cl_status = 'ready';
          link.cl_start_time = null;
        }
        const filtered = filterJobLinks(jobLinks, showAppliedFilter);
        renderJobLinksList(filtered);
        return { completed: true };
      }
    } catch (err) {
      console.warn('pollForCompletion: failed to check letter status:', err);
    }
    
    const link = jobLinks.find(l => l.id === jobId);
    if (!link) break;
    
    if (link.cl_status === 'error' || link.cl_status === 'none') {
      return { completed: false };
    }
  }
  
  return { completed: false };
}

function setupClEventListeners() {
  document.querySelectorAll('.cl-save-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const jobId = parseInt(btn.dataset.jobId, 10);
      handleClSave(jobId);
    };
  });
  
  document.querySelectorAll('.cl-generate-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const jobId = parseInt(btn.dataset.jobId, 10);
      handleClGenerate(jobId);
    };
    
    btn.onmouseover = async (e) => {
      const jobId = parseInt(btn.dataset.jobId, 10);
      let letterGenerated = null;
      
      if (letterStatusCache.has(jobId)) {
        letterGenerated = letterStatusCache.get(jobId);
      } else {
        try {
          letterGenerated = await window.apiService.checkLetterStatus(jobId);
          letterStatusCache.set(jobId, letterGenerated);
        } catch (err) {
          console.warn('Failed to fetch letter status:', err);
        }
      }
      
      if (letterGenerated === true) {
        btn.title = 'Letter Generated';
      } else if (letterGenerated === false) {
        btn.title = 'Letter Not Generated';
      }
    };
    
    btn.onmouseout = (e) => {
      const jobId = parseInt(btn.dataset.jobId, 10);
      const link = jobLinks.find(l => l.id === jobId);
      if (link) {
        const clStatus = link.cl_status || 'none';
        const descriptionLength = link.description ? link.description.trim().length : 0;
        const hasDescription = descriptionLength > 0;
        
        if (clStatus === 'ready') {
          btn.title = 'Letter available';
        } else if (!hasDescription) {
          btn.title = 'Enter a description';
        } else {
          btn.title = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
        }
      }
    };
  });
}
