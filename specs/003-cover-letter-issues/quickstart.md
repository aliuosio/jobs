# Quickstart: Cover Letter Generation Issues

## Prerequisites

- Docker and Docker Compose running
- PostgreSQL with `job_applications` table
- n8n running with webhook workflow

## Changes Required

### 1. Backend API (`src/api/routes.py`)

- Update letter status endpoint to check job offer exists first
- Return 404 if job offer not found

### 2. Cache (`src/utils/cache.py`)

- Invalidate cache when generation triggered

### 3. Extension UI (`extension/popup/`)

- Add error badge for polling failures
- Handle recovery from errors

### 4. Webhook Config

- Add environment detection for URL selection
- Use host or container URL as appropriate

## Testing

```bash
# Backend tests
docker compose exec api-backend pytest tests/ -k "letter"

# Integration tests
docker compose exec api-backend pytest tests/integration/
```

## Verification

| Test | Expected Result |
|------|-----------------|
| Status for non-existent job | 404 response |
| Status for valid job | {"letter_generated": true/false} |
| Cache after generation | Cleared/invalidated |
| Polling error | Error badge visible |