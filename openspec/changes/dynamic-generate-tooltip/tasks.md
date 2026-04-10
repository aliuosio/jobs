## 1. Backend Implementation

- [x] 1.1 Add endpoint `GET /job-offers/{id}/letter-status` in src/api/routes.py
- [x] 1.2 Implement query to check letter existence (using job_offers_process or create simple check)
- [x] 1.3 Return boolean: `{ "letter_generated": true/false }`

## 2. Extension - API Client

- [x] 2.1 Add `checkLetterStatus(jobId)` function in extension/services/api-service.js
- [x] 2.2 Call new endpoint and return boolean

## 3. Extension - Hover Handler

- [x] 3.1 Add hover event listener to Generate buttons in setupClEventListeners()
- [x] 3.2 Implement tooltip fetch with caching (memoize by jobId)
- [x] 3.3 Update tooltip on mouseover with database result

## 4. Fallback Behavior

- [x] 4.1 If API fails, fall back to current cl_status logic
- [x] 4.2 Handle network errors gracefully without breaking UI

## 5. Testing

- [x] 5.1 Backend tests written and passing (test_letter_status.py)