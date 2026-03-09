# Implementation Plan: RAG Backend API

**Branch**: `002-rag-backend` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rag-backend/spec.md`

## Summary

FastAPI backend implementing a RAG (Retrieval-Augmented Generation) pipeline that:
- Accepts form field labels via `/fill-form` endpoint
- Retrieves relevant context from Qdrant vector store (`resumes` collection, k=5)
- Generates grounded answers using Z.ai API (OpenAI-compatible)
- Returns JSON responses with answer, confidence, and metadata
- Supports CORS for Firefox extension communication

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, qdrant-client, httpx (async HTTP client), openai (OpenAI-compatible client)
**Storage**: Qdrant vector database (via Docker internal DNS: `qdrant-db:6333`)
**Testing**: pytest + pytest-asyncio + httpx (async test client)
**Target Platform**: Linux server (Docker container)
**Project Type**: web-service (REST API)
**Performance Goals**: P95 latency < 5 seconds, 10 concurrent requests
**Constraints**: Docker bridge network isolation, 1536-dim embeddings, no API authentication
**Scale/Scope**: Single-user local development, single resume collection

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Plan |
|-----------|--------|-----------------|
| **I. Data Integrity** (1536-dim embeddings) | ✅ PASS | Spec mandates FR-007: 1536-dimensional embeddings. Qdrant collection configured for this dimension. |
| **II. Retrieval Law** (k=5) | ✅ PASS | Spec mandates FR-002: query with k=5. Implementation will use `search_kwargs={"k": 5}`. |
| **III. Zero Hallucination** | ✅ PASS | Spec mandates FR-004: system prompt forbids fabrication. Prompt engineering required. |
| **IV. CORS Policy** | ✅ PASS | Spec mandates FR-005: whitelist `moz-extension://*` and `localhost`. FastAPI CORSMiddleware configured. |
| **V. DOM Injection** | ⚪ N/A | This principle applies to browser extension, not backend API. |

**Gate Status**: ✅ ALL GATES PASSED

### Post-Design Re-evaluation (Phase 1 Complete)

| Principle | Design Artifact | Verification |
|-----------|-----------------|---------------|
| **I. Data Integrity** | data-model.md: `EMBEDDING_DIMENSION: 1536` in Settings entity | ✅ Verified in config entity |
| **II. Retrieval Law** | data-model.md: `RETRIEVAL_K: 5`, contracts/openapi.yaml: `context_chunks` max 5 | ✅ Verified in data model and API contract |
| **III. Zero Hallucination** | research.md: Anti-hallucination system prompt in GeneratorService | ✅ Verified in research decisions |
| **IV. CORS Policy** | quickstart.md: CORS middleware documentation, research.md: `allow_origins` | ✅ Verified in implementation pattern |
| **V. DOM Injection** | N/A - Backend service only | ⚪ Not applicable |

**Post-Design Gate Status**: ✅ ALL GATES PASSED

## Project Structure

### Documentation (this feature)

```text
specs/002-rag-backend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── __init__.py
├── main.py              # FastAPI app entry point
├── config.py            # Settings via pydantic-settings
├── api/
│   ├── __init__.py
│   ├── routes.py        # /fill-form and /health endpoints
│   └── schemas.py       # Pydantic request/response models
├── services/
│   ├── __init__.py
│   ├── retriever.py     # Qdrant vector store operations
│   ├── embedder.py     # Query embedding generation
│   └── generator.py    # LLM inference client

└── utils/
    ├── __init__.py
    └── retry.py         # Exponential backoff utilities

tests/
├── __init__.py
├── conftest.py          # Fixtures and test configuration
├── unit/
│   ├── test_retriever.py
│   └── test_generator.py
└── integration/
    ├── test_api.py
    └── test_health.py
```

**Structure Decision**: Single project structure (Option 1). This is a backend-only service with no frontend. The extension is a separate repository.

## Complexity Tracking

> No constitution violations requiring justification.
