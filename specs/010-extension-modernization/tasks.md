---

description: "Task list for Extension Modernization feature"
---

# Tasks: Extension Modernization

**Input**: Design documents from `/specs/010-extension-modernization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Hybrid - Vitest for React components/hooks + manual extension verification (per clarifications)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize extension project structure

- [x] T001 Create extension directory structure in jobs/extension/ with src/, public/, dist/, tests/ subdirectories
- [x] T002 [P] Initialize package.json with dependencies: react, react-dom, @tanstack/react-query, vite, typescript, @tailwindcss/vite, tailwindcss, autoprefixer, web-ext (Firefox-only: no @crxjs/vite-plugin needed)
- [x] T003 [P] Configure TypeScript in extension/tsconfig.json with React 19, DOM, extension environment
- [x] T004 [P] Configure ESLint in extension/.eslintrc.cjs for React/TypeScript extension development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work begins until Phase 2 is complete

- [x] T005 [P] [US1] Create Vite config in extension/vite.config.ts (Firefox-only: simple Vite build, no @crxjs needed)
- [x] T006 [P] Configure Tailwind CSS in extension/tailwind.config.ts with safelist for dynamic classes
- [x] T007 Set up QueryClient in extension/src/lib/queryClient.ts with extension-appropriate environment (staleTime: 1min, gcTime: 1hr)
- [x] T008 [P] Create manifest.json in extension/public/manifest.json with Manifest V3, Firefox-specific settings (browser_specific_settings for gecko, no Chrome prefixes)
- [x] T009 Create extension types in extension/src/types/index.ts for JobLink, FormField, UserProfile, APIResponse

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Development Environment Setup (Priority: P1) 🎯 MVP

**Goal**: Fully configured development environment with Docker support

**Independent Test**: Run `docker-compose up -d extension` and verify Vite dev server starts

### Implementation for User Story 1

- [x] T010 [P] [US1] Add extension service to docker-compose.yml with volume mapping for extension/src
- [x] T011 [US1] Configure Vite dev server in vite.config.ts with HMR on mapped port for Firefox extension
- [x] T012 [US1] Update docker-compose.yml to use image: node:24.15.0-alpine3.23 with command: sh -c "npm install && npm run dev"
- [x] T013 [US1] Create main React entry point in extension/src/main.tsx
- [x] T014 [US1] Create base App component in extension/src/App.tsx with QueryClientProvider

**Checkpoint**: User Story 1 complete - Development environment functional

---

## Phase 4: User Story 2 - Component Porting (Priority: P2)

**Goal**: All existing extension UI components ported to React with feature parity

**Independent Test**: Load both old and new extension UIs side by side and verify identical UI elements

### Implementation for User Story 2

- [x] T015 [P] [US2] Analyze existing extension/popup/ components and document required UI elements
- [x] T016 [P] [US2] Analyze existing extension/content/ components for field detection UI
- [x] T017 [US2] Create TabNavigation component in extension/src/components/TabNavigation.tsx
- [x] T018 [US2] Create JobLinksTab component in extension/src/components/tabs/jobLinksTab.tsx
- [x] T019 [US2] Create FormsHelperTab component in extension/src/components/tabs/formsHelperTab.tsx
- [x] T020 [US2] Create Button component in extension/src/components/ui/button.tsx
- [x] T021 [US2] Create Loading component in extension/src/components/ui/loading.tsx
- [x] T022 [US2] Create ErrorBoundary component in extension/src/components/errorBoundary.tsx
- [x] T023 [US2] Port DescriptionModal from legacy extension in extension/src/components/modal/descriptionModal.tsx
- [x] T024 [US2] Port FieldsList component in extension/src/components/forms/fieldsList.tsx
- [x] T025 [US2] Connect tab switching logic in App.tsx with useState

**Checkpoint**: User Story 2 complete - All UI components ported

---

## Phase 5: User Story 3 - Data Layer Modernization (Priority: P3)

**Goal**: All API calls handled through TanStack Query with caching

**Independent Test**: Trigger API calls and verify caching - repeated requests served from cache

### Implementation for User Story 3

- [x] T026 [P] [US3] Create API service layer in extension/src/services/api.ts for localhost:8000
- [x] T027 [P] [US3] Create useJobsQuery hook in extension/src/hooks/useJobsQuery.ts
- [x] T028 [P] [US3] Create useProfileQuery hook in extension/src/hooks/useProfileQuery.ts
- [x] T029 [P] [US3] Create useDetectFields mutation in extension/src/hooks/useDetectFields.ts
- [x] T030 [P] [US3] Create useFillFields mutation in extension/src/hooks/useFillFields.ts
- [x] T031 [US3] Create simple console-based logger in extension/src/lib/logger.ts with debug/info/warn/error levels (no persistence)
- [x] T032 [US3] Implement chrome.storage.local persistence for QueryClient
- [x] T033 [US3] Connect TanStack Query hooks to UI components
- [x] T034 [US3] Add loading and error states to all components

**Checkpoint**: User Story 3 complete - Data layer modernized

---

## Phase 6: User Story 4 - Docker Integration (Priority: P4)

**Goal**: Extension service running in Docker with existing infrastructure

**Independent Test**: Run `docker-compose ps` verify extension service listed and running

### Implementation for User Story 4

- [x] T035 [P] [US4] Delete extension/Dockerfile and extension/Dockerfile.dev (not needed - using docker-compose)
- [x] T036 [US4] Verify docker-compose service starts without errors using node:24.15.0-alpine3.23
- [x] T037 [US4] Test volume mapping reflects host changes in container
- [x] T038 [US4] Verify production build generates valid extension manifest

**Checkpoint**: User Story 4 complete - Docker integration verified

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, testing, optimization

- [x] T039 [P] Fix queryClient.ts staleTime: change from 60*60*1000 to 60000 (1 minute per Constitution II. Design Pattern)

### TDD Test Implementation (Constitution Section III - REQUIRED)

> **IMPORTANT**: Tests MUST be written before PR merge per spec.md requirements

#### Test Configuration

- [x] T040 [P] Create vitest.config.ts in extension/vitest.config.ts with React 19 testing
- [x] T041 [P] Create test setup with chrome.* mocks in extension/tests/setup.ts

#### Hook Tests (Write Failing Test First, Then Implement)

- [x] T042 [P] [US3] Write failing test for useJobsQuery hook in extension/tests/hooks/useJobsQuery.test.ts
- [x] T043 [P] [US3] Write failing test for useProfileQuery hook in extension/tests/hooks/useProfileQuery.test.ts
- [x] T044 [US3] Implement useJobsQuery hook to pass test in extension/src/hooks/useJobsQuery.ts (T042)
- [x] T045 [US3] Implement useProfileQuery hook to pass test in extension/src/hooks/useProfileQuery.ts (T043)

#### Service Tests

- [x] T046 [P] [US3] Write failing test for api service in extension/tests/services/api.test.ts
- [x] T047 [US3] Implement error handling in api service to pass test in extension/src/services/api.ts (T046)

#### Component Tests

- [x] T048 [P] [US2] Write failing test for Button component in extension/tests/components/Button.test.tsx
- [x] T049 [P] [US2] Write failing test for Input component in extension/tests/components/Input.test.tsx
- [x] T050 [US2] Implement Button variant support to pass test in extension/src/components/ui/button.tsx (T048)
- [x] T051 [US2] Implement Input validation to pass test in extension/src/components/ui/input.tsx (T049)

#### Logger Tests

- [x] T052 [P] [US3] Write failing test for logger utility in extension/tests/lib/logger.test.ts (console-based, no persistence)
- [x] T053 [US3] Implement logger levels to pass test in extension/src/lib/logger.ts (T052)

#### QueryClient Tests

- [x] T054 [P] [US3] Write failing test for queryClient configuration in extension/tests/lib/queryClient.test.ts
- [x] T055 [US3] Verify queryClient settings match spec (staleTime: 60000ms, gcTime: 1hr, retry: 3)

### Communication & Build

- [x] T058 [P] Implement chrome.runtime.sendMessage communication for Popup ↔ Content Scripts
- [x] T059 [P] Add background script in extension/src/background/index.ts
- [x] T060 Add content script entry in extension/src/content/index.ts
- [x] T061 Run ESLint and fix all errors/warnings
- [x] T062 Optimize production bundle - verify under 500KB gzipped

### Final Verification

- [x] T063 Verify all user story acceptance scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3 → P4) or parallel if staffed
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational - Builds on TanStack Query (Phase 2)
- **User Story 4 (P4)**: Requires US1 (Docker service defined)

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- User Stories 1, 2, 3 can start in parallel once Foundational completes
- Component creation marked [P] can run in parallel in US2
- Hook creation marked [P] can run in parallel in US3

---

## Parallel Example: Phase 2 Foundational

```bash
# These can run in parallel after T005 (vite.config.ts):
Task: "Configure Tailwind CSS in extension/tailwind.config.ts" (T006)
Task: "Set up QueryClient in extension/src/lib/queryClient.ts" (T007)
Task: "Create manifest.json in extension/public/manifest.json" (T008)
Task: "Create extension types in extension/src/types/index.ts" (T009)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test Docker environment works
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Docker)
   - Developer B: User Story 2 (Components)
   - Developer C: User Story 3 (Data Layer)
3. Stories complete and integrate independently
4. User Story 4 validates full integration

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Testing: Vitest for React components/hooks + manual Firefox verification
- Communication: chrome.runtime.sendMessage for Popup ↔ Content Scripts
- Caching: TanStack Query with 1min staleTime, 1hr gcTime