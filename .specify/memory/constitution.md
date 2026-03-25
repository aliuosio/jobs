<!--
## Sync Impact Report

**Version change**: 1.5.1 → 1.5.2
**Modified principles**:
  - Section 3: Added Knowledge Gathering principle with tool priority order
**Added sections**:
  - Section 3: Knowledge Gathering (context7 → websearch → firecrawl-MCP)
**Removed sections**: N/A
**Templates requiring updates**:
  - ✅ No template files found in .specify/templates/
**Follow-up TODOs**:
  - None

-->

# Job Forms Helper Constitution

## Core Principles

### 1. Engineering Standards (Strict Compliance)
* **Patterns**: Follow **SOLID**, **DRY**, **YAGNI**, and **KISS**. Prioritize explicit logic over implicit magic.
* **Composition**: Use composition for services/logic. Inheritance is restricted to Data Models (Pydantic) and Exceptions.
* **Type Safety**: Target 100% coverage. Python (Type Hints), JS (JSDoc), Pydantic (Field validation). Typed stubs required for untyped third-party dependencies. Avoid `any`; document exceptions with justification.
* **Structure**: Services must be modular (Retriever, Generator, Validator) with Dependency Injection.

### 2. Technical Constraints
* **LLM Ops**: Temp `0.3` (configurable per use-case). System prompts must be grounded; fabrication triggers an immediate "information not found" fallback.
* **Frontend/API**: Backend must support CORS for extension origins. DOM updates must dispatch bubbling `input`/`change` events.

### 3. Workflow & Quality
* **Git**: Git-Flow (main, develop, feature/, bugfix/, hotfix/). Atomic commits only. No direct merges to protected branches. **MUST** use the opencode git-flow skill (`/git-flow` or `git-flow` skill) for all git-flow operations.
* **Memory MCP**:
    * Pre-Flight: Before implementation, MUST memory_read_graph to identify existing dependencies and prevent logic duplication.
    * Post-Flight: After implementation, MUST update with memory_create_entities and memory_create_relations.
    * Folder Mapping: Every spec file MUST be linked to its parent folder entity via a contained_in or part_of relation. This allows scoped retrieval when targeting a folder.
    * Graph Hygiene (The "Prune" Rule): If an implementation replaces or moves a spec/function, you MUST use memory_delete_entities or memory_delete_observations for the old references. Do not allow "Ghost Nodes" to persist in the graph.
    * Naming Consistency: Entity names in the graph MUST match the @filename or @foldername exactly to ensure the /speckit commands and the Knowledge Graph stay synchronized.
* **Sequential Thinking**: **MUST** use the `sequential-thinking` tool (`sequential-thinking_sequentialthinking`) to gather thoughts before making decisions, especially when analyzing complex requests or when the user's intent is unclear.
* **Knowledge Gathering**: When missing knowledge, **MUST** use tools in this priority order: (1) `context7` (context7_query-docs) for library/framework documentation — **FIRST**, (2) `websearch` (websearch_web_search_exa) for general web search — **SECOND** if context7 lacks the info, (3) `firecrawl-MCP` (firecrawl-mcp_firecrawl_search/scrape) for specific page content — **THIRD** if websearch lacks the info.
* **Docker**: All execution/testing occurs via `docker-compose exec api-backend`.
* **Testing**: Unit (utils), Integration (API), Manual (health/fill-form).
* **Docs**: Docstrings required for all functions (Args/Returns/Raises). Inline comments must explain "Why," never "What."

### 4. Governance
* **Amendments**: Require rationale, impact assessment, SemVer update, and migration path for breaking changes.
* **Hierarchy**: This constitution supersedes all local READMEs or conflicting patterns.
* **Version**: 1.5.2 | **Updated**: 2026-03-24

### 5. Reliability
* **Retries**: Exponential backoff (1s→2s→4s with 20% jitter); max 3 retries. Retry on 5xx/timeout only; fail-fast on 4xx.
* **Timeouts**: 30s default, 60s for form-filling, 120s for embedding generation.
* **Fallbacks**: Cache last successful response (TTL 1h) for degraded mode.
* **Circuit Breaker**: Trip after 5 consecutive failures; reset after 30s.

### 6. Security
* **Secrets**: Environment variables only; never commit; rotate every 90 days.
* **CORS**: Whitelist maintained in .env, validated at startup (fail-fast on invalid entries).
* **Input**: All user inputs sanitized via Pydantic before processing; max string length 10KB.
* **Rate Limiting**: 100 req/min per IP for API endpoints.

### 7. Observability
* **Logging**: Structured JSON logs via structlog. Levels: DEBUG < INFO < WARN < ERROR.
* **Metrics**: Request latency (p50/p95/p99), LLM token usage, error rates.
* **Tracing**: Correlation ID (X-Request-ID header) in all requests for distributed tracing.

### 8. Performance Budget
* **Form-fill latency**: p95 < 5s, p99 < 10s.
* **Memory**: 512MB limit per container; alert at 80% usage.
* **LLM tokens**: Max 4096 tokens per request; alert on overshoot.

---