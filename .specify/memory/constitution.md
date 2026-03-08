<!--
============================================================================
SYNC IMPACT REPORT
============================================================================
Version Change: 0.0.0 (template) → 1.0.0 (initial ratification)
Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (5 technical decrees)
  - Infrastructure Mapping
  - Risk Mitigation
  - Governance
Removed Sections: None
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section compatible
  ✅ spec-template.md - Requirements align with technical decrees
  ✅ tasks-template.md - Phase structure compatible with principles
Follow-up TODOs: None
============================================================================
-->

# RAG-Automated-Form-Filler Constitution

## Core Principles

### I. Data Integrity

All vector embeddings MUST be 1536-dimensional to ensure compatibility with the Z.ai API Standard. Embedding dimension mismatches are non-negotiable failures that MUST be caught at ingestion time.

**Rationale**: The Z.ai inference engine expects 1536-dimensional vectors. Any deviation will cause retrieval failures or corrupted similarity searches, breaking the core RAG pipeline.

### II. Retrieval Law

All vector store queries MUST use `Qdrant.as_retriever(search_kwargs={"k": 5})` to fetch the top 5 most relevant context chunks.

**Rationale**: The k=5 parameter balances context richness against token limits. Lower values risk missing relevant experience; higher values risk context overflow and degraded response quality.

### III. Zero Hallucination

System prompts MUST explicitly forbid the creation of professional experience, skills, or qualifications not found in the context provided by the vector store. Generated answers MUST be strictly grounded in retrieved resume data.

**Rationale**: Job applications require factual accuracy. Fabricated experience damages user credibility and violates the core value proposition of an automated form-filler.

### IV. CORS Policy

FastAPI MUST whitelist `moz-extension://` origins via CORSMiddleware to enable secure communication between the Firefox Extension and the backend API.

**Rationale**: Browser extension security models require explicit CORS configuration. Without proper whitelisting, the extension cannot communicate with the backend.

### V. DOM Injection

Injected form values MUST trigger both `input` and `change` events to ensure job board React/Angular state synchronization.

**Rationale**: Modern SPAs use framework-specific state management that relies on event listeners. Silent value assignment without events leaves UI state inconsistent with DOM state.

## Infrastructure Mapping

| Component | Internal Host | External Host | Notes |
|-----------|---------------|---------------|-------|
| Vector Store | `qdrant-db` | N/A | Port 6333, Docker internal DNS |
| API Backend | N/A | `localhost:8000` | Host loopback access |
| Storage Volume | `./qdrant_storage` | N/A | Persistent volume mount |

**Networking Rules**:
- Backend interacts with Qdrant via internal Docker DNS (`qdrant-db`)
- Firefox Extension interacts with Backend via host loopback (`localhost:8000`)
- No direct Extension-to-Qdrant communication permitted

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| **Context Overflow** | Monitor token usage when k=5 for long resumes; implement chunking limits |
| **Path Validation** | Explicitly override `base_url` for Z.ai to prevent `/v1/v1` path doubling |
| **Permissions** | Ensure host write-access to storage volume to prevent container start failures |

## Governance

### Amendment Procedure

1. Proposed changes MUST be documented with rationale
2. Impact analysis MUST assess downstream effects on templates and runtime code
3. Version increment MUST follow semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, typo fixes, non-semantic refinements
4. All PRs MUST verify compliance with constitution principles

### Compliance Review

- Code reviews MUST verify adherence to all five core principles
- Complexity introduced without necessity MUST be justified in writing
- Runtime development guidance maintained in project documentation

**Version**: 1.0.0 | **Ratified**: 2026-03-08 | **Last Amended**: 2026-03-08
