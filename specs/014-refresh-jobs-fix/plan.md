# Implementation Plan: Refresh Jobs Fix

**Feature Branch**: `014-refresh-jobs-fix`  
**Created**: 2026-03-27  
**Status**: Draft

## Overview

Fix the "Refresh Jobs" button to the extension popup to force fresh data fetch from the API when clicked.

## Implementation Tasks

### T1: Add `forceRefreshJobLinks()` function

**File**: `extension/popup/popup.js`

**Location**: Add new function after `handleRefreshLinksClick()` function

**Changes**:
```diff
------- SEARCH
/**
 * Handle Refresh Jobs button click
 */
async function handleRefreshLinksClick() {
  await loadJobLinks();
}
=======
/**
 * Handle Refresh Jobs button click - force fresh fetch
 */
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}

+++++++ REPLACE
</diff>

### T2: Modify `handleRefreshLinksClick()` to call new function

**Location**: Modify existing function in `extension/popup/popup.js`

**Changes**:
```diff
------- SEARCH
async function handleRefreshLinksClick() {
  await loadJobLinks();
}
=======
async function handleRefreshLinksClick() {
  await forceRefreshJobLinks();
}
+++++++ REPLACE
</diff>

### T3: Add `forceRefreshJobLinks()` function

**File**: `extension/popup/popup.js`

**Location**: Add after `handleRefreshLinksClick()` function

**Code**:
```javascript
/**
 * Force refresh job links - bypass cache and fetch fresh data
 */
async function forceRefreshJobLinks() {
  const btn = elements.refreshLinksBtn;
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Refreshing...';
  showSkeleton();
  
  try {
    const links = await fetchJobOffers();
    jobLinks = links;
    hideLoading();
    const filteredLinks = filterJobLinks(jobLinks, showAppliedFilter);
    renderJobLinksList(filteredLinks);
    await cacheJobOffers();
    updateStaleIndicator(false);
  } catch (err) {
    console.error('[Popup] forceRefreshJobLinks error:', err);
    // If we have cached data, show it with error
    if (jobLinks.length > 0) {
      hideLoading();
      showToggleError('Failed to refresh: ' + err.message);
    } else {
      showJobError('Failed to load jobs: ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
+++++++ REPLACE
</diff>

### T4: Update tests

**File**: `extension/tests/job-links.test.js`

**Add test case**: Test `forceRefreshJobLinks()` function

```javascript
describe('forceRefreshJobLinks', () => {
  let forceRefreshJobLinks;
  let isRefreshing = false;
  
  beforeEach(() => {
    jobLinks = [{ id: 1, title: 'Test Job 1', url: 'http://example.com/1', applied: true }];
    elements.refreshLinksBtn = { disabled: true, textContent: 'Refreshing...' };
    elements.refreshLinksBtn.click();
    await flushPromises();
  });
  
  it('should disable button and show loading state', () => {
    expect(elements.refreshLinksBtn.disabled).toBe(true);
    expect(elements.refreshLinksBtn.textContent).toBe('Refreshing...');
    expect(elements.jobLinksLoading.style.display).toBe('flex');
    expect(elements.jobLinksList.style.display).toBe('none');
    expect(elements.jobLinksError.style.display).toBe('none');
  });
  
  it('should fetch fresh data from API', async () => {
    const links = await forceRefreshJobLinks();
    expect(links).toHaveLength).toBe(1);
    expect(links[0]).toEqual({
      id: 1,
      title: 'Test Job 1',
      url: 'http://example.com/1',
      applied: true,
      pending: false,
      error: false
    });
  });
  
  it('should update UI with fresh data', async () => {
    await forceRefreshJobLinks();
    expect(elements.jobLinksList.innerHTML).toContain('Test Job 1');
    expect(elements.jobLinksList.querySelectorAll('[data-action="toggle"]').toHaveLength).toBe(1);
  });
  
  it('should cache fresh data', async () => {
    await forceRefreshJobLinks();
    const state = await browser.storage.local.get(['jobOffers', 'jobOffersTimestamp']);
    expect(state.jobOffers).toEqual([{
      id: 1,
      title: 'Test Job 1',
      url: 'http://example.com/1',
      applied: true,
      pending: false,
      error: false
    }]);
    expect(state.jobOffersTimestamp).toBeGreaterThan(0);
  });
  
  it('should handle API error gracefully', async () => {
    // Mock fetchJobOffers to reject
    const mockFetch = jest.fn().mockRejected(new Error('Network error'));
    
    await forceRefreshJobLinks();
    
    // Should show error with cached data
    expect(showToggleError).toHaveBeenCalledWith('Failed to refresh');
    // Should show full error without cached data
    expect(showJobError).toHaveBeenCalledWith('Failed to load jobs')
    // Should re-enable button
    expect(elements.refreshLinksBtn.disabled).toBe(false);
    expect(elements.refreshLinksBtn.textContent).toBe('Refresh Jobs')
  });
});
+++++++ REPLACE
</diff>

### T5: Integration test for

**File**: `extension/tests/job-links.test.js`

**Add test case**: Test full refresh flow with API error

```javascript
describe('forceRefreshJobLinks with API error', () => {
  let jobLinks = [{ id: 1, title: 'Cached Job', applied: true }];
  elements.refreshLinksBtn.click();
  
  return flushPromises().then(() => {
    // Should show error with cached data
    expect(showToggleError).toHaveBeenCalledWith('Failed to refresh');
    // Should keep cached data visible
    expect(elements.jobLinksList.innerHTML).toContain('Cached Job')
    // Should re-enable button
    expect(elements.refreshLinksBtn.disabled).toBe(false);
    expect(elements.refreshLinksBtn.textContent).toBe('Refresh Jobs')
  });
});
+++++++ REPLACE
</diff>

<task_progress>
- [x] Analyze the refresh jobs issue in popup.js
- [x] Review background.js message handling for get_JOB_OFFERS
- [x] Identify the root cause
- [x] create spec following GitHub Speckit Framework
- [x] Implement the fix in popup.js
- [ ] Create plan.md
- [ ] Create tasks.md
- [ ] Create research.md
- [ ] Create verification checklist
</task_progress>
</write_to_file>