# Tasks: Docker Infrastructure Setup

**Input**: Design documents from `/specs/001-docker-infra/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/env-schema.md

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Infrastructure files**: Repository root level (docker-compose.yml, .env.example, .gitignore)
- **Scripts**: `scripts/` directory
- **Storage**: `qdrant_storage/` (auto-created by Docker)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and scripts directory

- [ ] T001 Create `scripts/` directory for infrastructure utilities
- [ ] T002 [P] Verify Docker and Docker Compose are installed and accessible

---

## Phase 2: Foundational (Environment Setup)

**Purpose**: Environment configuration that MUST be complete before services can be deployed

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create `.env.example` template file at repository root with all required variables per contracts/env-schema.md
- [ ] T004 Create `scripts/init-env.sh` script to auto-generate `.env` file if missing
- [ ] T005 Create or update `.gitignore` to exclude `.env` and `qdrant_storage/`

**Checkpoint**: Environment setup ready - service deployment can now begin

---

## Phase 3: User Story 1 - Deploy Vector Database Service (Priority: P1) 🎯 MVP

**Goal**: Deploy a Qdrant vector database instance with persistent storage so that resume embeddings can be stored and retrieved reliably.

**Independent Test**: Run `docker-compose up qdrant-db` and verify the Qdrant dashboard is accessible at `http://localhost:6333` and gRPC endpoint at port 6334.

### Implementation for User Story 1

- [ ] T006 [US1] Add `qdrant-db` service definition to `docker-compose.yml` with `qdrant/qdrant:latest` image
- [ ] T007 [US1] Configure qdrant-db ports mapping (6333:6333, 6334:6334) in docker-compose.yml
- [ ] T008 [US1] Configure qdrant-db volume mount `./qdrant_storage:/qdrant/storage` in docker-compose.yml
- [ ] T009 [US1] Add qdrant-db TCP health check with 30s start period and 10s interval in docker-compose.yml
- [ ] T010 [US1] Set qdrant-db restart policy to `no` per FR-011 in docker-compose.yml
- [ ] T011 [US1] Configure qdrant-db logging driver as `none` per FR-012 in docker-compose.yml
- [ ] T012 [US1] Add qdrant-db to `rag-network` bridge network in docker-compose.yml
- [ ] T013 [US1] Set qdrant-db environment variable `QDRANT__LOG_LEVEL=INFO` in docker-compose.yml

**Checkpoint**: At this point, User Story 1 should be fully functional - qdrant-db should start, persist data, and be accessible at localhost:6333

---

## Phase 4: User Story 2 - Deploy API Backend Service (Priority: P1)

**Goal**: Deploy the FastAPI backend that connects to the vector database so that the RAG pipeline can process form-filling requests.

**Independent Test**: Run `docker-compose up api-backend` and verify the API responds to health check requests on `http://localhost:8000/health`.

### Implementation for User Story 2

- [ ] T014 [US2] Add `api-backend` service definition to docker-compose.yml with build context `.`
- [ ] T015 [US2] Configure api-backend port mapping (8000:8000) in docker-compose.yml
- [ ] T016 [US2] Set api-backend dependency on qdrant-db with health condition in docker-compose.yml
- [ ] T017 [US2] Add api-backend curl-based health check (`/health` endpoint) with 30s start period in docker-compose.yml
- [ ] T018 [US2] Set api-backend restart policy to `no` per FR-011 in docker-compose.yml
- [ ] T019 [US2] Configure api-backend logging driver as `none` per FR-012 in docker-compose.yml
- [ ] T020 [US2] Add api-backend to `rag-network` bridge network in docker-compose.yml
- [ ] T021 [US2] Configure api-backend environment variables from `.env` file (QDRANT_URL, ZAI_API_KEY, ZAI_BASE_URL) in docker-compose.yml

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - api-backend should connect to qdrant-db and respond to health checks

---

## Phase 5: User Story 3 - Network Isolation and DNS Resolution (Priority: P2)

**Goal**: Services communicate via a dedicated bridge network with internal DNS resolution so that the architecture remains secure and maintainable.

**Independent Test**: Execute `docker network inspect rag-network` and verify both services are attached with proper DNS names.

### Implementation for User Story 3

- [ ] T022 [US3] Define `rag-network` bridge network in docker-compose.yml networks section
- [ ] T023 [US3] Verify both services (qdrant-db, api-backend) reference rag-network in their network configurations
- [ ] T024 [US3] Validate internal DNS resolution by confirming service names match container names (qdrant-db, api-backend)

**Checkpoint**: All user stories should now be independently functional with proper network isolation

---

## Phase 6: Polish & Documentation

**Purpose**: Final validation and documentation updates

- [ ] T025 [P] Update quickstart.md with validated deployment instructions
- [ ] T026 [P] Verify all port mappings (6333, 6334, 8000) are documented in quickstart.md
- [ ] T027 Run full deployment test: `docker-compose up` and verify both services start successfully
- [ ] T028 Verify data persistence: restart containers and confirm qdrant_storage data persists
- [ ] T029 Verify `qdrant_storage/` directory is created with permissions 755 and host user has write access

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 but US2 depends on US1 service definition for network reference
  - US3 can proceed after US1 and US2 service definitions exist
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after US1 network reference is defined (T012) - Depends on qdrant-db for health condition
- **User Story 3 (P2)**: Can start after US1 and US2 service definitions - Validates network configuration

### Within Each User Story

- Service definition before configuration
- Core configuration (image, ports) before optional settings (health checks, logging)
- Network configuration after service is defined

### Parallel Opportunities

- T001 and T002 can run in parallel (different operations)
- T003 and T004 can run in parallel (different files)
- Within US1: T006-T008 can be done together (core service config)
- Within US2: T014-T015 can be done together (core service config)
- T025 and T026 can run in parallel (documentation updates)

---

## Parallel Example: User Story 1 Core Configuration

```bash
# These tasks can be done together in the same docker-compose.yml edit session:
Task: "Add qdrant-db service definition to docker-compose.yml"
Task: "Configure qdrant-db ports mapping in docker-compose.yml"
Task: "Configure qdrant-db volume mount in docker-compose.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (qdrant-db service)
4. **STOP and VALIDATE**: Test `docker-compose up qdrant-db`, access dashboard at localhost:6333
5. Deploy/demo if ready - vector database is operational

### Incremental Delivery

1. Complete Setup + Foundational → Environment ready
2. Add User Story 1 → Test independently → qdrant-db running (MVP!)
3. Add User Story 2 → Test independently → Full stack operational
4. Add User Story 3 → Test independently → Network validated
5. Each story adds value without breaking previous stories

### Single Developer Strategy

Recommended order for one developer:

1. T001-T002: Setup (5 min)
2. T003-T005: Foundational (15 min)
3. T006-T013: User Story 1 - qdrant-db (20 min)
4. T014-T021: User Story 2 - api-backend (20 min)
5. T022-T024: User Story 3 - Network (10 min)
6. T025-T028: Polish (15 min)

**Total estimated time**: ~85 minutes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- docker-compose.yml modifications accumulate across stories
- Stop at any checkpoint to validate story independently
- `.env` file must be created before api-backend can start successfully
- Verify Docker daemon is running before starting deployment tasks
