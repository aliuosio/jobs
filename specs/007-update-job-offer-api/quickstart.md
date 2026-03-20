# Quickstart: Update Job Offer Process API

**Feature**: `007-update-job-offer-api`  
**Date**: 2026-03-20

## Testing the New Endpoint

### Prerequisites

```bash
# Start the Docker stack
docker-compose up -d

# Verify services are running
curl http://localhost:8000/health
```

### Test 1: Full Update

```bash
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{
    "research": true,
    "research_email": true,
    "applied": true
  }'
```

**Expected Response**:
```json
{
  "id": 1,
  "title": "Software Engineer",
  "url": "https://example.com/job/1",
  "process": {
    "job_offers_id": 1,
    "research": true,
    "research_email": true,
    "applied": true
  }
}
```

### Test 2: Partial Update

```bash
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{"applied": true}'
```

**Expected Response**: Other fields preserved, only `applied` changed.

### Test 3: Empty Update (No-op)

```bash
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**: Returns current state unchanged (200 OK).

### Test 4: Job Offer Not Found

```bash
curl -X PATCH http://localhost:8000/job-offers/99999/process \
  -H "Content-Type: application/json" \
  -d '{"applied": true}'
```

**Expected Response**: 404 Not Found with error message.

### Test 5: Invalid ID Format

```bash
curl -X PATCH http://localhost:8000/job-offers/abc/process \
  -H "Content-Type: application/json" \
  -d '{"applied": true}'
```

**Expected Response**: 400 Bad Request with validation error.

### Test 6: Create New Process Record

```bash
# Assuming job offer 5 exists but has no process record
curl -X PATCH http://localhost:8000/job-offers/5/process \
  -H "Content-Type: application/json" \
  -d '{"research": true}'
```

**Expected Response**: Creates new process record with `research: true`, others defaulting to false.

## Running Tests

```bash
# Run unit tests
pytest tests/unit/test_job_offers_service.py -v

# Run integration tests
pytest tests/integration/test_job_offers_update.py -v

# Run all tests
pytest tests/ -v
```

## Verification Checklist

- [ ] Endpoint responds to PATCH requests
- [ ] Partial updates preserve existing fields
- [ ] Upsert creates process record if not exists
- [ ] 404 returned for non-existent job offer
- [ ] 400 returned for invalid ID format
- [ ] Response includes full job offer with process
- [ ] Response time < 500ms
