## Context

The Firefox extension popup (`popup.js`) should display job offers from the backend API. Currently, users see "No job links available" even though:
- Backend API at localhost:8000 returns 191 job offers
- SSE connection is established in background.js
- No console errors appear in the browser inspector

Current flow:
```
init() 
  → loadCachedJobLinks() 
    → isCacheValid() + browser.storage.local.get('jobOffers')
    → if no cache → forceRefreshJobLinks()
      → fetchJobOffers() → browser.runtime.sendMessage({type: 'GET_JOB_OFFERS'})
        → background.js handleGetJobOffers()
        → returns {success: true, job_offers: [...]}
    → renderJobLinksList()
```

## Goals / Non-Goals

**Goals:**
- Fix popup to display job offers on open
- Add proper error handling to diagnose failures
- Create unit tests that properly mock browser API with realistic data
- Verify the full flow: init() → fetch → render

**Non-Goals:**
- Refactor other extension functionality
- Modify backend API
- Add new features beyond job loading

## Decisions

### 1. Debug Strategy
**Decision**: Add console.log at the START of init() to verify execution
- **Rationale**: If no console messages appear, init() is not being called at all
- **Alternative**: Check browser console filter settings (not code issue)

### 2. Mock Data for Tests
**Decision**: Tests must return realistic job data in mock storage
- Current mock returns `{}` which always triggers no-cache path
- Fix: `storage.local.get = async (key) => { if (key === 'jobOffers') return { jobOffers: [...] } }`
- **Rationale**: Tests need to verify cache-hit path, not just cache-miss

### 3. Error Handling
**Decision**: Wrap init() in try-catch with console.error, show user feedback on failure
- **Rationale**: Silent failures prevent diagnosis; error message gives user feedback

## Risks / Trade-offs

- **Risk**: Tests run in Node.js, not real browser - mock may not match actual browser API
  - **Mitigation**: Test logic flow, not DOM interactions; verify function calls

- **Risk**: Browser storage may have different format than mock expects
  - **Mitigation**: Store actual job structure (id, title, url, process.applied)

- **Risk**: race condition between cache load and background fetch
  - **Mitigation**: Show cached data first, then update with fresh data

## Open Questions

1. Is `browser.runtime.sendMessage` reaching background.js? Need verification.
2. Is `handleGetJobOffers` returning correct format? Need verification.
3. Is `renderJobLinksList` correctly receiving and rendering the data? Need verification.