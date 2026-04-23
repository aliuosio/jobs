(function() {
  'use strict';

  const CACHE_TTL_MS = 30 * 60 * 1000;
  const STORAGE_KEYS = {
    JOB_OFFERS: 'jobOffers',
    JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp',
    DETECTED_FIELDS: 'detectedFields',
    LAST_URL: 'lastUrl',
    LAST_TAB: 'lastTab',
    SHOW_APPLIED_FILTER: 'showAppliedFilter',
  };
  const API_ENDPOINT = 'http://localhost:8000';

  async function isCacheValid(browserStorage) {
    browserStorage = browserStorage || (browser && browser.storage && browser.storage.local);
    if (!browserStorage) return { valid: false, isStale: true, age: 0 };
    try {
      const result = await browserStorage.get(STORAGE_KEYS.JOB_OFFERS_TIMESTAMP);
      const timestamp = result.jobOffersTimestamp || 0;
      if (timestamp === 0) return { valid: false, isStale: true, age: 0 };
      const age = Date.now() - timestamp;
      return { valid: age <= CACHE_TTL_MS, isStale: age > CACHE_TTL_MS, age };
    } catch (e) {
      return { valid: false, isStale: true, age: 0 };
    }
  }

  async function getCachedLinks(browserStorage) {
    browserStorage = browserStorage || (browser && browser.storage && browser.storage.local);
    if (!browserStorage) return null;
    try {
      const result = await browserStorage.get(STORAGE_KEYS.JOB_OFFERS);
      return result.jobOffers || null;
    } catch (e) {
      return null;
    }
  }

  async function setCachedLinks(links, browserStorage) {
    browserStorage = browserStorage || (browser && browser.storage && browser.storage.local);
    if (!browserStorage) return;
    try {
      await browserStorage.set({
        [STORAGE_KEYS.JOB_OFFERS]: links,
        [STORAGE_KEYS.JOB_OFFERS_TIMESTAMP]: Date.now(),
      });
    } catch (e) {}
  }

  async function getFromStorage(keys, browserStorage) {
    browserStorage = browserStorage || (browser && browser.storage && browser.storage.local);
    if (!browserStorage) return {};
    try {
      return await browserStorage.get(keys);
    } catch (e) {
      return {};
    }
  }

  async function setToStorage(data, browserStorage) {
    browserStorage = browserStorage || (browser && browser.storage && browser.storage.local);
    if (!browserStorage) return;
    try {
      await browserStorage.set(data);
    } catch (e) {}
  }

  async function sendToBackground(message) {
    return await browser.runtime.sendMessage(message);
  }

  async function fetchJobOffersFromBackground() {
    const response = await sendToBackground({ type: 'GET_JOB_OFFERS' });
    if (!response.success) throw new Error(response.error?.message || 'Failed to fetch');
    return response.job_offers || [];
  }

  async function updateAppliedStatus(jobId, applied) {
    const response = await sendToBackground({
      type: 'UPDATE_APPLIED',
      data: { job_offer_id: jobId, applied },
    });
    if (!response.success) throw new Error(response.error?.message || 'Failed to update');
    return response;
  }

  async function scanPage(tabId) {
    return await sendToBackground({ type: 'SCAN_PAGE', data: { tab_id: tabId } });
  }

  async function fillAllFields(tabId, fields) {
    return await sendToBackground({ 
      type: 'FILL_ALL_FIELDS', 
      data: { tab_id: tabId, fields } 
    });
  }

  const { createContext, useContext, useState, useCallback, useEffect, useRef } = React;

  const AppContext = createContext(null);

  function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
  }

  function AppProvider({ children }) {
    const [activeTab, setActiveTab] = useState('links');
    const [jobLinks, setJobLinks] = useState([]);
    const [jobLinksLoading, setJobLinksLoading] = useState(true);
    const [jobLinksError, setJobLinksError] = useState(null);
    const [isStale, setIsStale] = useState(false);
    const [showAppliedFilter, setShowAppliedFilter] = useState(false);
    const [detectedFields, setDetectedFields] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isFilling, setIsFilling] = useState(false);
    const [fillProgress, setFillProgress] = useState({ current: 0, total: 0 });
    const [showProgress, setShowProgress] = useState(false);
    const [currentTabId, setCurrentTabId] = useState(null);
    const [currentUrl, setCurrentUrl] = useState(null);
    const pendingRefs = useRef({});

    const loadJobLinks = useCallback(async () => {
      setJobLinksLoading(true);
      setJobLinksError(null);
      try {
        const cacheStatus = await isCacheValid();
        const cached = await getCachedLinks();
        if (cached && cached.length > 0) {
          setJobLinks(cached);
          setIsStale(cacheStatus.isStale);
        }
        const freshLinks = await fetchJobOffersFromBackground();
        setJobLinks(freshLinks);
        await setCachedLinks(freshLinks);
        setIsStale(false);
      } catch (err) {
        setJobLinksError(err.message || 'Failed to load job links');
      } finally {
        setJobLinksLoading(false);
      }
    }, []);

    const toggleApplied = useCallback(async (jobId) => {
      if (pendingRefs.current[jobId]) return;
      const link = jobLinks.find(l => l.id === jobId);
      if (!link) return;

      pendingRefs.current[jobId] = true;
      const oldApplied = link.applied;
      const newApplied = !oldApplied;

      setJobLinks(prev => prev.map(l =>
        l.id === jobId ? { ...l, pending: true, applied: newApplied } : l
      ));

      try {
        await updateAppliedStatus(jobId, newApplied);
        setJobLinks(prev => prev.map(l =>
          l.id === jobId ? { ...l, pending: false, error: false } : l
        ));
        const newLinks = jobLinks.map(l => l.id === jobId ? { ...l, applied: newApplied } : l);
        await setCachedLinks(newLinks);
      } catch (err) {
        setJobLinks(prev => prev.map(l =>
          l.id === jobId ? { ...l, pending: false, applied: oldApplied, error: true } : l
        ));
      } finally {
        pendingRefs.current[jobId] = false;
      }
    }, [jobLinks]);

    const refreshJobLinks = useCallback(async () => {
      await loadJobLinks();
    }, [loadJobLinks]);

    const handleScanClick = useCallback(async () => {
      if (!currentTabId || isScanning) return;
      setIsScanning(true);
      setShowProgress(false);
      try {
        const response = await scanPage(currentTabId);
        if (response && response.fields) {
          setDetectedFields(response.fields);
          await setToStorage({
            [STORAGE_KEYS.DETECTED_FIELDS]: response.fields,
            [STORAGE_KEYS.LAST_URL]: currentUrl,
          });
        }
      } catch (e) {
        console.error('Scan failed:', e);
      } finally {
        setIsScanning(false);
      }
    }, [currentTabId, currentUrl, isScanning]);

    const handleFillAllClick = useCallback(async () => {
      if (!currentTabId || isFilling || detectedFields.length === 0) return;
      setIsFilling(true);
      setShowProgress(true);
      setFillProgress({ current: 0, total: detectedFields.length });
      try {
        for (let i = 0; i < detectedFields.length; i++) {
          setFillProgress({ current: i + 1, total: detectedFields.length });
          await fillAllFields(currentTabId, [detectedFields[i]]);
          await new Promise(r => setTimeout(r, 100));
        }
      } catch (e) {
        console.error('Fill failed:', e);
      } finally {
        setIsFilling(false);
        setShowProgress(false);
      }
    }, [currentTabId, isFilling, detectedFields]);

    const handleClearClick = useCallback(async () => {
      setDetectedFields([]);
      await setToStorage({
        [STORAGE_KEYS.DETECTED_FIELDS]: [],
      });
    }, []);

    const handleExportApplied = useCallback(() => {
      const applied = jobLinks.filter(l => l.applied);
      if (applied.length === 0) return;
      const csv = ['Title,URL,Applied'];
      applied.forEach(l => csv.push(`"${l.title}","${l.url}",true`));
      const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applied-jobs.csv';
      a.click();
      URL.revokeObjectURL(url);
    }, [jobLinks]);

    const toggleShowApplied = useCallback(async () => {
      const newValue = !showAppliedFilter;
      setShowAppliedFilter(newValue);
      await setToStorage({ [STORAGE_KEYS.SHOW_APPLIED_FILTER]: newValue });
    }, [showAppliedFilter]);

    useEffect(() => {
      (async () => {
        try {
          const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
          setCurrentTabId(tab.id);
          setCurrentUrl(tab.url);
          
          const state = await getFromStorage([
            STORAGE_KEYS.LAST_TAB,
            STORAGE_KEYS.SHOW_APPLIED_FILTER,
            STORAGE_KEYS.DETECTED_FIELDS,
            STORAGE_KEYS.LAST_URL,
          ]);
          
          if (state[STORAGE_KEYS.LAST_TAB]) setActiveTab(state[STORAGE_KEYS.LAST_TAB]);
          if (typeof state[STORAGE_KEYS.SHOW_APPLIED_FILTER] === 'boolean') {
            setShowAppliedFilter(state[STORAGE_KEYS.SHOW_APPLIED_FILTER]);
          }
          if (state[STORAGE_KEYS.DETECTED_FIELDS] && state[STORAGE_KEYS.LAST_URL] === tab.url) {
            setDetectedFields(state[STORAGE_KEYS.DETECTED_FIELDS]);
          }
          
          await loadJobLinks();
        } catch (e) {
          console.error('Init failed:', e);
        }
      })();
    }, []);

    useEffect(() => {
      setToStorage({ [STORAGE_KEYS.LAST_TAB]: activeTab });
    }, [activeTab]);

    const value = {
      activeTab, setActiveTab,
      jobLinks, jobLinksLoading, jobLinksError, isStale,
      showAppliedFilter,
      detectedFields, isScanning, isFilling, fillProgress, showProgress,
      currentTabId,
      toggleApplied, refreshJobLinks,
      handleScanClick, handleFillAllClick, handleClearClick,
      handleExportApplied, toggleShowApplied,
    };

    return React.createElement(AppContext.Provider, { value }, children);
  }

  function LoadingSpinner() {
    return React.createElement('div', { className: 'flex justify-center py-8' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
    );
  }

  function ErrorUI({ error, onRetry }) {
    return React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-4 text-center' },
      React.createElement('p', { className: 'text-red-600 mb-3' }, error || 'Failed'),
      onRetry && React.createElement('button', {
        className: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700',
        onClick: onRetry,
      }, 'Retry')
    );
  }

  function EmptyState({ message }) {
    return React.createElement('div', { className: 'text-center py-8 text-gray-500' },
      React.createElement('p', null, message || 'No items')
    );
  }

  function StaleIndicator() {
    return React.createElement('div', {
      className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm text-yellow-700 mb-3 flex items-center gap-2'
    },
      React.createElement('span', { className: 'inline-block w-2 h-2 bg-yellow-500 rounded-full' }),
      'Data may be outdated. Click refresh to update.'
    );
  }

  function StatusIndicator({ link, onToggle }) {
    const isApplied = link.applied;
    const isPending = link.pending;
    const baseClass = isApplied ? 'bg-red-500' : 'bg-green-500';
    const pendingClass = isPending ? 'opacity-50' : '';
    const label = isPending ? 'Updating...' : (isApplied ? 'Applied' : 'Not applied');
    const title = isPending ? 'Updating...' : (isApplied ? 'Click to mark as not applied' : 'Click to mark as applied');

    return React.createElement('span', {
      className: `inline-block w-4 h-4 rounded-full ${baseClass} ${pendingClass} cursor-pointer transition-all hover:scale-110`,
      role: 'button',
      'aria-label': label,
      title: title,
      onClick: () => !isPending && onToggle(link.id),
    });
  }

  function JobLinkItem({ link, onToggle }) {
    return React.createElement('div', {
      className: 'flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300',
      'data-job-id': link.id,
    },
      React.createElement(StatusIndicator, { link, onToggle }),
      React.createElement('a', {
        className: 'flex-1 text-blue-600 hover:text-blue-800 hover:underline truncate',
        href: link.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      }, link.title || 'Untitled Job'),
      link.pending && React.createElement('span', { className: 'text-xs text-gray-400' }, '...')
    );
  }

  function JobLinksPanel() {
    const { jobLinks, jobLinksLoading, jobLinksError, isStale, showAppliedFilter, toggleApplied, refreshJobLinks, handleExportApplied, toggleShowApplied } = useApp();

    const filteredLinks = showAppliedFilter 
      ? jobLinks 
      : jobLinks.filter(l => !l.applied);

    if (jobLinksLoading && jobLinks.length === 0) {
      return React.createElement(LoadingSpinner);
    }

    if (jobLinksError && jobLinks.length === 0) {
      return React.createElement(ErrorUI, { error: jobLinksError, onRetry: refreshJobLinks });
    }

    return React.createElement('div', null,
      isStale && React.createElement(StaleIndicator),
      filteredLinks.length === 0
        ? React.createElement(EmptyState, { message: 'No job links available.' })
        : React.createElement('div', { className: 'space-y-2' },
            filteredLinks.map(link => React.createElement(JobLinkItem, {
              key: link.id,
              link,
              onToggle: toggleApplied,
            }))
          ),
      React.createElement('div', { className: 'mt-4 flex items-center justify-between' },
        React.createElement('label', { className: 'flex items-center gap-2 text-sm' },
          React.createElement('input', {
            type: 'checkbox',
            checked: showAppliedFilter,
            onChange: toggleShowApplied,
            className: 'rounded',
          }),
          'Show Applied'
        ),
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('button', {
            className: 'px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
            onClick: handleExportApplied,
          }, 'Export'),
          React.createElement('button', {
            className: 'px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700',
            onClick: refreshJobLinks,
          }, 'Refresh')
        )
      )
    );
  }

  function JobFormsPanel() {
    const { detectedFields, isScanning, isFilling, fillProgress, showProgress, handleScanClick, handleFillAllClick, handleClearClick } = useApp();

    return React.createElement('div', null,
      React.createElement('div', { className: 'flex gap-2 mb-4' },
        React.createElement('button', {
          className: 'flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50',
          onClick: handleScanClick,
          disabled: isScanning,
        }, isScanning ? 'Scanning...' : 'Scan Page'),
        React.createElement('button', {
          className: 'flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50',
          onClick: handleFillAllClick,
          disabled: isFilling || detectedFields.length === 0,
        }, isFilling ? 'Filling...' : 'Fill All Fields')
      ),
      React.createElement('div', { className: 'mb-4' },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Detected Fields'),
        detectedFields.length === 0
          ? React.createElement('p', { className: 'text-gray-500 text-sm' }, 'No fields detected. Click "Scan Page" to detect form fields.')
          : React.createElement('div', { className: 'space-y-2' },
              detectedFields.map((field, i) => 
                React.createElement('div', { key: i, className: 'p-2 bg-gray-50 rounded text-sm' },
                  React.createElement('strong', null, field.label || field.name || 'Unnamed'),
                  React.createElement('span', { className: 'text-gray-500 ml-2' }, field.type)
                )
              )
            )
      ),
      showProgress && React.createElement('div', { className: 'mb-4' },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Progress'),
        React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
          React.createElement('div', { 
            className: 'bg-blue-600 h-2 rounded-full transition-all',
            style: { width: `${(fillProgress.current / fillProgress.total) * 100}%` }
          })
        ),
        React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, 
          `Filling ${fillProgress.current}/${fillProgress.total} fields...`
        )
      ),
      React.createElement('button', {
        className: 'w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
        onClick: handleClearClick,
      }, 'Clear Indicators')
    );
  }

  function TabButton({ id, active, onClick, children }) {
    return React.createElement('button', {
      className: `flex-1 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        active 
          ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
      }`,
      onClick: () => onClick(id),
    }, children);
  }

  function App() {
    const { activeTab, setActiveTab } = useApp();

    return React.createElement('div', { className: 'w-[480px] min-h-[400px] bg-white' },
      React.createElement('div', { className: 'flex border-b border-gray-200' },
        React.createElement(TabButton, { 
          id: 'links', 
          active: activeTab === 'links', 
          onClick: setActiveTab 
        }, 'Job Links'),
        React.createElement(TabButton, { 
          id: 'forms', 
          active: activeTab === 'forms', 
          onClick: setActiveTab 
        }, 'Job Forms Helper')
      ),
      React.createElement('div', { className: 'p-4' },
        activeTab === 'links' && React.createElement(JobLinksPanel),
        activeTab === 'forms' && React.createElement(JobFormsPanel)
      )
    );
  }

  function initApp() {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      console.error('[App] React not loaded');
      return;
    }
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      React.createElement(AppProvider, null,
        React.createElement(App)
      )
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  window.initApp = initApp;
})();