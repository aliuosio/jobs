# Feature Specification: Docker Infrastructure Setup

**Feature Branch**: `001-docker-infra`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Define docker-compose.yml with qdrant-db and api-backend services on rag-network bridge"

## Clarifications

### Session 2026-03-08

- Q: What restart policy should containers use when services fail? → A: `no` (never restart automatically; manual restart only)
- Q: Which Qdrant container image version should be used? → A: `latest` (use the latest Qdrant image for simplicity)
- Q: What logging driver should be configured for containers? → A: `none` (disable container logging entirely)
- Q: Should container resource limits (CPU/memory) be configured? → A: No limits (Docker manages resources dynamically)
- Q: How should the API backend health check be configured for dependency on qdrant-db? → A: Docker native health checks with retries (30s start period, 10s interval)
- Q: How should the Qdrant connection URL be configured for the API backend? → A: `.env` file (externalize configuration for flexibility)
- Q: Should a sample environment file template be provided? → A: Auto-generate (script creates `.env` if missing)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy Vector Database Service (Priority: P1)

As a developer, I need to deploy a Qdrant vector database instance with persistent storage so that resume embeddings can be stored and retrieved reliably.

**Why this priority**: The vector database is the foundational data layer. Without it, no RAG functionality can operate.

**Independent Test**: Run `docker-compose up qdrant-db` and verify the Qdrant dashboard is accessible at port 6333 and gRPC endpoint at port 6334.

**Acceptance Scenarios**:

1. **Given** a clean host environment, **When** I run the deployment command for the vector database service, **Then** the Qdrant container starts successfully and persists data to the host volume.
2. **Given** the vector database is running, **When** I restart the container, **Then** previously stored vectors remain available.
3. **Given** the vector database is running, **When** I access the dashboard endpoint, **Then** I see the Qdrant management interface.

---

### User Story 2 - Deploy API Backend Service (Priority: P1)

As a developer, I need to deploy the FastAPI backend that connects to the vector database so that the RAG pipeline can process form-filling requests.

**Why this priority**: The API backend is the orchestration layer that coordinates between the Firefox extension and the vector store.

**Independent Test**: Run `docker-compose up api-backend` and verify the API responds to health check requests on port 8000.

**Acceptance Scenarios**:

1. **Given** the vector database is running, **When** I start the API backend service, **Then** it successfully connects to the vector database via internal DNS.
2. **Given** both services are running, **When** I send a request to the API health endpoint, **Then** I receive a success response indicating database connectivity.
3. **Given** the API is running, **When** I attempt to access it from the host machine, **Then** the connection succeeds on the published port.

---

### User Story 3 - Network Isolation and DNS Resolution (Priority: P2)

As a DevOps engineer, I need services to communicate via a dedicated bridge network with internal DNS resolution so that the architecture remains secure and maintainable.

**Why this priority**: Proper networking enables secure inter-service communication and prevents external access to the vector database.

**Independent Test**: Execute a network inspection command and verify both services are attached to the dedicated bridge network with proper DNS names.

**Acceptance Scenarios**:

1. **Given** both services are deployed, **When** the API backend resolves the hostname `qdrant-db`, **Then** it correctly reaches the vector database container.
2. **Given** the bridge network is configured, **When** an external client attempts direct access to the vector database, **Then** only published ports are accessible (6333, 6334) while internal ports remain isolated.
3. **Given** services are restarted, **When** DNS resolution occurs, **Then** hostnames consistently resolve to correct container IPs.

---

### Edge Cases

- What happens when the host volume directory does not exist? (System MUST create it with appropriate permissions)
- What happens when the vector database fails to start? (API backend MUST wait with health check retry logic)
- What happens when the host lacks write permissions for the storage volume? (Deployment MUST fail with a clear error message)
- What happens when ports 6333, 6334, or 8000 are already in use? (Deployment MUST report port conflict)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a `qdrant-db` service using the `qdrant/qdrant:latest` container image.
- **FR-002**: System MUST expose Qdrant HTTP dashboard on port 6333 and gRPC endpoint on port 6334.
- **FR-003**: System MUST mount a persistent volume at `./qdrant_storage` for vector data.
- **FR-004**: System MUST define an `api-backend` service that builds from the local Dockerfile.
- **FR-005**: System MUST expose the API backend on port 8000 for host machine access.
- **FR-006**: System MUST configure the API backend to depend on the vector database service.
- **FR-007**: System MUST create a bridge network named `rag-network` for inter-service communication.
- **FR-008**: System MUST enable internal DNS resolution so `qdrant-db` resolves within the network.
- **FR-009**: System MUST ensure the host user has write permissions to `./qdrant_storage` directory (Unix mode 755 or 775).
- **FR-010**: System MUST gracefully handle the case where the storage directory does not exist by creating it.
- **FR-011**: System MUST NOT automatically restart containers on failure (restart: no policy).
- **FR-012**: System MUST disable container logging (logging driver: none).
- **FR-013**: System MUST NOT impose explicit CPU or memory limits (allow Docker to manage resources dynamically).
- **FR-014**: System MUST configure Docker-native health checks for the API backend with a 30-second start period and 10-second check interval.
- **FR-015**: System MUST use a `.env` file to externalize the Qdrant connection URL configuration for the API backend.
- **FR-016**: System MUST include a script to auto-generate the `.env` file with default values if it does not exist.

### Key Entities

- **Qdrant Service**: Containerized vector database with HTTP/gRPC interfaces, persistent storage, and network identity `qdrant-db`.
- **API Backend Service**: Containerized FastAPI application with network dependency on Qdrant, accessible from host.
- **Bridge Network**: Isolated Docker network providing DNS resolution and traffic isolation between services.
- **Storage Volume**: Host-mounted directory for persisting vector embeddings across container restarts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both services start successfully within 30 seconds of running the deployment command.
- **SC-002**: Vector data persists across container restarts with zero data loss.
- **SC-003**: API backend can resolve `qdrant-db` hostname and establish connection within 5 seconds of startup.
- **SC-004**: No port conflicts occur when deploying on a machine with the specified ports available.
- **SC-005**: Storage directory is created with correct permissions without manual intervention.

## Assumptions

- Docker and Docker Compose are installed on the deployment host.
- Ports 6333, 6334, and 8000 are available on the host machine.
- A valid Dockerfile exists in the project root for the API backend.
- The host filesystem supports standard Unix file permissions.
