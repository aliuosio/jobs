<!--
## Sync Impact Report

**Version change**: 1.5.3 → 1.5.4
**Modified principles**:
  - Section 3: Enhanced Git Flow integration with opencode skill
  - Section 4: Updated Governance with version management
**Added sections**:
  - Section 3: Git Flow Skill Integration (detailed commands and workflow)
**Removed sections**: N/A
**Templates requiring updates**:
  - ✅ No template files found in .specify/templates/
**Follow-up TODOs**:
  - None

-->
---

# Job Forms Helper Constitution

## Core Principles

### 1. Engineering Standards
- **Patterns**: SOLID, DRY, YAGNI, KISS. Explicit over implicit.
- **Composition**: Services/logic via composition. Inheritance restricted to Pydantic models and Exceptions.
- **Type Safety**: 100% coverage target. Python type hints, JSDoc, Pydantic field validation. Typed stubs for untyped deps. Avoid `any`; document exceptions.
- **Structure**: Modular services (Retriever, Generator, Validator) with Dependency Injection.

### 2. Technical Constraints
- **LLM Ops**: Temp `0.3` (configurable). System prompts must be grounded; fabrication → immediate "information not found" fallback.
- **Frontend/API**: Backend must support CORS for extension origins. DOM updates must dispatch bubbling `input`/`change` events.

### 3. Workflow & Quality
- **Git Flow Skill**: Use the opencode git-flow skill (`/git-flow`) for all operations.
  - **Branches**: `main` (prod), `develop` (integration), `feature/*`, `bugfix/*`, `hotfix/*`, `release/*`
  - **Commands**: `start`/`finish` per branch type, e.g. `/git-flow feature start name` · `/git-flow release finish version`
  - **Naming**: kebab-case (e.g. `feature/user-authentication`)
  - **Commits**: Atomic, Conventional Commits format
  - **Rules**: No direct commits to `main` or `develop`. All merges via PR with passing tests.
- **Knowledge Graph**:
  - Pre-flight: `memory_read_graph` to identify deps and prevent duplication
  - Post-flight: `memory_create_entities` + `memory_create_relations`
  - Every spec file linked to parent folder via `contained_in`/`part_of`
  - **Prune rule**: Replaced/moved specs → `memory_delete_entities` or `memory_delete_observations`. No ghost nodes.
  - Entity names must match `@filename`/`@foldername` exactly.
- **Sequential Thinking**: Use `sequential-thinking_sequentialthinking` before decisions on complex or ambiguous requests.
- **Knowledge Gathering** (priority order): (1) `context7` for library docs → (2) `websearch` → (3) `firecrawl-mcp` for specific page content.
- **Docker**: All services run exclusively in containers. `docker-compose` for all environments. Dev/test/prod use identical base images.
- **Testing** (definition of done):
  - Unit tests for all new/modified functions
  - Integration tests for API endpoints
  - Coverage must not decrease; all tests pass before MR
  - Manual testing steps documented for UI/UX changes
- **Docs**: Docstrings required (Args/Returns/Raises). Inline comments explain *why*, not *what*.

### 4. Governance
- **Amendments**: Require rationale, impact assessment, SemVer bump, and migration path for breaking changes.
- **Hierarchy**: This constitution supersedes all local READMEs and conflicting patterns.
- **Versioning**: SemVer (MAJOR.MINOR.PATCH). Releases via git-flow release process.
- **Version**: 1.5.3 | **Updated**: 2026-03-24

### 5. Reliability
- **Retries**: Exponential backoff (1s→2s→4s, 20% jitter); max 3. Retry on 5xx/timeout; fail-fast on 4xx.
- **Timeouts**: 30s default · 60s form-filling · 120s embedding generation.
- **Fallbacks**: Cache last successful response (TTL 1h) for degraded mode.
- **Circuit Breaker**: Trip after 5 consecutive failures; reset after 30s.

### 6. Security
- **Secrets**: Env vars only; never commit; rotate every 90 days.
- **CORS**: Whitelist in `.env`, validated at startup (fail-fast on invalid entries).
- **Input**: Sanitized via Pydantic before processing; max string length 10KB.
- **Rate Limiting**: 100 req/min per IP.

### 7. Observability
- **Logging**: Structured JSON via structlog. Levels: DEBUG < INFO < WARN < ERROR.
- **Metrics**: Request latency (p50/p95/p99), LLM token usage, error rates.
- **Tracing**: Correlation ID (`X-Request-ID`) on all requests.

### 8. Performance Budget
- **Form-fill latency**: p95 < 5s · p99 < 10s
- **Memory**: 512MB per container; alert at 80%.
- **LLM tokens**: Max 4096/request; alert on overshoot.

### 9. Additions
- **Prioritize Code Reuse:** Before implementing new logic, developers must exhaustively search the existing codebase for reusable components, utilities, or functions. Avoid duplication at all costs.
- **Architectural Intent:** Solutions must be implemented using the most appropriate design pattern for the specific problem. Prioritize scalability, maintainability, and clarity over quick, ad-hoc fixes.
- **Resource Hygiene:** Every process must include a terminal cleanup phase. Ensure all temporary resources, files, and variables are disposed of correctly to maintain a clean environment.
- **Mandatory Testing:** TESTING IS NOT OPTIONAL. Every change or addition must be validated by automated tests. Code without corresponding test coverage will be rejected.

---