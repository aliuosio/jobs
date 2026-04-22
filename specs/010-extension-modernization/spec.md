# Feature Specification: Extension Modernization

**Feature Branch**: `010-extension-modernization`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "Migrate existing imperative JavaScript/HTML codebase from /extension to modern React-based architecture in /extension directory. Improve maintainability, developer velocity, and UI consistency while optimizing data fetching via TanStack Query. Create new docker service in docker-compose.yml for the new extension and map extension code as volume."

## Clarifications

### Session 2026-04-22

- Q: Scope of Porting - Which parts of the extension should be migrated to React in extension? → A: All components (Popup UI, Content Scripts, Background Scripts)
- Q: API Endpoints - Should the migration use the existing API endpoints from the legacy extension, or are new endpoints expected? → A: Both (progressive migration) - Start with existing, migrate to new as needed
- Q: Observability - Should the new extension include observability features (logging, error tracking, metrics)? → A: Console-based logging with level filtering (debug/info/warn/error) for observability
- Q: Popup ↔ Content Script Communication - How will the Popup UI communicate with Content Scripts for form detection/filling? → A: chrome.runtime.sendMessage - Direct message passing between popup and content scripts
- Q: Testing Strategy - How should testing be approached given extension complexity? → A: Hybrid - Vitest for React components/hooks + manual extension verification in Firefox
- Q: Logging Framework - What observability implementation should be used? → A: Console-based logging with level filtering (debug, info, warn, error) - simple, no persistence needed
- Q: Cache Limits - What TanStack Query cache configuration should be used? → A: Minimal - staleTime: 1min, gcTime: 1hr to conserve extension memory
- Q: Accessibility - What accessibility requirements should the extension support? → A: Minimal - React default accessibility (basic ARIA, keyboard support)
- Q: Security Model - What security model should the extension use? → A: Unauthenticated local tool - No auth required, extension runs locally with browser permissions
- Q: Data Scale - What is the expected scale of job data the extension should handle? → A: Light use - Up to 100 job links, infrequent API calls
- Q: Out-of-Scope - What features should NOT be included in this migration? → A: Migration only - No new features beyond /extension parity
- Q: User Personas - Are there different user types for this extension? → A: Single user - Individual job seeker
- Q: Browser Target - Should the extension support Chrome as well as Firefox? → A: Firefox-only (no Chrome support) - simplifies build process
- Q: Build System - Should we use @crxjs/vite-plugin for extension builds? → A: No - use simple Vite build with custom script to copy manifest.json to dist/ (Firefox-only doesn't need Chrome tooling)
- Q: TDD tests not implemented - Constitution III violation? → A: Implement Vitest tests with TDD cycle before Phase 7
- Q: Only one final verification task - too coarse? → A: Add granular verification per user story acceptance criteria
- Q: Dockerfile Setup - Custom Dockerfile or pure docker-compose? → A: No custom Dockerfile - use docker-compose command

### User Personas

- **Primary User**: Individual job seeker managing personal job applications
- **Role**: Single-user local extension (no multi-user features)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Development Environment Setup (Priority: P1)

As a developer, I want a fully configured development environment so that I can start working on the extension immediately after cloning the repository.

**Why this priority**: Without a working development environment, no further work can proceed. This is the foundational requirement.

**Independent Test**: Run `docker-compose up -d extension` and verify the Vite dev server starts on the mapped port. Can be verified by accessing the dev server URL.

**Acceptance Scenarios**:

1. **Given** Docker Compose is running, **When** I start the extension service, **Then** the Vite dev server starts successfully and serves the React app
2. **Given** The extension container is running, **When** I modify a source file, **Then** changes hot-reload within seconds
3. **Given** The extension container is running, **When** I access the app in a browser, **Then** the React application renders correctly

---

### User Story 2 - Component Porting (Priority: P2)

As a developer, I want all existing extension UI components ported to React so that the new codebase maintains feature parity with the existing extension.

**Why this priority**: Core functionality must be preserved during the migration. This ensures users don't lose existing features.

**Independent Test**: Load both old and new extension UIs side by side and verify identical UI elements are present. Can be verified by visual comparison.

**Acceptance Scenarios**:

1. **Given** The extension React app is running, **When** I load the popup/UI, **Then** all UI elements from the original extension are present
2. **Given** The extension React app is running, **When** I interact with form fields, **Then** data flows correctly through the React state
3. **Given** The extension React app is running, **When** I navigate between views, **Then** the UI transitions smoothly without page reloads

---

### User Story 3 - Data Layer Modernization (Priority: P3)

As a developer, I want all API calls handled through TanStack Query so that caching, loading states, and automatic retries work out of the box.

**Why this priority**: The original codebase uses manual fetch calls with global variables for caching. Modernizing this improves performance and reduces bugs.

**Independent Test**: Trigger API calls and verify caching works by observing network tab - repeated requests should be served from cache. Can be verified by checking network requests.

**Acceptance Scenarios**:

1. **Given** TanStack Query is configured, **When** I make an API call, **Then** the response is cached and subsequent calls return cached data
2. **Given** TanStack Query is configured, **When** an API request fails, **Then** automatic retry occurs up to configured limit
3. **Given** TanStack Query is configured, **When** I navigate away and back, **Then** data is instantly available from cache (if not stale)

---

### User Story 4 - Docker Integration (Priority: P4)

As a developer, I want the new extension service running in Docker so that it integrates with the existing infrastructure.

**Why this priority**: The project uses Docker for all services. Maintaining consistency with the existing architecture is important for operations.

**Independent Test**: Run `docker-compose ps` and verify extension service is listed and running. Can be verified with Docker commands.

**Acceptance Scenarios**:

1. **Given** docker-compose.yml, **When** I run `docker-compose up -d extension`, **Then** the new service starts successfully
2. **Given** The extension service is running, **When** I check the logs, **Then** no errors are present in the output
3. **Given** The extension service is running, **When** I access the mapped volume directory, **Then** changes in the host directory are reflected in the container

---

### Edge Cases

- What happens when the backend API is unavailable? - Should show appropriate error state in UI
- How does the extension handle large amounts of cached data? - Should implement proper cache limits
- What happens during hot reload when there's a syntax error? - Should display error overlay, not crash

### Out of Scope

- **Authentication features** - Not adding any login/signup flows
- **Cloud sync** - No cloud backup or cross-device sync
- **New data sources** - Only existing backend API integration
- **E2E automation** - Not automating job application submission
- **Browser tabs** - No tab management beyond popup

### Communication Architecture

- **Popup ↔ Content Scripts**: chrome.runtime.sendMessage for direct message passing (e.g., scan page, fill fields commands)
- **Popup ↔ Background**: chrome.runtime.sendMessage with background as message hub
- **Content ↔ Background**: Persistent connection via chrome.runtime.connect for real-time updates

### Logging & Observability

- **Logger**: Console-based logger with levels (debug, info, warn, error)
- **Storage**: No persistence required (simple logging only)
- **Error tracking**: Uncaught errors logged with stack traces and context via console.error

### Security

- **Authentication**: None required - unauthenticated local tool
- **Permissions**: Uses browser extension permissions (storage, activeTab, scripting)
- **Data at Rest**: No sensitive data stored locally
- **Network**: Direct communication to backend API on localhost

### Docker Configuration

- **Image**: `node:24.15.0-alpine3.23` (no Dockerfile, all instructions in docker-compose)
- **Container Instructions**: Install dependencies via docker-compose `command` or `entrypoint`
- **Working Directory**: `/app`
- **Port**: 5173 (Vite dev server)
- **Volume**: Map `./extension/src:/app/src` and `./extension/public:/app/public`
- **Build**: No custom Dockerfile - uses docker-compose `command` to install and run

### TanStack Query Configuration

- **staleTime**: 60000ms (1 minute)
- **gcTime**: 1 hour
- **retry**: 3 attempts with exponential backoff
- **refetchInterval**: Disabled by default (manual refresh only)

### Data Volume & Scale

- **Expected job links**: Up to 100 (light use per user)
- **API call frequency**: Infrequent (manual triggers, not polling)
- **Storage limits**: chrome.storage.local (extension quota applies)

### Accessibility

- Basic ARIA labels on interactive elements
- Keyboard navigation support (React default)
- Focus management via React patterns

### Testing Strategy

- **Unit Tests**: Vitest for React components and custom hooks
- **Integration**: Manual verification in Firefox using about:debugging
- **E2E**: Optional Playwright for critical user flows (deferred)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The new extension directory MUST contain a fully functional Vite + React project
- **FR-002**: The React application MUST render all UI components that exist in the original /extension directory
- **FR-003**: TanStack Query MUST handle all API data fetching with automatic caching
- **FR-004**: Docker Compose MUST include a new service for extension with volume mapping
- **FR-005**: Hot module replacement MUST work for development with less than 3 second reload time
- **FR-006**: Tailwind CSS MUST be configured and working for all styling
- **FR-007**: The extension app MUST be buildable for production with optimized bundle

### Key Entities

- **React Application**: The main React 19 application in /extension (includes Popup UI, Content Scripts, Background Scripts)
- **TanStack Query Client**: Provider and hooks for API data management
- **Docker Service**: The new containerized service for extension
- **Component Library**: Reusable React components ported from original extension

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can start the extension development environment with a single docker-compose command in under 2 minutes
- **SC-002**: All original extension features are preserved - no feature regression
- **SC-003**: Hot reload reflects code changes within 3 seconds
- **SC-004**: API responses are cached, reducing redundant network requests by at least 80%
- **SC-005**: Bundle size for production build is optimized (target: under 500KB gzipped for main application)

## Implementation Notes

### Code Review Findings (2026-04-22)

> **See Analysis Recommendations section for active issues requiring remediation.**

#### Positive Observations

- Clean separation: Components, hooks, services, types in distinct directories
- TypeScript throughout with proper interfaces
- TanStack Query configured with provider pattern
- Error boundary component included
- No anti-patterns (no `as any`, no empty catch blocks) per Constitution Section I
- Query key pattern centralized in queryClient.ts
- API service has proper error handling
- Uses `node:24.15.0-alpine3.23` - latest Node.js LTS per Constitution Section V
- No separate Dockerfile - docker-compose handles all (Constitution Section V compliant)

---

## Assumptions

- The original /extension directory will remain functional during migration (no breaking changes)
- The backend API endpoints remain stable and compatible
- Developers have Docker and Docker Compose installed
- TypeScript is acceptable for the new codebase (as recommended in the feature description)
- The migration will be done incrementally, maintaining backward compatibility with the original extension
- **Firefox-only extension** (Chrome compatibility not required) - simplifies build process
- Build uses simple Vite build with custom script to copy manifest (no @crxjs/vite-plugin needed)
- Console-based logging with level filtering for observability (no persistence required)

---

## Analysis Recommendations

> **Analysis Date**: 2026-04-22  
> **Constitution Version**: 0.4.0  
> **Source**: `/speckit.analyze` cross-artifact validation

### Critical Issues (MUST FIX)

| ID | Issue | Constitution Violation | Fix Required | Status |
|----|-------|---------------------|---------------------|---------------|--------|
| CR-2 | T039: staleTime is 60min instead of 1min | II. Design Pattern: Follow documented spec | Fix staleTime to 60000ms in queryClient.ts | ✅ RESOLVED |
| CR-3 | queryClient retry is 1, spec requires 3 | II. Design Pattern: Follow spec retry: 3 | Change retry: 1 to retry: 3 in queryClient.ts | 🔴 TO FIX |

### Medium Issues (SHOULD FIX)

| ID | Issue | Recommendation | Status |
|----|-------|----------------|---------------|--------|
| M-1 | Constitution Check shows "TDD: PARTIAL" | Add Vitest tests for TDD compliance per III. TDD | ⏳ IN PROGRESS |
| M-2 | index.css properly staged | ✅ Already present with @tailwind directives | ✅ RESOLVED |

### Review Findings (2026-04-22)

From staged code review:

| Issue | Severity | File | Fix |
|-------|----------|------|-----|
| retry: 1 instead of 3 | Medium | queryClient.ts line 83 | Change to retry: 3 |
| index.css present | ✅ No fix needed | src/index.css | Already has @tailwind directives |

### Test Requirements (Section III - TDD)

| Test Item | File Path | Notes |
|----------|---------|-------|
| Config | `extension/vitest.config.ts` | Vitest configuration |
| Setup | `extension/tests/setup.ts` | chrome.* mocks |
| Hook Tests | `extension/tests/hooks/*.test.ts` | useJobsQuery, useProfileQuery, etc. |
| Service Tests | `extension/tests/services/api.test.ts` | API client tests |
| Component Tests | `extension/tests/components/*.test.tsx` | Button, etc. |

### Constitution Alignment (VERIFIED)

| Principle | Status | Notes |
|------------|--------|-------|
| I. SOLID/DRY | ✅ PASS | React functional components follow single responsibility |
| II. Design Patterns | ✅ PASS | Uses provider pattern for TanStack Query |
| III. TDD | ⚠️ PARTIAL | Vitest available, need tests for code compliance |
| V. Docker-Based | ✅ PASS | Using node:24.15.0-alpine3.23 |

### Recommended Remediation Sequence

1. ✅ **RESOLVED**: Fix T039 staleTime (queryClient.ts line 81: changed to `60 * 1000`)
2. ⏳ **DEFERRED**: T005 crxjs plugin - requires Docker volume/permission fix before implementation
3. **Before Phase 7 completion**: Add Vitest tests for React components to satisfy TDD

### Constitution Compliance Notes

Per **Section III (TDD)**: The plan shows "PARTIAL" because no test files exist yet. This is acceptable for Phase 1-6 but Phase 7 MUST include tests before completion.

Per **Section V (Docker-Based)**: docker-compose.yml correctly uses `node:24.15.0-alpine3.23` without separate Dockerfile - compliant.

---

### Test Requirements (Constitution Section III - TDD)

Per Constitution Section III (TDD), the following tests MUST be implemented before Phase 7 completion:

#### Vitest Configuration

| File | Purpose | Status |
|------|---------|--------|
| `extension/vitest.config.ts` | Vitest configuration with React testing | ⏳ TODO |
| `extension/tests/setup.ts` | Test environment setup (chrome.\* mocks) | ⏳ TODO |

#### Unit Test Files Required

| Test File | Target | Coverage |
|-----------|--------|----------|
| `extension/tests/hooks/useJobsQuery.test.ts` | useJobsQuery hook | Query behavior, loading, error, success states |
| `extension/tests/hooks/useProfileQuery.test.ts` | useProfileQuery hook | Query behavior, loading, error, success states |
| `extension/tests/lib/queryClient.test.ts` | queryClient configuration | staleTime, gcTime, retry settings |
| `extension/tests/lib/logger.test.ts` | Logger utility | log levels, formatting |
| `extension/tests/components/Button.test.tsx` | Button component | Rendering, variants, disabled state |
| `extension/tests/services/api.test.ts` | API service | getJobOffers, getProfile, detectFields, fillFields |

#### Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

#### Constitution Compliance Notes

Per Constitution **Section III (TDD)**:
- All tests follow Red-Green-Refactor cycle
- Tests use Vitest (as specified in spec.md Testing Strategy)
- No `@crxjs/vite-plugin` import error affects tests - run outside Docker for test execution
- Tests are MANDATORY before PR merge