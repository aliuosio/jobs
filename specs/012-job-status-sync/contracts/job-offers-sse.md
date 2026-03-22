# Contract: Job Offers Server-Sent Events Stream

## Endpoint
**GET** `/api/v1/stream`

## Description
Provides real-time updates of all job offer process status via Server-Sent Events. Clients receive the complete dataset on each change, enabling simple cache replacement.

## Connection Parameters
- **Method**: GET
- **Path**: `/api/v1/stream`
- **Protocol**: HTTP/1.1
- **Authentication**: Same as other API endpoints (internal API, behind existing auth layer)
- **CORS**: Enabled for Firefox extension origin
- **Cache-Control**: no-cache
- **Content-Type**: text/event-stream
- **Connection**: keep-alive

## Event Format
Data is sent as Server-Sent Events with the default `message` event type. Each event contains a JSON array of all job offers with their latest process data.

```
data: [
  {
    "id": 123,
    "title": "Software Engineer",
    "url": "https://example.com/job/123",
    "process": {
      "research": true,
      "research_email": false,
      "applied": true
    }
  },
  ...
]
```

Where:
- Each element of the array is a job offer object with `id`, `title`, `url`, and `process` fields.
- `process`: Object containing process fields or `null` if no process record exists.
  - `research`: Boolean (default `false`)
  - `research_email`: Boolean (default `false`)
  - `applied`: Boolean (default `false`)

## Process Object Structure
When a process record exists:
```json
{
  "research": <boolean>,
  "research_email": <boolean>,
  "applied": <boolean>
}
```

When no process record exists for a job offer:
```json
null
```

## Example Event
```
data: [
  {
    "id": 123,
    "title": "Software Engineer",
    "url": "https://example.com/job/123",
    "process": {
      "research": true,
      "research_email": false,
      "applied": true
    }
  },
  {
    "id": 456,
    "title": "Frontend Developer",
    "url": "https://example.com/job/456",
    "process": null
  }
]
```

## Behavior
1. **Initial Connection**: Upon connection, the server sends the current state of all job offers (full array).
2. **Updates**: Whenever any job offer process data changes in the database, a new event is sent containing the updated full array.
3. **Heartbeat**: To prevent connection timeouts, the server may send comment lines (`: `) periodically.
4. **Reconnection**: Clients should implement automatic reconnection with exponential backoff.
5. **Error Handling**: HTTP error status codes indicate connection problems (503 for service unavailable, etc.).

## Implementation Notes
- Backend should broadcast the updated array to all connected clients when process data changes.
- The endpoint should respect the same request rate limiting as other API endpoints.
- Memory usage should be monitored for large numbers of connected clients.
- The full array approach simplifies client logic but may increase bandwidth for large datasets (acceptable for personal use).