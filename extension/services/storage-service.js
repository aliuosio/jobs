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

async function loadFromStorage(keys) {
  const allKeys = Array.isArray(keys) ? keys : Object.values(STORAGE_KEYS);
  try {
    return await browser.storage.local.get(allKeys);
  } catch (error) {
    console.error('[Storage] Failed to load:', error);
    return {};
  }
}

async function saveToStorage(state) {
  try {
    await browser.storage.local.set(state);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('[Storage] Quota exceeded:', error);
    } else {
      console.error('[Storage] Failed to save:', error);
    }
    throw error;
  }
}

async function getVisitedLinks() {
  const state = await loadFromStorage([STORAGE_KEYS.VISITED_LINKS]);
  return new Set(state[STORAGE_KEYS.VISITED_LINKS] || []);
}

async function markLinkVisited(linkId) {
  const visited = await getVisitedLinks();
  visited.add(linkId);
  await saveToStorage({ [STORAGE_KEYS.VISITED_LINKS]: [...visited] });
}

const storageService = {
  STORAGE_KEYS,
  CURRENT_STORAGE_VERSION,
  load: loadFromStorage,
  save: saveToStorage,
  getVisitedLinks,
  markLinkVisited
};

if (typeof window !== 'undefined') {
  window.storageService = storageService;
}