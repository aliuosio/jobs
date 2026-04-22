# Implementation Plan: Extension Modernization

**Branch**: `010-extension-modernization` | **Date**: 2026-04-22 | **Spec**: spec.md
**Input**: Migrate existing imperative JavaScript/HTML codebase from /extension to modern React-based architecture in /extension directory. Improve maintainability, developer velocity, and UI consistency while optimizing data fetching via TanStack Query. Create new docker service in docker-compose.yml for the new extension and map extension code as volume.

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Migrate the legacy Firefox extension from imperative JavaScript/HTML to a modern React 19 + TypeScript architecture with TanStack Query for data management, Tailwind CSS for styling, and Docker-based development workflow. The new extension directory will maintain feature parity while improving maintainability and developer velocity.

## Technical Context

**Language/Version**: TypeScript, React 19  
**Primary Dependencies**: Vite, TanStack Query v5, Tailwind CSS v4, React Router DOM  
**Storage**: chrome.storage.local for extension data persistence  
**Testing**: Vitest (unit), manual Firefox verification (integration)  
**Target Platform**: Firefox extension (browser)  
**Project Type**: Browser Extension / Web Application  
**Performance Goals**: Hot reload under 3 seconds, bundle under 500KB gzipped  
**Constraints**: Extension memory limits (< 100MB), offline-capable  
**Scale**: Up to 100 job links, infrequent API calls

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. SOLID/DRY | ✅ PASS | React functional components follow single responsibility |
| II. Design Patterns | ✅ PASS | Uses TanStack Query provider pattern, documented in plan |
| III. TDD | ⚠️ PARTIAL | Vitest tests required before PR - clarified A2 |
| IV. n8n Workflow | N/A | Not applicable to browser extension |
| V. Docker-Based | ✅ PASS | Docker Compose service for extension required |

**Pre-Phase Check**: All gates have pathway to compliance

## Project Structure

### Documentation (this feature)

```text
specs/010-extension-modernization/
├── plan.md              # This file
├── research.md          # Phase 0 output (resolved research)
├── data-model.md        # Phase 1 output (entity definitions)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md           # Phase 2 output (/speckit.tasks)
```

### Source Code (extension)

```text
extension/
├── src/
│   ├── components/      # React UI components (Button, Input, Card, etc.)
│   ├── hooks/           # TanStack Query hooks (useJobsQuery, useProfileQuery, etc.)
│   ├── services/        # API client service
│   ├── content/         # Content script entry
│   ├── background/      # Background script
│   ├── types/           # TypeScript interfaces
│   ├── lib/             # Utilities (queryClient, logger)
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/
│   ├── manifest.json    # Extension manifest (V3)
│   └── popup.html      # Popup entry
├── dist/               # Build output
├── tests/              # Vitest tests
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

**Structure Decision**: React 19 SPA with content/background script adapters. Uses TanStack Query provider pattern, modular component structure following React best practices per Constitution Section I (SOLID).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| TanStack Query | Automatic caching, retry, loading states - reduces bugs | Direct fetch requires manual cache management |
| React Router | Smooth view transitions without page reload | Single HTML file requires page reload |
| @crxjs/vite-plugin | Standard for FF/Chrome extension builds | WXT/Plasmo add abstraction overhead |

---

# Phase 0: Research

**Output**: `research.md` (already complete)

## Decision: TanStack Query Provider Pattern

**Rationale**: 
- Automatic caching with configurable staleTime (1min per spec clarify)
- Automatic retry with exponential backoff (3 attempts)
- Loading/error state management built-in
- Reduces boilerplate and state bugs

**Implementation**: 
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute (60000ms per clarified spec)
      gcTime: 60 * 60 * 1000, // 1 hour
      retry: 3, // per spec clarification
      refetchInterval: false, // Manual refresh only
    },
  },
})
```

**Alternatives considered**:
- SWR: Similar, but TanStack Query has better React 19 support
- Manual fetch: Rejected - requires manual cache management

---

## Decision: Chrome.runtime.sendMessage for Communication

**Rationale**:
- Direct message passing between popup and content scripts
- Simple, reliable for request/response pattern
- Works without background as intermediary

**Implementation**:
```typescript
// Popup to Content
chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE' }, callback)

// Content to Popup response
chrome.runtime.sendMessage({ type: 'FIELDS_DETECTED', fields: [...] })
```

**Alternatives considered**:
- chrome.runtime.connect: More persistent, overkill for simple commands

---

## Decision: Custom Logger with chrome.storage Persistence

**Rationale**:
- Levels: debug, info, warn, error
- Max 1000 entries with FIFO eviction
- Errors logged with stack traces and context

**Implementation**:
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  stack?: string
}
```

---

## Decision: Docker Compose Service

**Rationale**:
- Project-wide consistency (per Constitution Section V)
- node:24.15.0-alpine3.23 (latest LTS)
- Volume mapping for hot reload
- No custom Dockerfile (per clarify session)

**docker-compose.yml service**:
```yaml
extension:
  image: node:24.15.0-alpine3.23
  working_dir: /app
  command: sh -c "npm install && npm run dev"
  ports:
    - "5173:5173"
  volumes:
    - ./extension/src:/app/src
    - ./extension/public:/app/public
```

---

# Phase 1: Design

**Output**: `data-model.md`, `quickstart.md`, `contracts/` (already complete)

## Entities

From data-model.md:

### JobLink
| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary key |
| url | string | Job posting URL |
| title | string | Job title |
| company | string | Company name |
| status | enum | 'applied', 'in_progress', 'not_applied' |
| createdAt | Date | ISO 8601 |

### FormField
| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary key |
| label | string | Field label |
| type | enum | 'text', 'email', 'tel', etc. |
| value | string | Filled value |
| filled | boolean | Whether field is filled |

### UserProfile
| Field | Type | Notes |
|-------|------|-------|
| name | string | Full name |
| email | string | Contact email |
| resumeText | string | Resume content |

---

## Quickstart

```bash
# Start extension development
docker-compose up -d extension

# Run tests
docker compose exec extension npm test

# Build for production
docker compose exec extension npm run build
```

---

## Agent Context Update

The plan reference is already updated in AGENTS.md (lines 102-108):

```
<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
- Extension Modernization: specs/010-extension-modernization/plan.md
- Feature Spec: specs/010-extension-modernization/spec.md
- Research: specs/010-extension-modernization/research.md
- Data Model: specs/010-extension-modernization/data-model.md
<!-- SPECKIT END -->
```

---

# Phase 2: Constitution Check Re-evaluation

| Gate | Status | Post-Design |
|------|--------|-------------|
| I. SOLID/DRY | ✅ PASS | React components have single responsibility |
| II. Design Patterns | ✅ PASS | TanStack Query provider pattern documented |
| III. TDD | ⚠️ PARTIAL | Vitest tests required before PR |
| V. Docker-Based | ✅ PASS | docker-compose service included |

**TDD Note**: Per Constitution Section III, tests MUST be written before PR merge. This is tracked as a blocking task in Phase 7.