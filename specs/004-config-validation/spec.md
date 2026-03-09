# Feature Specification: Configuration Validation

**Feature Branch**: `004-config-validation`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Verify system configuration: internal DNS resolution, external endpoint calls, URL path formatting, embedding dimensions"

## Clarifications

### Session 2026-03-08

- Q: How should developers invoke configuration validation? → A: API endpoint (HTTP endpoint exposed on the backend)
- Q: What happens when a validation check times out? → A: Timed-out check reports status, independent checks continue, dependent checks are skipped


- Q: What should be the validation endpoint path? → A: `/validate` (simple, RESTful endpoint at root)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Internal Service Communication (Priority: P1)

As a developer deploying the system, I need to verify that the backend correctly uses internal Docker DNS to reach the vector database so that inter-service communication works reliably.

**Why this priority**: Without correct internal DNS resolution, the backend cannot connect to the vector database, breaking the entire system.

**Independent Test**: Send an HTTP GET request to the validation endpoint and receive a JSON response with check results.

**Acceptance Scenarios**:

1. **Given** both services are on the same Docker network, **When** the backend attempts to connect to `qdrant-db:6333`, **Then** the connection succeeds.
2. **Given** a configuration validation check, **When** it tests internal DNS resolution, **Then** it reports whether `qdrant-db` resolves correctly.
3. **Given** the vector database is healthy, **When** the backend performs a health check via internal DNS, **Then** a successful response is received.

---

### User Story 2 - Validate External Client Communication (Priority: P1)

As a developer, I need to verify that the browser extension correctly reaches the backend via the host's loopback address so that form-filling requests succeed.

**Why this priority**: The extension runs outside Docker and must use the published port to communicate with the backend.

**Independent Test**: Run a configuration check that sends a test request from the extension context to `localhost:8000` and verifies the response.

**Acceptance Scenarios**:

1. **Given** the backend is running and port 8000 is published, **When** a client sends a request to `localhost:8000`, **Then** the request reaches the backend.
2. **Given** a configuration validation check, **When** it tests external connectivity, **Then** it confirms `localhost:8000` is reachable.
3. **Given** CORS is properly configured, **When** the extension makes a cross-origin request, **Then** no CORS errors occur.

---

### User Story 3 - Validate API URL Formatting (Priority: P1)

As a developer, I need to verify that the inference API client is configured with the correct base URL so that requests do not fail due to malformed paths like `/v1/v1`.

**Why this priority**: A malformed URL causes all inference requests to fail with 404 errors.

**Independent Test**: Run a configuration check that validates the base URL format and tests a sample API call.

**Acceptance Scenarios**:

1. **Given** the inference client is configured, **When** it constructs the full API URL, **Then** the path does not contain duplicated `/v1` segments.
2. **Given** a configuration validation check, **When** it inspects the base URL setting, **Then** it reports whether the format is correct.
3. **Given** a correctly formatted URL, **When** a test request is sent, **Then** the API responds successfully.

---

### User Story 4 - Validate Embedding Dimensions (Priority: P1)

As a developer, I need to verify that the embedding model is configured to produce 1536-dimensional vectors so that they are compatible with the inference provider.

**Why this priority**: Dimension mismatches cause retrieval failures or runtime errors.

**Independent Test**: Run a configuration check that generates a sample embedding and verifies its dimension count.

**Acceptance Scenarios**:

1. **Given** the embedding model is loaded, **When** it generates an embedding, **Then** the vector has exactly 1536 dimensions.
2. **Given** a configuration validation check, **When** it tests embedding generation, **Then** it reports the actual dimension count.
3. **Given** vectors stored in the database, **When** their dimensions are checked, **Then** all are 1536-dimensional.

---

### Edge Cases

- What happens when internal DNS fails to resolve? (Validation MUST report the specific hostname that failed)
- What happens when the external port is blocked by a firewall? (Validation MUST detect and report connectivity issues)
- What happens when the base URL has trailing slashes? (Validation MUST normalize and report the corrected format)
- What happens when embeddings were created with a different model? (Validation MUST detect dimension mismatches in stored data)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a validation endpoint at `/validate` (HTTP GET) that runs all configuration checks and returns results.
- **FR-002**: Validation MUST verify the backend can reach the vector database via internal DNS (`qdrant-db:6333`).
- **FR-003**: Validation MUST verify external clients can reach the backend via `localhost:8000`.
- **FR-004**: Validation MUST check that the inference API base URL does not result in path duplication.
- **FR-005**: Validation MUST verify all embeddings are 1536-dimensional.
- **FR-006**: Validation MUST report clear success/failure status for each check.
- **FR-007**: Validation MUST provide actionable error messages when checks fail.
- **FR-008**: Validation MUST be runnable without side effects (read-only checks).
- **FR-009**: Validation MUST apply a 10-second timeout per check. When a check times out, the timed-out check reports `status: "timeout"`, independent checks continue, and dependent checks are skipped with reason documented.

### Key Entities

- **Configuration Check**: An individual validation test for a specific configuration aspect.
- **Validation Report**: A summary of all check results with pass/fail status and details.
- **Connection Test**: A test that verifies network connectivity between components.
- **Dimension Verification**: A test that confirms embedding vector dimensions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four critical configuration checks complete within 10 seconds; if any check times out, the entire validation fails.
- **SC-002**: Validation reports clearly identify which configuration is incorrect when failures occur.
- **SC-003**: Zero false positives in configuration validation (passing checks mean configuration is correct).
- **SC-004**: Developers can diagnose configuration issues without inspecting source code.
- **SC-005**: Validation catches 100% of common misconfigurations (wrong hostnames, duplicated paths, wrong dimensions).

## Assumptions

- Docker networking is functioning correctly for internal DNS resolution.
- The host machine allows loopback connections to published container ports.
- API credentials are valid for testing connectivity.
- Embedding API credentials are valid for generating test embeddings (dimension check uses a fresh "test" query, not stored vectors).
