<!--
## Sync Impact Report

**Version change**: 1.2.0 → 1.3.0
**Modified principles**: N/A
**Added sections**:
  - Runtime Constitution VI: Playwright Browser Automation
**Removed sections**: N/A
**Templates requiring updates**:
  - ✅ All templates align (new section is additive)
**Follow-up TODOs**: None

-->

# Job Forms Helper Constitution

## Core Principles

### 1. Engineering Standards (Strict Compliance)
* **Patterns**: Follow **SOLID**, **DRY**, **YAGNI**, and **KISS**. Prioritize explicit logic over implicit magic.
* **Composition**: Use composition for services/logic. Inheritance is restricted to Data Models (Pydantic) and Exceptions.
* **Type Safety**: 100% coverage required. Python (Type Hints), JS (JSDoc), Pydantic (Field validation). No `any` or `ignore` types.
* **Structure**: Services must be modular (Retriever, Generator, Validator) with Dependency Injection.

### 2. Technical Constraints
* **Embeddings**: Mistral `mistral-embed` (1024-dim).
* **Retrieval**: Fixed $k=5$ context chunks.
* **LLM Ops**: Temp `0.3`. System prompts must be grounded; fabrication triggers an immediate "information not found" fallback.
* **Frontend/API**: Backend must support CORS for extension origins. DOM updates must dispatch bubbling `input`/`change` events.
* **Automation**: Use Playwright (Async API) for all scraping/tests. Headless in CI.

### 3. Workflow & Quality
* **Git**: Git-Flow (main, develop, feature/, bugfix/, hotfix/). Atomic commits only. No direct merges to protected branches.
* **Docker**: All execution/testing occurs via `docker-compose exec api-backend`.
* **Testing**: Unit (utils), Integration (API), Manual (health/fill-form).
* **Docs**: Docstrings required for all functions (Args/Returns/Raises). Inline comments must explain "Why," never "What."

### 4. Governance
* **Amendments**: Require rationale, impact assessment, and SemVer update.
* **Hierarchy**: This constitution supersedes all local READMEs or conflicting patterns.
* **Version**: 1.3.1 | **Updated**: 2026-03-22

---