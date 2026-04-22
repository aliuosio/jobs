# Feature Specification: Dockerfile to Docker Compose Migration

**Feature Branch**: `011-dockerfile-to-compose`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "move all commands for the Dockerfiles to the docker-compose.yml and use a node 24 image on alpine3.23"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use node:24-alpine3.23 Image (Priority: P1)

As a developer, I want the extension container to use the newer Node.js 24 on Alpine 3.23 base image so that I have access to the latest Node.js features and a smaller image footprint.

**Why this priority**: Using the latest Node.js version ensures compatibility with modern JavaScript features and provides security updates. Alpine-based images are significantly smaller than Debian-based images.

**Independent Test**: Can be verified by checking the container logs for the Node.js version on startup.

**Acceptance Scenarios**:

1. **Given** Docker Compose is running, **When** the extension service starts, **Then** the container uses node:24-alpine3.23
2. **Given** The container is running, **When** I check the Node.js version, **Then** it shows v24.x

---

### User Story 2 - Inline Build Commands (Priority: P1)

As a developer, I want the Dockerfile commands to be defined directly in docker-compose.yml so that there's a single source of truth for the container setup.

**Why this priority**: Eliminates the need for a separate Dockerfile file, simplifying the project structure and reducing maintenance overhead.

**Independent Test**: Can be verified by running `docker-compose up -d extension` and checking that the service starts correctly.

**Acceptance Scenarios**:

1. **Given** The docker-compose.yml is configured, **When** I run `docker-compose up -d extension`, **Then** the container builds and starts successfully
2. **Given** The service is running, **When** I inspect the container, **Then** it has all the expected tools (npm, git, curl)

---

### User Story 3 - Volume Mapping for Development (Priority: P2)

As a developer, I want the source code to be mounted as a volume so that changes hot-reload during development.

**Why this priority**: Enables rapid development iteration without rebuilding the container.

**Independent Test**: Can be verified by modifying a source file and observing the Vite dev server reloads.

**Acceptance Scenarios**:

1. **Given** The extension service is running, **When** I modify a file in extension/src/, **Then** the changes are reflected within seconds
2. **Given** The volume is mounted, **When** I install a new npm package, **Then** node_modules is preserved separately

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Docker Compose extension service MUST use `node:24-alpine3.23` as the base image
- **FR-002**: Container MUST include npm, git, and curl for development
- **FR-003**: Container MUST run `npm install && npm run dev` on startup
- **FR-004**: Source code MUST be mounted as a volume for hot-reload
- **FR-005**: node_modules MUST be preserved as an anonymous volume to avoid reinstalling on every change

### Key Entities

- **Extension Service**: The Docker Compose service that runs the React extension development environment

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The extension container starts successfully with a single `docker-compose up -d extension` command
- **SC-002**: The Vite dev server becomes available on port 5173 within 60 seconds of startup
- **SC-003**: Changes to source files are reflected within 5 seconds (hot-reload)
- **SC-004**: The container image is smaller than 300MB (Alpine advantage)

---

## Assumptions

- Docker and Docker Compose are installed on the developer's machine
- The extension service is the only service that needs this migration
- No production build is needed in the container (handled by local build)