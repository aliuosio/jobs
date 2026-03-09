# Implementation Plan: Configuration Validation

**Branch**: `004-config-validation` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-config-validation/spec.md`

## Summary

Expose a `/validate` HTTP endpoint that runs four configuration checks (internal DNS, external endpoint, URL format, embedding dimensions) and returns a JSON report with per-check status. Implementation uses `httpx` for async HTTP checks, `asyncio.wait_for` for timeout handling, and direct embedding generation for dimension validation.

## Technical Context

**Language/Version**: Python 3.11+ (aligned with 002-rag-backend)
**Primary Dependencies**: FastAPI, httpx (async HTTP client), qdrant-client, langchain-openai (embedding validation)
**Storage**: Qdrant vector database (read-only checks for dimension validation)
**Testing**: pytest (implicit - tests not explicitly requested)
**Target Platform**: Linux server (Docker container)
**Project Type**: web-service (extends existing FastAPI backend)
**Performance Goals**: All checks complete within 10 seconds each; total validation < 45 seconds
**Constraints**: Read-only checks (no side effects); HTTP 200 response even on validation failure
**Scale/Scope**: Single endpoint, 4 validation checks, internal developer tooling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ PASS | FR-005 validates 1536-dimensional embeddings per constitution |
| II. Retrieval Law | ⚪ N/A | Not in scope - no vector retrieval operations |
| III. Zero Hallucination | ⚪ N/A | Not in scope - no content generation |
| IV. CORS Policy | ✅ PASS | US2 acceptance criteria include CORS verification; endpoint follows existing CORS middleware |
| V. DOM Injection | ⚪ N/A | Not in scope - no DOM operations |

**Gate Result**: ✅ PASS - No violations. Principles I and IV are actively enforced; II, III, V are out of scope.

## Project Structure

### Documentation (this feature)

```text
specs/004-config-validation/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical research (Phase 0)
├── data-model.md        # Entity definitions (Phase 1)
├── quickstart.md        # Usage examples (Phase 1)
├── contracts/           # API contracts (Phase 1)
│   └── api-contract.md
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

This feature extends the existing 002-rag-backend structure:

```text
backend/
├── src/
│   ├── api/
│   │   ├── routes.py        # Add GET /validate endpoint
│   │   └── schemas.py       # Add CheckResult, ValidationReport models
│   └── services/
│       └── validation.py    # NEW: Validation check implementations
├── tests/
│   └── (not requested)      # Tests not explicitly required
└── requirements.txt         # Add httpx>=0.25.0
```

**Structure Decision**: Extends Option 2 (Web application backend) from existing 002-rag-backend. No frontend changes required - this is a backend-only feature accessed via HTTP.

## Complexity Tracking

> No constitution violations to justify. This section is empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |
