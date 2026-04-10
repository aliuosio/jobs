## Why

The Firefox extension popup is not displaying job offers at all - no jobs shown, no console messages, no error states. Users see an empty "No job links available" message even though the backend API returns 191 job offers. This breaks the core functionality of the Job Links Manager.

## What Changes

- Fix the job loading flow in popup.js to properly fetch and display jobs from the API
- Add proper error handling and logging to diagnose why init() is not executing
- Create unit tests in extension/tests/ that properly mock the browser API with realistic job data
- Ensure the extension tests cover the full flow: init() → loadCachedJobLinks() → fetchJobOffers() → renderJobLinksList()

### Breaking Changes
- None

## Capabilities

### New Capabilities
- `job-loading-fix`: Fix the job loading logic to properly fetch and display job offers from the backend API
- `extension-unit-tests`: Add proper unit tests for the popup job loading functionality with correct browser API mocking

### Modified Capabilities
- None (existing capabilities remain unchanged)

## Impact

- **Files Modified**:
  - `extension/popup/popup.js` - Fix init(), loadCachedJobLinks(), forceRefreshJobLinks(), fetchJobOffers()
  - `extension/background/background.js` - Ensure GET_JOB_OFFERS handler works correctly
  - `extension/tests/job-links.test.js` - Add tests with proper mocks
- **Dependencies**: None new required
- **Systems**: Firefox extension popup, Backend API at localhost:8000