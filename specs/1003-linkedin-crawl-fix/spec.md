# Feature Specification: Fix LinkedIn Job Crawling in n8n Workflow

**Feature Branch**: `1003-linkedin-crawl-fix`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "debug n8n workflow: @workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts is throwing this error: | [ANTIBOT]. ℹ https://www.linkedin.co...m/jobs/view/4386614529/  | Error: Proxy jobs_crawl4ai | direct failed: Failed on navigating ACS-GOTO: Page.goto: net::ERR_TOO_MANY_REDIRECTS"

## Problem Statement

The n8n workflow "2.Job Offers Research" is failing to crawl LinkedIn job URLs with the error `net::ERR_TOO_MANY_REDIRECTS`. The workflow uses crawl4ai with `enable_stealth: true` and `magic: true`, along with hardcoded `li_at` cookies. The error indicates LinkedIn's anti-bot system is detecting and blocking the automated access.

## Root Cause Analysis

Based on research findings:
1. **Hardcoded cookies are fundamentally flawed** - LinkedIn cookies expire and are IP-bound; hardcoding creates single points of failure
2. **ERR_TOO_MANY_REDIRECTS** - LinkedIn redirects to authentication/challenge pages because it detects suspicious automated access
3. **Stealth/magic mode conflicts** - LinkedIn job pages often redirect incorrectly with aggressive anti-bot settings enabled
4. **No proxy infrastructure** - The system has no residential proxy rotation to avoid IP-based detection
5. **Browser fingerprinting** - LinkedIn uses sophisticated fingerprinting beyond just cookies and IPs

## User Scenarios & Testing

### User Story 1 - Fix Immediate Crawl Failure (Priority: P1)

As a system administrator, I want the workflow to successfully crawl at least one LinkedIn job URL without errors, so that job research continues functioning.

**Why this priority**: Current system is completely broken - zero job descriptions are being extracted.

**Independent Test**: Run the workflow with a single LinkedIn job URL and verify the crawl completes without ERR_TOO_MANY_REDIRECTS error.

**Acceptance Scenarios**:

1. **Given** a valid LinkedIn job URL, **When** the workflow submits a crawl request to crawl4ai, **Then** the crawl status should return "completed" within 90 seconds (not timeout or redirect error)
2. **Given** a successful crawl response, **When** the workflow extracts the job description, **Then** the extracted content should be non-empty and contain job-related text
3. **Given** a crawl failure, **When** the retry logic executes, **Then** it should retry up to 5 times with 30-second delays between attempts

---

### User Story 2 - Implement Robust Anti-Bot Evasion (Priority: P2)

As a system architect, I want a multi-layered anti-bot evasion strategy, so that LinkedIn crawling remains reliable over time without constant maintenance.

**Why this priority**: Single-layer solutions (just cookies or just stealth) fail quickly; production systems need defense in depth.

**Independent Test**: Can be tested by running 10 different LinkedIn job URLs through the workflow and measuring success rate.

**Acceptance Scenarios**:

1. **Given** a pool of 5+ LinkedIn job URLs, **When** the workflow crawls them sequentially, **Then** at least 70% should succeed without manual intervention
2. **Given** a LinkedIn URL that triggers CAPTCHA/challenge, **When** the workflow encounters it, **Then** it should mark the URL as "blocked" in the database rather than retrying indefinitely
3. **Given** proxy rotation being enabled, **When** crawl4ai makes requests, **Then** each request should use a different proxy from the configured pool

---

### User Story 3 - Add Sustainable Cookie/Auth Management (Priority: P3)

As a developer, I want the authentication state to be managed automatically, so that the workflow doesn't require manual cookie rotation every few days.

**Why this priority**: Current hardcoded approach requires constant maintenance; automated solution reduces operational burden.

**Independent Test**: Can be tested by checking that authentication state persists across workflow runs without manual updates.

**Acceptance Scenarios**:

1. **Given** a browser profile with valid LinkedIn session, **When** the workflow runs multiple times, **Then** the session should remain valid for at least 7 days without re-authentication
2. **Given** an expired/invalid session, **When** the workflow detects crawl failure due to auth, **Then** it should log the failure to n8n execution logs for manual review

---

### Edge Cases

- What happens when all proxies in the pool are blocked by LinkedIn?
- How does the system handle LinkedIn showing a CAPTCHA challenge page?
- What when the li_at cookie is expired but still being used?
- How does the system behave when crawl4ai container is unreachable?

## Requirements

### Functional Requirements

- **FR-001**: System MUST successfully crawl LinkedIn job URLs without ERR_TOO_MANY_REDIRECTS errors
- **FR-002**: System MUST implement retry logic with exponential backoff (up to 5 retries, 30-second base delay, escalating to 5-30 seconds on failures)
- **FR-003**: System MUST log detailed error information when crawl fails (error type, HTTP status, redirect chain)
- **FR-004**: System MUST use proxy rotation for production LinkedIn crawling
- **FR-005**: System MUST disable `enable_stealth` and `magic` mode for LinkedIn job URLs (these cause redirect loops)
- **FR-006**: System MUST implement graceful degradation when LinkedIn crawling fails (fallback to alternative data sources or skip gracefully)
- **FR-007**: System MUST validate cookies/auth state before attempting crawl to reduce failure rate
- **FR-008**: System MUST extract job description content from crawl response (support multiple response formats: extracted_content, markdown, data.content)

### Technical Implementation (n8n-as-code skill REQUIRED)

- **FR-009**: Workflow changes MUST be made using n8n-as-code skill (npx n8nac CLI)
- **FR-010**: Before modifying workflow, MUST pull latest version from n8n: `npx n8nac pull <workflow-id>`
- **FR-011**: After making changes, MUST validate workflow: `npx n8nac skills validate <file>`
- **FR-012**: After validation, MUST push with verification: `npx n8nac push <filename> --verify`

### Key Entities

- **Crawl4aiConfig**: Configuration for crawl4ai browser and crawler settings
  - proxy_urls: Array of rotating proxy endpoints
  - browser_config: Browser launch parameters (headless, stealth settings)
  - crawler_config: Crawl behavior parameters (timeout, wait_until, delays)
- **JobOffer**: Job posting record with URL, title, description, status
  - url: LinkedIn/Indeed/Xing job posting URL
  - description: Extracted job description text
  - research_status: pending/completed/failed/blocked

## Success Criteria

### Measurable Outcomes

- **SC-001**: LinkedIn job URLs complete crawling without ERR_TOO_MANY_REDIRECTS errors (target: 70%+ success rate)
- **SC-002**: Workflow successfully extracts job descriptions from at least 5 different LinkedIn job postings in a single run
- **SC-003**: Failed crawls are properly logged with error details (error type, URL, timestamp) for debugging
- **SC-004**: System recovers from transient failures automatically via retry logic (no manual intervention needed for timeout/errors)

### Success Criteria Details

| ID | Criterion | Verification Method |
|----|-----------|-------------------|
| SC-001 | No ERR_TOO_MANY_REDIRECTS in crawl4ai logs | Review docker logs jobs_crawl4ai after workflow run |
| SC-002 | 5+ job descriptions extracted | Query job_offers table for non-empty descriptions |
| SC-003 | Error logging present | Check n8n execution logs for error details |
| SC-004 | Retry logic executes on failure | Verify retry_count increments on failed crawls |

## Implementation Approach

Based on research findings, the recommended implementation:

### Phase 1: Immediate Fix (SC-001)
1. Disable `enable_stealth: true` in browser_config - this causes redirect loops with LinkedIn
2. Disable `magic: true` or set to false - aggressive anti-bot triggers LinkedIn blocks
3. Change `wait_until` from "networkidle" to "load" - networkidle triggers on infinite redirects
4. Add `delay_before_return_html: 2.0` - gives time for legitimate page load

### Phase 2: Proxy Rotation (SC-001, SC-004)
1. Configure proxy_urls in crawl4ai request
2. Use residential proxy pool (datacenter IPs are blocked immediately)
3. Implement proxy rotation per request
4. Add exponential backoff rate limiting (5-30 seconds delays between requests)

### Phase 3: Error Handling (SC-003, SC-004)
1. Add error type detection in workflow (redirect vs timeout vs auth failure)
2. Implement conditional retry based on error type
3. Add alerting for blocked/captcha URLs

### Phase 4: Long-term Auth (SC-004)
1. Implement cookie refresh mechanism to refresh li_at cookie before each workflow run
2. Store cookies in environment variables or secure storage
3. Add validation check before crawl to verify cookie validity

## Clarifications

### Session 2026-03-24

- Q: Proxy infrastructure approach → A: Use crawl4ai's built-in PROXIES environment variable with RoundRobinProxyStrategy (simplest, start quickly)
- Q: Long-term authentication approach → A: Cookie refresh mechanism - implement workflow to refresh li_at cookie before each run
- Q: Performance target for crawl timeout → A: 90 seconds per URL (more reliable but slower)
- Q: Rate limiting strategy → A: Add exponential backoff on failures with longer delays (5-30 seconds)
- Q: Error alerting method → A: Log only to n8n execution logs (simplest, requires manual monitoring)

## Assumptions

- LinkedIn job URLs being crawled are public (not requiring login to view)
- Proxy infrastructure will use crawl4ai's built-in proxy rotation via PROXIES environment variable
- n8n instance is accessible at http://localhost:5678 for workflow updates

## Dependencies

- crawl4ai container running and accessible at http://crawl4ai:11235
- PostgreSQL database with job_offers and job_offers_process tables
- Residential proxy service (Bright Data, Oxylabs, or similar)

## Out of Scope

- LinkedIn profile/connection scraping (only job descriptions)
- Real-time LinkedIn login/authentication flow
- CAPTCHA solving automation
