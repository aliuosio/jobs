# Quick Start: Job Status Sync

## Overview
This guide provides instructions for testing the job status synchronization feature between the backend API and the Firefox extension.

## Prerequisites
- Docker and Docker Compose
- Firefox browser
- Completed implementation of the feature (backend API with SSE endpoint and extension with SSE client)

## Backend API Testing

### 1. Start Services
```bash
docker-compose up -d
```

### 2. Verify Backend Health
```bash
curl http://localhost:8000/health
```

### 3. Test SSE Endpoint
```bash
curl -N http://localhost:8000/api/v1/stream
```
*Note: This will keep the connection open waiting for events. Press Ctrl+C to stop.*

### 4. Test Process Updates
In another terminal:
```bash
# Update a job offer process
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{"research": true}'
```

You should see an SSE event in the first terminal (JSON array of all job offers):
```
data: [
  {
    "id": 1,
    "title": "Example Job",
    "url": "https://example.com/job/1",
    "process": {"research": true, "research_email": false, "applied": false}
  },
  ...
]
```

## Extension Testing

### 1. Load Extension
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `extension/` directory

### 2. Test Connection
1. Click the extension icon in the toolbar
2. The extension should attempt to connect to the SSE endpoint (`/api/v1/stream`)
3. If successful, you'll see a "Connected" indicator
4. If the backend is unavailable, you'll see an empty state with a retry button
5. **Note**: The extension displays only the `applied` status flag (color‑coded: green for not applied, red for applied).

### 3. Test Real-time Updates
1. With the extension loaded and connected
2. Update a job offer process via API (as shown above)
3. The extension should immediately update the displayed status for that job offer

## Manual Testing Scenarios

### Scenario 1: Normal Operation
1. Backend API is running
2. Extension loads and connects to SSE stream
3. Initial job offers displayed with correct process status
4. Process updates received in real-time and reflected in UI

### Scenario 2: API Unavailable
1. Stop backend API: `docker-compose stop api-backend`
2. Extension detects disconnection and shows empty state with retry button
3. Restart backend API: `docker-compose start api-backend`
4. User clicks retry button
5. Extension reconnects and displays updated job offer data

### Scenario 3: Concurrent Updates
1. Multiple process updates sent rapidly for same job offer
2. Extension receives and displays each update in sequence
3. Final status reflects the last received update

## Troubleshooting

### Extension Not Connecting
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check SSE endpoint accessibility: `curl -N http://localhost:8000/api/v1/stream`
3. Check extension console for errors (right-click extension → Inspect)

### No Real-time Updates
1. Verify backend SSE endpoint is working (test with curl as above)
2. Check extension is subscribed to correct event type
3. Verify extension is processing received events correctly

### Stale Data Displayed
1. Confirm backend is publishing updates to SSE stream
2. Verify extension is not caching old data incorrectly
3. Check that extension updates its internal state on each SSE event