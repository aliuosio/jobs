# Implementation Plan: Dockerfile to Docker Compose Migration

**Branch**: `011-dockerfile-to-compose` | **Date**: 2026-04-22 | **Spec**: spec.md
**Input**: Move all commands for the Dockerfiles to the docker-compose.yml and use a node 24 image on alpine3.23

## Summary

Migrate the extension development environment from using a separate Dockerfile to using inline Docker Compose commands with node:24-alpine3.23. This simplifies the project structure by removing the separate Dockerfile and uses a smaller, more modern Node.js image.

## Technical Context

**Base Image**: node:24-alpine3.23  
**Primary Commands**: `npm install && npm run dev` (inline in docker-compose.yml)  
**Storage**: N/A (dev environment only)  
**Testing**: Manual verification via docker-compose commands  
**Target Platform**: Docker local development  
**Project Type**: Development container configuration  
**Performance Goals**: Container starts in under 60 seconds  
**Constraints**: Must maintain hot-reload for development  
**Scale/Scope**: Single service (extension)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. SOLID/DRY | ✅ PASS | Configuration-only, no complex code |
| II. Design Patterns | ✅ PASS | N/A - not applicable to config migration |
| III. TDD | ⚠️ N/A | No code implemented - config change only |
| IV. n8n Workflow | N/A | Not applicable |
| V. Docker-Based | ✅ PASS | Directly implements Docker Compose deployment |

**Pre-Phase Check**: All gates pass - this is a Docker configuration change, not a code implementation.

---

## Phase 0: Research

**Research Required**: None - this is a straightforward Docker Compose configuration change with well-known best practices.

**Key Decision**: Use Alpine-based image for smaller footprint
- Decision: Use `node:24-alpine3.23` 
- Rationale: Smaller image size (~150MB vs ~1GB for Debian), latest Node.js features
- Alternatives considered: node:20-slim (larger), node:24 (Debian-based, larger)

---

## Phase 1: Design & Implementation

### Implementation Details

The Docker Compose service configuration will inline what was previously in `extension/Dockerfile.dev`:

1. **Image**: `node:24-alpine3.23` (replaces Dockerfile base)
2. **Working Directory**: `/app`
3. **Command**: `sh -c "npm install && npm run dev"`
4. **Volumes**: 
   - `./extension:/app` - source code for hot-reload
   - `/app/node_modules` - anonymous volume to preserve dependencies
5. **Ports**: 5173 (Vite dev server)
6. **Environment**: `NODE_ENV=development`

### Changes Required

| File | Change Type | Description |
|------|-------------|-------------|
| `docker-compose.yml` | Modify | Replace build section with image + command |
| `extension/Dockerfile.dev` | Delete | No longer needed |

### Verification Commands

```bash
# Start the service
docker-compose up -d extension

# Verify it's running
docker-compose ps extension

# Check the Node version inside
docker-compose exec extension node --version

# Test hot-reload (modify a file in extension/src, observe Vite recompiles)
```

---

## Project Structure

### Documentation (this feature)

```text
specs/011-dockerfile-to-compose/
├── plan.md              # This file
├── spec.md             # Feature specification
└── checklists/         # Quality checklists
```

### Changes (repository root)

```text
docker-compose.yml      # Modified - inline build commands
extension/
  └── Dockerfile.dev   # Deleted - no longer needed
```

---

## Complexity Tracking

No Constitution violations requiring justification. This is a simple configuration migration.

---

## Success Criteria Validation

| Criterion | Validation Method |
|-----------|------------------|
| SC-001: Single command start | `docker-compose up -d extension` |
| SC-002: Port 5173 in 60s | Check `docker-compose ps` |
| SC-003: Hot-reload <5s | Modify source, observe Vite |
| SC-004: Image <300MB | `docker images` inspect |