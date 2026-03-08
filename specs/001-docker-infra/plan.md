# Implementation Plan: Docker Infrastructure Setup

**Branch**: `001-docker-infra` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-docker-infra/spec.md`

## Summary

Define and enhance `docker-compose.yml` with `qdrant-db` and `api-backend` services on `rag-network` bridge network. Includes health checks, restart policies, logging configuration, and auto-generated `.env` file support.

## Technical Context

**Language/Version**: Docker Compose v2.x (YAML), Shell scripts (bash)
**Primary Dependencies**: Docker Engine 20.10+, Docker Compose v2, Qdrant (latest), FastAPI (existing)
**Storage**: Host-mounted volume at `./qdrant_storage` for Qdrant persistence
**Testing**: Manual verification via `docker-compose ps`, health endpoint curl, dashboard access
**Target Platform**: Linux development host (local development environment)
**Project Type**: Infrastructure configuration (Docker Compose setup)
**Performance Goals**: Services start within 30 seconds; health checks at 10-second intervals
**Constraints**: No resource limits (local dev); no auto-restart; no container logging
**Scale/Scope**: 2 services, 1 network, 1 storage volume

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ N/A | Infrastructure layer only - no embedding logic |
| II. Retrieval Law | ✅ N/A | Infrastructure layer only - no retrieval logic |
| III. Zero Hallucination | ✅ N/A | Infrastructure layer only - no generation logic |
| IV. CORS Policy | ⚠️ Partial | API backend must expose port 8000 for extension access |
| V. DOM Injection | ✅ N/A | Infrastructure layer only - no DOM interaction |

**Infrastructure Mapping Compliance**:
- ✅ Vector Store accessible at `qdrant-db` via internal DNS
- ✅ API Backend exposed at `localhost:8000`
- ✅ Storage volume at `./qdrant_storage`
- ✅ No direct Extension-to-Qdrant path

## Project Structure

### Documentation (this feature)

```text
specs/001-docker-infra/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - infra configs)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (environment contracts)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
# Infrastructure files (root level)
docker-compose.yml       # Main compose file (UPDATE)
Dockerfile               # API backend image (EXISTS - verify)
.env.example             # Environment template (CREATE)
scripts/
└── init-env.sh          # Auto-generate .env script (CREATE)

# Storage (runtime)
qdrant_storage/          # Persistent volume mount (AUTO-CREATED)
```

**Structure Decision**: Single project structure. Infrastructure files at root level per Docker conventions. New `scripts/` directory for initialization utilities.

## Complexity Tracking

> No violations - infrastructure setup aligns with constitution principles.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Health checks | Low | Docker-native health check with curl |
| Env management | Low | Simple shell script for .env generation |
| Networking | Low | Single bridge network, standard DNS |

## Phase 0: Research Summary

✅ **COMPLETE** - See [research.md](./research.md)

### Resolved Questions

- [x] What HTTP endpoint should health check use for api-backend? → `/health` with curl
- [x] What is Qdrant's recommended health check endpoint? → TCP check on port 6333
- [x] What environment variables are required for api-backend? → `QDRANT_URL`, `ZAI_API_KEY`, `ZAI_BASE_URL`
- [x] What default values should .env auto-generation use? → `http://qdrant-db:6333` for Qdrant URL

## Phase 1: Design Artifacts

✅ **COMPLETE**

### Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data Model | [data-model.md](./data-model.md) | ✅ Complete |
| Contracts | [contracts/env-schema.md](./contracts/env-schema.md) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Data Integrity | ✅ N/A | Infrastructure layer only |
| II. Retrieval Law | ✅ N/A | Infrastructure layer only |
| III. Zero Hallucination | ✅ N/A | Infrastructure layer only |
| IV. CORS Policy | ✅ Pass | Port 8000 exposed for extension access |
| V. DOM Injection | ✅ N/A | Infrastructure layer only |

**Infrastructure Mapping**: All requirements satisfied.

---
*Plan created: 2026-03-08 | Status: Phase 1 Complete - Ready for /speckit.tasks*
