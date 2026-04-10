## 1. Debug and Diagnose

- [ ] 1.1 Add console.log at very start of init() in popup.js to verify execution
- [ ] 1.2 Reload extension and open popup to check for console messages
- [ ] 1.3 Verify init() is being called and trace where it fails

## 2. Fix popup.js Job Loading

- [ ] 2.1 Fix loadCachedJobLinks() to return proper object structure {hasData, needsRefresh}
- [ ] 2.2 Fix init() to properly handle cacheResult and trigger forceRefreshJobLinks()
- [ ] 2.3 Add logging to fetchJobOffers() to verify message to background
- [ ] 2.4 Add logging to renderJobLinksList() to verify data rendering

## 3. Fix background.js Handler (if needed)

- [ ] 3.1 Verify handleGetJobOffers() returns correct format
- [ ] 3.2 Ensure browser.runtime.onMessage listener is set up correctly

## 4. Create Unit Tests (TDD)

- [ ] 4.1 Update extension/tests/job-links.test.js with proper mock data
- [ ] 4.2 Add mock that returns realistic job offers in storage
- [ ] 4.3 Add tests for isCacheValid() function
- [ ] 4.4 Add tests for loadCachedJobLinks() with and without cache
- [ ] 4.5 Add tests for init() flow with mocked dependencies
- [ ] 4.6 Add tests for fetchJobOffers() response handling

## 5. Verify and Test

- [ ] 5.1 Run unit tests: node extension/tests/job-links.test.js
- [ ] 5.2 Test manually: open popup and verify jobs display
- [ ] 5.3 Test error case: what shows when API fails but cache exists
- [ ] 5.4 Test cache expiry: verify stale indicator shows after 30 min