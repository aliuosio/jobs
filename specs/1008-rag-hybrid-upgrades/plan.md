# Implementation Plan: RAG System Hybrid Retrieval Enhancements

**Branch**: `1008-rag-hybrid-upgrades` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Enhance the existing Qdrant-based RAG system with four advanced retrieval techniques to reduce LLM hallucinations and improve relevance:

1. **HyDE (Hypothetical Document Embeddings)**: Generate hypothetical answers before embedding to improve semantic matching
2. **Embedding Reranking**: Add cross-encoder as second-stage reranker for top-50 candidates
3. **LLM Rubric Reranking**: Apply LLM-as-judge scoring to top-10 candidates
4. **MMR**: Diversify results to avoid duplicate content

All enhancements are configurable and feature graceful degradation to baseline retrieval.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, Qdrant, Mistral API (embeddings + LLM), Pydantic, asyncpg  
**Storage**: Qdrant (vector search), PostgreSQL (job offers), Redis (caching)  
**Testing**: pytest (existing test infrastructure in tests/)  
**Target Platform**: Linux server (Docker container)  
**Project Type**: Web service / REST API  
**Performance Goals**: <3s response time (SC-004), p95 <5s from constitution  
**Constraints**: Sub-3-second response time with all enhancements enabled; graceful degradation on failures  
**Scale/Scope**: Single-user RAG system for job form filling (~100-1000 documents)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution Principle | Requirement | Status | Notes |
|------------------------|--------------|--------|-------|
| §1: Type Safety | 100% type hints, no `any` | PASS | Python type hints required |
| §3: Git Flow Skill | Use git-flow for branches | PASS | Feature branch created via spec command |
| §3: Knowledge Graph | Pre/post-flight memory ops | PASS | Will update after planning |
| §3: Docker | All services in containers | PASS | Existing docker-compose setup |
| §3: Testing | Unit + integration tests required | PASS | Tests must be created |
| §5: Retries | Exponential backoff, max 3 | PASS | Apply to HyDE/LLM calls |
| §5: Timeouts | 30s default, 60s form-fill | PASS | Existing timeouts apply |
| §5: Fallbacks | Cache last successful response | PASS | Required by FR-007 |
| §8: Performance | p95 <5s, p99 <10s | PASS | SC-004 aligns with this |
| §9: Code Reuse | Search existing code first | PASS | Will use existing services |
| §9: Testing Mandatory | No changes without tests | PASS | Must create tests |

**Gate Status**: ✅ PASS - All requirements align with existing constitution

---

## Phase 0: Research (COMPLETE)

**Output**: `research.md` - Resolved all technical decisions

- Decision: HyDE as optional enhancement layer
- Decision: Cross-encoder (ms-marco-MiniLM-L-6-v2) for embedding reranking
- Decision: LLM rubric for top-10 candidates (cost control)
- Decision: MMR as optional post-processing

---

## Phase 1: Design & Contracts (COMPLETE)

**Output**: `data-model.md`, `quickstart.md`, `research.md`

- New entities defined: RetrievalConfig, HyDEGenerator, RerankerPool, QueryCache
- Validation rules specified
- State machine documented
- Agent context updated

---

## Generated Artifacts

| Artifact | Path |
|----------|------|
| Research | `/specs/1008-rag-hybrid-upgrades/research.md` |
| Data Model | `/specs/1008-rag-hybrid-upgrades/data-model.md` |
| Quickstart | `/specs/1008-rag-hybrid-upgrades/quickstart.md` |
| Implementation Plan | `/specs/1008-rag-hybrid-upgrades/plan.md` |

---

## Suggested Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement HyDE service first (lowest risk, highest impact)
3. Add unit tests alongside implementation

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Single project (web service) using existing structure. The RAG enhancements will add new services under `src/services/` and extend existing test coverage.

### New Files Added

```text
src/services/
├── hyde.py           # New: HyDE generation service
└── reranker.py      # New: Reranking service (embedding + LLM)

src/utils/
└── cache.py         # New: Query result caching

tests/unit/
├── test_hyde.py     # New: Unit tests for HyDE
├── test_reranker.py # New: Unit tests for reranker
└── test_cache.py    # New: Unit tests for caching
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
