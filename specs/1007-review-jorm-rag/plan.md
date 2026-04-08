# Implementation Plan: Review JORM Filler and RAG System

**Branch**: `1007-review-jorm-rag` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Review fill-form endpoint and underlying RAG system - verify Qdrant-only data source, no fallbacks

## Summary

Review the JORM filler (fill-form endpoint) and underlying RAG system to verify:
1. All data comes from Qdrant vector database (no fallbacks)
2. Existing hybrid search implementation is correct
3. The fallback pattern at retriever.py:137-138 will be removed
4. Future enhancements (HyDE, embedding rerank, LLM rubric) are deferred

This is a code review task - no new implementation. Findings will be documented.

## Technical Context

**Language/Version**: Python 3.11+ with FastAPI  
**Primary Dependencies**: qdrant-client, mistral (OpenAI-compatible), asyncpg, redis  
**Storage**: Qdrant (vector DB) + PostgreSQL (job offers) - N/A for this review task  
**Testing**: pytest (existing), manual API testing with curl  
**Target Platform**: Linux server (Docker container)  
**Project Type**: Web service / REST API (existing, reviewing code)  
**Performance Goals**: Not modified - review task only  
**Constraints**: No fallbacks to alternative data sources (per FR-002), strict Qdrant-only  
**Scale/Scope**: Code review of existing 6 core services under src/services/

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Type Safety (Python types) | PASS | Existing codebase has Python type hints; review confirms patterns |
| Testing | PASS | Code review task - no new tests required |
| No Fallbacks | PASS | Clarified: fallback at retriever.py:137-138 will be removed |
| Single Source of Truth | PASS | Qdrant confirmed as primary data source |

**Post-Design Re-evaluation**: All gates passed. Ready for implementation phase.

**Violations to justify**: None. This is a code review, not new implementation.

## Project Structure

### Documentation (this feature)

```text
specs/1007-review-jorm-rag/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (completed with spec)
├── data-model.md        # Phase 1 output (completed with spec)
├── quickstart.md        # Phase 1 output (completed with spec)
├── checklists/          # Quality checklists
│   ├── requirements.md
│   └── review-quality.md
└── tasks.md             # Phase 2 output (created manually)
```

### Source Code (repository root)

This is a code review task - no source code modifications.

Existing structure (from repo root):
```text
src/
├── api/routes.py          # fill-form endpoint (under review)
├── services/embedder.py   # Mistral embedding (under review)
├── services/retriever.py  # Qdrant hybrid retrieval (under review)
├── services/generator.py  # LLM answer generation (under review)
├── services/field_classifier.py  # Direct field extraction (under review)
├── services/fill_form.py # Context assembly & confidence (under review)
├── api/schemas.py        # Pydantic models
└── config.py             # Settings

tests/                    # Existing tests (not modified)
```

All code under review is in src/services/*.py and src/api/routes.py

## Phase 0: Research (Completed)

No NEEDS CLARIFICATION markers remain. The spec already incorporates:
- Decision on fallback removal (retriever.py:137-138)
- All research on RAG patterns integrated from Rick Hightower article
- Optional enhancements (HyDE, embedding rerank, LLM rubric) deferred

## Phase 1: Design

**Data Model**: Already captured in spec.md (Key Entities section)

**Interface Contracts**: Not applicable - this is a code review task:
- `/fill-form` (POST) - existing, under review
- `/health` (GET) - not modified
- `/validate` (GET) - not modified

**Quickstart**: Code review checklist - see tasks.md

## Complexity Tracking

No complexity changes. This is a review task identifying documentation needs.

---

*Generated: 2026-04-08*
