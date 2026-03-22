<!--
## Sync Impact Report

**Version change**: 1.3.1 → 1.4.0
**Modified principles**:
  - Section 1: Type Safety relaxed to "target 100%" with stub allowance
  - Section 3: Git-Flow noted as review-pending for simplification
**Added sections**:
  - Section 8: Performance Budget
**Removed sections**: N/A
**Templates requiring updates**:
  - ✅ All templates align
**Follow-up TODOs**:
  - Evaluate Git-Flow → GitHub Flow migration
  - Document k=5 retrieval rationale

-->

# Job Forms Helper Constitution

## Core Principles

### 1. Engineering Standards (Strict Compliance)
* **Patterns**: Follow **SOLID**, **DRY**, **YAGNI**, and **KISS**. Prioritize explicit logic over implicit magic.
* **Composition**: Use composition for services/logic. Inheritance is restricted to Data Models (Pydantic) and Exceptions.
* **Type Safety**: Target 100% coverage. Python (Type Hints), JS (JSDoc), Pydantic (Field validation). Typed stubs required for untyped third-party dependencies. Avoid `any`; document exceptions with justification.
* **Structure**: Services must be modular (Retriever, Generator, Validator) with Dependency Injection.

### 2. Technical Constraints
* **Embeddings**: Mistral `mistral-embed` (1024-dim).
* **Retrieval**: Fixed $k=5$ context chunks (tunable pending evaluation data).
* **LLM Ops**: Temp `0.3` (configurable per use-case). System prompts must be grounded; fabrication triggers an immediate "information not found" fallback.
* **Frontend/API**: Backend must support CORS for extension origins. DOM updates must dispatch bubbling `input`/`change` events.
* **Automation**: Use Playwright (Async API) for all scraping/tests. Headless in CI. Browser contexts must be isolated per session.

### 3. Workflow & Quality
* **Git**: Git-Flow (main, develop, feature/, bugfix/, hotfix/). Atomic commits only. No direct merges to protected branches. **Review pending**: Consider GitHub Flow for reduced overhead.
* **Docker**: All execution/testing occurs via `docker-compose exec api-backend`.
* **Testing**: Unit (utils), Integration (API), Manual (health/fill-form).
* **Docs**: Docstrings required for all functions (Args/Returns/Raises). Inline comments must explain "Why," never "What."

### 4. Governance
* **Amendments**: Require rationale, impact assessment, SemVer update, and migration path for breaking changes.
* **Hierarchy**: This constitution supersedes all local READMEs or conflicting patterns.
* **Version**: 1.4.0 | **Updated**: 2026-03-22

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