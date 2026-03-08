# Implementation Plan: Configuration Validation

**Branch**: `004-config-validation` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-config-validation/spec.md`

## Summary

Add a `/validate` HTTP endpoint to the FastAPI backend that runs comprehensive configuration checks for internal DNS resolution (qdrant-db), external endpoint connectivity (localhost:8000), API URL formatting (prevent /v1/v1 duplication), and embedding dimensions (1536). Returns JSON with per-check status and actionable error messages.

## Technical Context

**Language/Version**: Python 3.11+ (aligned with 002-rag-backend)
**Primary Dependencies**: FastAPI, httpx (async HTTP client), qdrant-client, langchain-openai (embedding validation)
**Storage**: Qdrant vector database (read-only checks for dimension validation)
**Testing**: pytest with pytest-asyncio
**Target Platform**: Linux server (Docker container)
**Project Type**: Web service (REST API extension)
**Performance Goals**: All checks complete within 10 seconds per check timeout
**Constraints**: Read-only validation (no side effects), fail entire validation if any check times out
**Scale/Scope**: Single validation request at a time, 4 checks per request

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ Pass | FR-005 validates 1536-dimensional embeddings |
| II. Retrieval Law | ⚪ N/A | Validation endpoint does not perform retrieval |
| III. Zero Hallucination | ⚪ N/A | Validation endpoint does not generate content |
| IV. CORS Policy | ✅ Pass | Endpoint accessible via same CORS policy |
| V. DOM Injection | ⚪ N/A | Backend layer - no DOM interaction |

**Infrastructure Mapping Validation**:
- ✅ Vector Store check: Validates `qdrant-db:6333` internal DNS (FR-002)
- ✅ API Backend check: Validates `localhost:8000` external access (FR-003)
- ✅ No direct Extension-to-Qdrant path (validation runs on backend only)

## Project Structure

### Documentation (this feature)

```text
specs/004-config-validation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point (add /validate route)
│   ├── config.py            # Configuration management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py        # Add validation endpoint
│   │   └── schemas.py       # Add ValidationReport, CheckResult schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── rag.py           # RAG pipeline (existing)
│   │   ├── vector_store.py  # Qdrant connection (existing)
│   │   └── validation.py    # NEW: Configuration validation service
│   └── prompts/
│       └── system.py        # System prompts (existing)
└── tests/
    ├── __init__.py
    ├── test_api.py          # Add validation endpoint tests
    ├── test_validation.py   # NEW: Validation service unit tests
    ├── test_rag.py
    └── test_vector_store.py
```

**Structure Decision**: Extends existing backend structure from 002-rag-backend. Adds `services/validation.py` for validation logic and extends `api/routes.py` with `/validate` endpoint. Follows established patterns.

## Complexity Tracking

> No violations - all requirements align with constitution principles.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Validation Service | Low | Standard health-check pattern with async HTTP |
| Endpoint | Low | Simple GET endpoint returning JSON |
| Timeout Handling | Low | Standard asyncio.wait_for pattern |

## Phase 0: Research Summary

✅ **COMPLETE** - See [research.md](./research.md)

### Resolved Questions

- [x] Best approach for async HTTP health checks in FastAPI → httpx with AsyncClient
- [x] How to generate test embedding for dimension validation → Direct embedding generation with "test" query
- [x] URL normalization strategy → Strip trailing slashes, detect duplicated path segments
- [x] Timeout handling pattern → asyncio.wait_for with 10s per-check timeout, fail-fast

## Phase 1: Design Artifacts

✅ **COMPLETE**

### Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data Model | [data-model.md](./data-model.md) | ✅ Complete |
| Contracts | [contracts/api-contract.md](./contracts/api-contract.md) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ Pass | embedding_dimensions check validates 1536 dimensions |
| II. Retrieval Law | ⚪ N/A | Validation endpoint does not perform retrieval |
| III. Zero Hallucination | ⚪ N/A | Validation endpoint does not generate content |
| IV. CORS Policy | ✅ Pass | Endpoint uses same CORS middleware as existing API |
| V. DOM Injection | ⚪ N/A | Backend layer - no DOM interaction |

**Infrastructure Mapping**: All checks validate correct infrastructure configuration.

---
*Plan created: 2026-03-08 | Status: Phase 1 Complete - Ready for /speckit.tasks*
---
*Plan created: 2026-03-08 | Status: Phase 0 In Progress*
