# Research: Cover Letter Generation Issues

## Phase 0 Findings

### 1. Status Endpoint Implementation

**Location**: `src/api/routes.py`
**Current behavior**: Returns `{"letter_generated": false}` for non-existent job offers
**Required change**: Return 404 for non-existent job offers

### 2. Cache Implementation

**Location**: `src/utils/cache.py`
**Pattern**: `letterStatusCache` - in-memory cache with TTL
**Issue**: Not invalidated when generation triggers

### 3. Validation Patterns

**DELETE /job-offers/{id}**: Returns 404 when not found - the pattern to follow
**PATCH /job-offers/{id}**: Returns 404 when not found - the pattern to follow

## Webhook Configuration

| Environment | URL |
|-------------|-----|
| Host | http://localhost:5678/webhook-test/writer |
| Container | http://n8n:5678/webhook-test/writer |

**Environment detection**: Check for `HOSTNAME` or `/etc/hostname` inside container, or check for Docker env vars