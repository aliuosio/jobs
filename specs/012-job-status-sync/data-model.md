# Data Model: Job Status Sync

## Overview
This feature extends the existing job offer data model to support real-time synchronization of processing status between the backend database and the Firefox extension.

## Existing Data Model
The system already implements the following data model for job offers and their processing status:

### Job Offer
- **id** (integer): Primary key
- **title** (string): Job posting title
- **url** (string): URL to job posting

### Job Offer Process
- **id** (integer): Primary key (process_id)
- **job_offers_id** (integer): Foreign key referencing job_offers.id
- **research** (boolean): Whether job research has been completed (default `false`)
- **research_email** (boolean): Whether research email has been sent (default `false`)
- **applied** (boolean): Whether job application has been submitted (default `false`)
- **created_at** (timestamp): Record creation time (default current_timestamp)
- **updated_at** (timestamp): Last update time (default current_timestamp, auto‑updated on change)

## Relationships
- One Job Offer can have zero or one Job Offer Process records
- The relationship is implemented via a foreign key constraint from `job_offers_process.job_offers_id` to `job_offers.id`
- When no process record exists for a job offer, the process data is considered null

## Data Flow
1. **Backend Database**: Stores canonical job offer and process data in PostgreSQL
2. **API Layer**: 
   - GET `/job-offers` returns job offers with embedded process data (or null)
   - PATCH `/job-offers/{id}/process` updates process data (upsert behavior)
3. **Real-time Synchronization**: 
   - Backend publishes process updates via Server-Sent Events (SSE)
   - Extension subscribes to SSE stream to receive immediate updates
4. **Extension Storage**: 
   - Temporarily stores received job offer data for display
   - No persistent storage (uses extension memory only)

## Extensions for This Feature
No changes to the existing database schema are required. The feature leverages:
- Existing `job_offers` table
- Existing `job_offers_process` table
- Existing API endpoints (with enhancement for SSE)
- Extension display logic (enhanced to show process flags)

## Validation Rules
- Process fields (`research`, `research_email`, `applied`) are optional booleans
- When inserting a new process record, missing fields default to `false`
- When updating an existing process record, missing fields preserve their current values
- Job offer ID must reference an existing job offer (foreign key constraint)

## API Contract Extensions
The existing API contracts are extended with:

### Server-Sent Events Stream
- **Endpoint**: `GET /api/v1/stream`
- **Response Format**: JSON array of all job offers with embedded process data:
  ```json
  [
    {
      "id": 123,
      "title": "Software Engineer",
      "url": "https://example.com/job/123",
      "process": { "research": true, "research_email": false, "applied": true }
    },
    ...
  ]
  ```
- **Event Type**: SSE `message` events (default event type)
- **Retry Mechanism**: Automatic reconnection with exponential backoff

## Extension Data Handling
The extension will:
1. Establish SSE connection to `/api/v1/stream` on initialization
2. Maintain an in‑memory map of job offer IDs to their latest process data
3. Update the UI immediately when new process data is received, displaying **only the `applied` status** (color‑coded: green for `false`, red for `true`)
4. Show empty state with retry button when SSE connection fails
5. Attempt to reconnect with exponential backoff on connection failure

## Security Considerations
- SSE endpoint should respect the same authentication/authorization as other API endpoints
- In this implementation, the API is internal and behind existing auth layer
- No additional security measures required beyond existing API protection