# Feature Specification: RAG Backend API

**Feature Branch**: `002-rag-backend`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "FastAPI backend with LangChain RAG pipeline, CORS for Firefox extension, Z.ai API provider"

## Clarifications

### Session 2026-03-08

- Q: Which Qdrant client library should be used for vector store operations? → A: `qdrant-client` (use official Qdrant Python client library)
- Q: How should rate limiting be handled? → A: `exponential backoff` (retry with increasing delays 1s, 2s, 4s, 8s...)
- Q: What endpoints should be exposed? → A: `/fill-form` + `/health` + `/health` (two endpoints: fill-form and health)
- Q: How should configuration be managed? → A: `.env` + `.env.example` (use .env with .env.example as template)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Contextual Answers (Priority: P1)

As a job applicant using the browser extension, I need the backend to generate accurate answers based on my resume data so that form fields are filled with relevant, truthful information.

**Why this priority**: This is the core value proposition - without answer generation, the entire system serves no purpose.

**Independent Test**: Send a POST request with a form label (e.g., "Years of Python experience") and receive an answer derived from the resume vector store.

**Acceptance Scenarios**:

1. **Given** the vector store contains resume embeddings, **When** the API receives a label query, **Then** it retrieves the top 5 relevant context chunks and generates a grounded answer.
2. **Given** a query about experience not in the resume, **When** the system generates a response, **Then** it explicitly states the information is not available rather than fabricating details.
3. **Given** a valid request, **When** the response is returned, **Then** it completes within 5 seconds.

---

### User Story 2 - Cross-Origin Access for Extension (Priority: P1)

As the browser extension, I need to communicate with the backend API without CORS errors so that form-filling requests succeed from any job board domain.

**Why this priority**: Without CORS configuration, the extension cannot communicate with the backend at all.

**Independent Test**: From a Firefox extension context, make a fetch request to the API health endpoint and receive a successful response.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** a request arrives from a `moz-extension://` origin, **Then** the API accepts and processes it.
2. **Given** the API is running, **When** a request arrives from `localhost`, **Then** the API accepts and processes it.
3. **Given** a preflight OPTIONS request from an allowed origin, **When** the API responds, **Then** appropriate CORS headers are included.

---

### User Story 3 - Connect to Vector Database (Priority: P1)

As the backend service, I need to establish a reliable connection to the vector database so that resume embeddings can be retrieved for answer generation.

**Why this priority**: The RAG pipeline cannot function without vector database connectivity.

**Independent Test**: Start the backend and verify it can ping the vector database health endpoint and retrieve sample embeddings.

**Acceptance Scenarios**:

1. **Given** the vector database is running, **When** the backend starts, **Then** it successfully establishes a connection.
2. **Given** the vector database is temporarily unavailable, **When** the backend attempts to connect, **Then** it retries with exponential backoff.
3. **Given** a healthy connection, **When** a retrieval query is executed, **Then** results return within 2 seconds.

---

### Edge Cases

- What happens when the vector store returns no relevant context? (System MUST return a "no relevant experience found" response)
- What happens when the inference API rate limits? (System MUST queue requests and retry with backoff)
- What happens when the request payload exceeds size limits? (System MUST reject with a clear error message)
- What happens when the inference API returns an error? (System MUST return a graceful fallback response with `has_data: false`, `confidence: "none"`, and a user-friendly message)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose an endpoint that accepts form label text and returns generated answers.
- **FR-002**: System MUST query the vector store with k=5 to retrieve relevant context chunks.
- **FR-003**: System MUST use an OpenAI-compatible client with custom base URL for the inference provider.
- **FR-004**: System MUST include a system prompt that explicitly forbids fabricating experience not in the context.
- **FR-005**: System MUST configure CORS to whitelist `moz-extension://*` and `localhost` origins.
- **FR-006**: System MUST connect to the vector database using the internal Docker DNS hostname.
- **FR-007**: System MUST use 1536-dimensional embeddings compatible with the inference provider.
- **FR-008**: System MUST return responses in JSON format with the generated answer.
- **FR-009**: System MUST handle connection failures to the vector database with retry logic.
- **FR-010**: System MUST log all requests and errors for debugging purposes.

### Key Entities

- **Answer Request**: Contains the form field label and optional context hints.
- **Answer Response**: Contains the generated answer text and metadata about retrieval.
- **Vector Store Connection**: Configuration for connecting to the Qdrant instance.
- **Inference Client**: OpenAI-compatible client configured with custom base URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive relevant answers to form field queries within 5 seconds (P95 latency threshold).
- **SC-002**: Extension requests succeed without CORS errors from any job board domain.
- **SC-003**: Vector store connection establishes within 10 seconds of backend startup.
- **SC-004**: Zero fabricated experiences appear in generated answers.
- **SC-005**: API remains responsive under 10 concurrent requests.

## Assumptions

- The vector database is populated with resume embeddings before answer generation.
- The inference API credentials are configured via environment variables.
- The Docker network provides internal DNS resolution for service discovery.
- Request payloads are under 10KB in size.
