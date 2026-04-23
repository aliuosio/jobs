(function() {
  'use strict';

  const CACHE_TTL_MS = 30 * 60 * 1000;
  const STORAGE_KEYS = {
    JOB_OFFERS: 'jobOffers',
    JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp',
  };

  async function isCacheValid(browserStorage) {
    browserStorage = browserStorage || (typeof browser !== 'undefined' && browser.storage && browser.storage.local);
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
    browserStorage = browserStorage || (typeof browser !== 'undefined' && browser.storage && browser.storage.local);
    if (!browserStorage) return null;
    try {
      const result = await browserStorage.get(STORAGE_KEYS.JOB_OFFERS);
      return result.jobOffers || null;
    } catch (e) {
      return null;
    }
  }

  async function setCachedLinks(links, browserStorage) {
    browserStorage = browserStorage || (typeof browser !== 'undefined' && browser.storage && browser.storage.local);
    if (!browserStorage) return;
    try {
      await browserStorage.set({
        [STORAGE_KEYS.JOB_OFFERS]: links,
        [STORAGE_KEYS.JOB_OFFERS_TIMESTAMP]: Date.now(),
      });
    } catch (e) {}
  }

  async function fetchJobOffersFromBackground() {
    const response = await browser.runtime.sendMessage({ type: 'GET_JOB_OFFERS' });
    if (!response.success) throw new Error(response.error?.message || 'Failed to fetch');
    return response.job_offers || [];
  }

  async function updateAppliedStatus(jobId, applied) {
    const response = await browser.runtime.sendMessage({
      type: 'UPDATE_APPLIED',
      data: { job_offer_id: jobId, applied },
    });
    if (!response.success) throw new Error(response.error?.message || 'Failed to update');
    return response;
  }

  const { createContext, useContext, useState, useCallback, useEffect, useRef } = React;

  const JobLinksContext = createContext(null);

  function useJobLinks() {
    const context = useContext(JobLinksContext);
    if (!context) throw new Error('useJobLinks must be used within JobLinksProvider');
    return context;
  }

  function JobLinksProvider({ children }) {
    const [jobLinks, setJobLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStale, setIsStale] = useState(false);
    const pendingRefs = useRef({});

    const loadJobLinks = useCallback(async () => {
      setLoading(true);
      setError(null);
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
        setError(err.message || 'Failed to load job links');
      } finally {
        setLoading(false);
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
        setError('Failed to update status');
      } finally {
        pendingRefs.current[jobId] = false;
      }
    }, [jobLinks]);

    useEffect(() => { loadJobLinks(); }, [loadJobLinks]);

    const value = { jobLinks, loading, error, isStale, loadJobLinks, toggleApplied };

    return React.createElement(JobLinksContext.Provider, { value },
      children
    );
  }

  function LoadingSpinner() {
    return React.createElement('div', { className: 'flex justify-center py-8' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
    );
  }

  function ErrorUI({ error, onRetry }) {
    return React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-4 text-center' },
      React.createElement('p', { className: 'text-red-600 mb-3' }, error || 'Failed to load jobs'),
      React.createElement('button', {
        className: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors',
        onClick: onRetry,
      }, 'Retry')
    );
  }

  function EmptyState() {
    return React.createElement('div', { className: 'text-center py-8 text-gray-500' },
      React.createElement('p', null, 'No job links available.')
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
    const hasError = link.error;

    const baseClass = isApplied ? 'bg-red-500' : 'bg-green-500';
    const pendingClass = isPending ? 'opacity-50' : '';
    const errorClass = hasError ? 'ring-2 ring-red-300' : '';

    const label = isPending ? 'Updating...' : (isApplied ? 'Applied' : 'Not applied');
    const title = isPending ? 'Updating...' : (isApplied ? 'Click to mark as not applied' : 'Click to mark as applied');

    return React.createElement('span', {
      className: `inline-block w-4 h-4 rounded-full ${baseClass} ${pendingClass} ${errorClass} cursor-pointer transition-all hover:scale-110`,
      role: 'button',
      'aria-label': label,
      title: title,
      'data-action': 'toggle',
      'data-job-id': link.id,
      onClick: () => !isPending && onToggle(link.id),
    });
  }

  function JobLinkItem({ link, onToggle }) {
    return React.createElement('div', {
      className: 'flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors',
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
    const { jobLinks, loading, error, isStale, loadJobLinks, toggleApplied } = useJobLinks();

    if (loading && jobLinks.length === 0) {
      return React.createElement(LoadingSpinner);
    }

    if (error && jobLinks.length === 0) {
      return React.createElement(ErrorUI, { error, onRetry: loadJobLinks });
    }

    return React.createElement('div', { className: 'job-links-panel' },
      isStale && React.createElement(StaleIndicator),
      jobLinks.length === 0
        ? React.createElement(EmptyState)
        : React.createElement('div', { className: 'space-y-2' },
            jobLinks.map(link => React.createElement(JobLinkItem, {
              key: link.id,
              link,
              onToggle: toggleApplied,
            }))
          )
    );
  }

  function initJobLinks() {
    const rootElement = document.getElementById('job-links-root');
    if (!rootElement) return;
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      console.error('[JobLinks] React not loaded');
      return;
    }
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      React.createElement(JobLinksProvider, null,
        React.createElement(JobLinksPanel)
      )
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJobLinks);
  } else {
    initJobLinks();
  }

  window.initJobLinks = initJobLinks;
})();