# Implementation Plan: RAG Backend API

**Branch**: `002-rag-backend` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rag-backend/spec.md`

## Summary

FastAPI backend with LangChain RAG pipeline for generating form-filling answers from resume embeddings stored in Qdrant. Includes CORS configuration for Firefox extension communication and Z.ai API integration.

## Technical Context

**Language/Version**: Python 3.11+, FastAPI 0.100+
**Primary Dependencies**: LangChain, qdrant-client, OpenAI SDK, FastAPI, Uvicorn
**Storage**: Qdrant vector database (via Docker internal DNS)
**Testing**: pytest for unit tests, pytest-asyncio for async tests
**Target Platform**: Linux server (Docker container)
**Project Type**: Web service (REST API)
**Performance Goals**: Response time < 5 seconds, 10 concurrent requests
**Constraints**: 1536-dimensional embeddings, k=5 retrieval, zero hallucination
**Scale/Scope**: Single user form-filling session, 10 concurrent requests max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ Pass | FR-007 specifies 1536-dimensional embeddings |
| II. Retrieval Law | ✅ Pass | FR-002 specifies k=5 retrieval |
| III. Zero Hallucination | ✅ Pass | FR-004 specifies anti-hallucination system prompt |
| IV. CORS Policy | ✅ Pass | FR-005 specifies moz-extension:// whitelist |
| V. DOM Injection | ✅ N/A | Backend layer - no DOM interaction |

**Infrastructure Mapping Compliance**:
- ✅ Vector Store: `qdrant-db` via internal DNS (FR-006)
- ✅ API Backend: `localhost:8000` (already defined in 001-docker-infra)
- ✅ Storage Volume: `./qdrant_storage`
- ✅ No direct Extension-to-Qdrant path enforced by architecture

## Project Structure

### Documentation (this feature)

```text
specs/002-rag-backend/
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
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py        # API endpoints (/fill-form, /health)
│   │   └── schemas.py       # Pydantic request/response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── rag.py           # RAG pipeline service
│   │   └── vector_store.py  # Qdrant connection service
│   └── prompts/
│       └── system.py         # System prompts for zero-hallucination
└── tests/
    ├── __init__.py
    ├── test_api.py
    ├── test_rag.py
    └── test_vector_store.py
```

**Structure Decision**: Backend module structure following FastAPI best practices. Separated concerns: API routes, services, configuration, prompts.

## Complexity Tracking

> No violations - all requirements align with constitution principles.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| RAG Pipeline | Medium | Standard LangChain pattern with custom prompts |
| CORS Config | Low | Standard FastAPI middleware |
| Vector Store | Low | Single Qdrant instance, no clustering |

## Phase 0: Research Summary

✅ **COMPLETE** - See [research.md](./research.md)

### Resolved Questions

- [x] What LangChain version and components to use? → langchain-openai, langchain-qdrant, qdrant-client
- [x] How to configure OpenAI-compatible client with custom base URL? → ChatOpenAI with base_url parameter
- [x] What is the best RAG chain pattern for form-filling use case? → RetrievalQA with custom prompt
- [x] How to implement exponential backoff for retries? → tenacity library with wait_exponential

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
| I. Data Integrity | ✅ Pass | OpenAIEmbeddings with 1536 dimensions |
| II. Retrieval Law | ✅ Pass | as_retriever(search_kwargs={"k": 5}) |
| III. Zero Hallucination | ✅ Pass | Strict system prompt with grounding rules |
| IV. CORS Policy | ✅ Pass | moz-extension:// whitelisted via regex |
| V. DOM Injection | ✅ N/A | Backend layer only |

**Infrastructure Mapping**: All requirements satisfied.

---
*Plan created: 2026-03-08 | Status: Phase 1 Complete - Ready for /speckit.tasks*
