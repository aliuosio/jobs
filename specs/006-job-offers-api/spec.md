# Feature Specification: Job Offers API Endpoint

**Feature Branch**: `006-job-offers-api`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "create an fastapi endpoint to get the job offers id, title, url from the postgres db n8n in table job_offers also connect to job_offers_process to get all columns."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retrieve Job Offers List (Priority: P1)

As a developer integrating with the job application system, I want to retrieve a list of job offers with their basic information (id, title, url) and associated processing data so that I can display job listings with status information in external applications.

**Why this priority**: This is the core data access requirement. Without this endpoint, external systems cannot access the job offers data stored in the PostgreSQL database.

**Independent Test**: Can be fully tested by making a GET request to the endpoint and verifying the response contains job offers with id, title, url, and process data.

**Acceptance Scenarios**:

1. **Given** the API endpoint is available, **When** I make a GET request to `/job-offers`, **Then** I receive a JSON response containing job offers with id, title, and url fields.
2. **Given** the job_offers table has records, **When** I request the endpoint, **Then** each job offer includes associated job_offers_process data with all columns.
3. **Given** the database connection is configured, **When** the endpoint is called, **Then** it connects to the PostgreSQL database named "n8n".

---

### User Story 2 - Filter and Pagination Support (Priority: P2)

As a developer, I want to optionally filter and paginate job offers results so that I can efficiently retrieve subsets of data for large datasets.

**Why this priority**: Practical usability - job databases can grow large, and unbounded queries impact performance.

**Independent Test**: Can be tested by calling the endpoint with various query parameters and verifying correct filtering/pagination behavior.

**Acceptance Scenarios**:

1. **Given** the endpoint supports pagination, **When** I request with `?limit=10&offset=20`, **Then** I receive 10 records starting from position 20.
2. **Given** I only need specific fields, **When** I request with `?fields=id,title`, **Then** I receive only the requested fields in the response.

---

### User Story 3 - Error Handling for Database Issues (Priority: P3)

As a developer, I want clear error responses when database issues occur so that I can handle failures gracefully in my integration.

**Why this priority**: Reliability - robust error handling improves system observability and debugging.

**Independent Test**: Can be tested by simulating database connection failures and verifying appropriate error responses.

**Acceptance Scenarios**:

1. **Given** the database is unavailable, **When** I request the endpoint, **Then** I receive a 503 Service Unavailable response with a descriptive error message.
2. **Given** the database query fails, **When** I request the endpoint, **Then** I receive a 500 Internal Server Error with appropriate logging.

---

### Edge Cases

- What happens when job_offers has no matching records in job_offers_process? (Return job offer with null process data)
- What happens when both tables are empty? (Return empty array)
- What happens with very long URLs or titles? (Return as-is, no truncation)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a GET endpoint `/job-offers` that returns job offers data.
- **FR-002**: System MUST connect to PostgreSQL database named "n8n".
- **FR-003**: System MUST query the `job_offers` table for columns: id, title, url.
- **FR-004**: System MUST join with `job_offers_process` table to include all columns from that table.
- **FR-005**: System MUST return data in JSON format.
- **FR-006**: System MUST handle the case where a job_offer has no corresponding job_offers_process record (LEFT JOIN behavior).
- **FR-007**: System MUST follow existing project patterns for FastAPI routes (see `src/api/routes.py`).
- **FR-008**: System MUST return all records by default (no limit) unless pagination parameters are explicitly provided (clarified 2026-03-20).
- **FR-009**: System MUST order results by `job_offers.id` ascending by default (clarified 2026-03-20).

### Non-Functional Requirements

- **NFR-001**: Endpoint response time MUST be under 500ms for datasets up to 1000 records.
- **NFR-002**: Database connection MUST use connection pooling or async patterns for efficiency.
- **NFR-003**: All database errors MUST be logged with appropriate context.

### Key Entities

- **JobOffer**: Core job listing entity. Attributes: `id` (primary key), `title`, `url`.
- **JobOfferProcess**: Processing metadata for job offers. Attributes: `job_offer_id` (foreign key → `job_offers.id`), plus all other columns from `job_offers_process` table (schema to be determined from database).
- **JobOfferWithProcess**: Combined response entity with nested structure: `{id, title, url, process: {...all JobOfferProcess columns or null}}` (clarified 2026-03-20).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can retrieve all job offers with process data via a single API call.
- **SC-002**: 100% of job_offers records are returned with their associated process data when it exists.
- **SC-003**: Response time is under 500ms for typical dataset sizes.
- **SC-004**: Endpoint follows existing project API patterns and conventions.

---

## Assumptions

- The `job_offers` and `job_offers_process` tables join via `job_offers_process.job_offer_id` → `job_offers.id` (clarified 2026-03-20).
- The relationship is one-to-one: each job offer has at most one process record (clarified 2026-03-20).
- The PostgreSQL database "n8n" is accessible from the FastAPI application environment.
- Database credentials will be configured via environment variables (following existing `src/config.py` patterns).
- The endpoint is read-only; no write operations are required.
- Async database access (e.g., asyncpg) is preferred for consistency with the existing async FastAPI architecture.

## Out of Scope

- Write operations (POST, PUT, DELETE) for job offers.
- Real-time updates or websockets.
- Authentication/authorization (unless required by existing API patterns).
- Caching layer (can be added later if needed).

## Clarifications

### Session 2026-03-20

- Q: What is the join key between `job_offers` and `job_offers_process` tables? → A: `job_offers_process.job_offer_id` → `job_offers.id` (foreign key)
- Q: What is the relationship cardinality between `job_offers` and `job_offers_process`? → A: One-to-one: Each job offer has at most one process record
- Q: What should be the default maximum number of records returned when no pagination parameters are provided? → A: No limit (return all records)
- Q: What ordering should be applied to the results by default? → A: Order by `id` ascending
- Q: How should the response structure combine job offer and process data? → A: Nested: `{id, title, url, process: {...process columns...}}`
