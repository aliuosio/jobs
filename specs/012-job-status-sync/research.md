# Research Summary

## Technical Context Analysis
Based on the feature specification and codebase review, the following technical context is established:

- **Backend**: Python 3.11+ with FastAPI, asyncpg, Pydantic
- **Frontend**: Firefox extension with JavaScript ES6+
- **Storage**: PostgreSQL with existing `job_offers` and `job_offers_process` tables
- **Communication**: HTTP API with JSON; clarified need for real-time updates (WebSocket/SSE)
- **Error Handling**: Clarified need for empty state with retry on API failure

## Key Findings from Codebase
1. **Existing API Patterns**: 
   - REST endpoints in `src/api/routes.py` follow async pattern with dependency injection
   - Pydantic schemas in `src/api/schemas.py` for request/response validation
   - Service layer in `src/services/` handles database operations

2. **Real-time Communication Options**:
   - WebSocket: Full duplex, suitable for server-to-client updates
   - Server-Sent Events (SSE): Server-to-client streaming, simpler for this use case
   - Both are compatible with existing FastAPI infrastructure

3. **Database Schema**:
   - `job_offers_process` table exists with columns: `id`, `job_offers_id`, `research`, `research_email`, `applied`
   - Upsert behavior already implemented in `JobOffersService.update_job_offer_process()`

## Decisions Made

### Real-time Update Mechanism
**Decision**: Use Server-Sent Events (SSE) for real-time updates from backend to extension
**Rationale**: 
- Simpler implementation than WebSockets for server-to-client streaming
- Automatic reconnection handling in browsers
- Compatible with existing HTTP infrastructure
- Lower overhead for this use case (extension only needs to receive updates)
**Alternatives Considered**: 
- WebSocket: More complex, bidirectional communication not needed
- Polling: Would not meet real-time requirements (1 second update goal)

### SSE Endpoint Design
**Decision**: Endpoint path `/api/v1/stream`, returning a JSON array of all job offers with their process data
**Rationale**:
- Centralized stream delivers complete state; extension can replace its local cache on each update
- JSON array is simple to parse and matches existing API response patterns
- Avoids delta calculations on the backend; each update includes the full dataset
**Alternatives Considered**:
- Delta‑only stream: Reduces payload but requires the extension to maintain merge logic and handle missing updates
- Individual event per job offer: More granular but increases the number of events and parsing complexity

### Concurrent Update Handling
**Decision**: Last‑write‑wins (overwrite with latest timestamp)
**Rationale**:
- Process updates are independent and non‑critical; a lost update is acceptable
- Simplicity outweighs the minimal risk of concurrent edits
- Aligns with the best‑effort reliability (no SLA) clarification
**Alternatives Considered**:
- Optimistic locking: Adds a version column and rejection logic; unnecessary complexity for this domain
- Queue serialization: Requires a queue infrastructure; over‑engineered for single‑user scenarios

### Extension UI Display
**Decision**: Show only the `applied` status flag, color‑coded (green = not applied, red = applied)
**Rationale**:
- Simplifies the extension UI; users primarily need to know whether they have applied
- Reduces visual clutter and cognitive load
- Matches the clarified requirement that other statuses are irrelevant to the job link list
**Alternatives Considered**:
- Display all three flags: Provides more information but clutters the list and may distract from the primary action (apply)
- Icons with tooltips: Adds accessibility but increases design effort without user demand

### Backend API Compatibility
**Decision**: The existing `/job‑offers` endpoint will continue to return full process data (research, research_email, applied). The extension will ignore the unused fields.
**Rationale**:
- Maintains backward compatibility with any other consumers
- Avoids modifying the existing API contract; reduces risk of breaking changes
- Simpler than creating a separate minimal endpoint
**Alternatives Considered**:
- Create a new `/job‑offers/minimal` endpoint: Extra maintenance burden, no current need
- Filter fields in the existing endpoint: Would require conditional logic and break existing clients

### Error Handling for API Unavailability
**Decision**: Show empty state with prominent retry button when backend API is unavailable
**Rationale**:
- Provides clear user action to retry when service recovers
- Avoids showing potentially stale data
- Simple to implement and understand
**Alternatives Considered**:
- Show cached data with warning: Risk of users acting on outdated information
- Automatic retry: Could frustrate users if service is down for extended period
- Show error message: Less actionable than retry button

### Data Model
**Decision**: `job_offers_process` table includes timestamps (`created_at`, `updated_at`) and boolean flags with defaults
**Rationale**:
- Timestamps enable auditing and last‑write‑wins conflict resolution
- Boolean defaults (false) simplify insertion; a job offer starts as “not applied”
- Matches the clarified schema
**Alternatives Considered**:
- No timestamps: Would require an additional version column for concurrency control
- Nullable booleans: Would complicate queries and application logic

## References
- Existing patterns in `src/api/routes.py` for endpoint implementation
- Existing patterns in `src/services/job_offers.py` for database operations
- Firefox extension WebSocket/SSE APIs: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events