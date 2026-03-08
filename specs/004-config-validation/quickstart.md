# Quickstart: Configuration Validation

**Feature**: 004-config-validation
**Date**: 2026-03-08

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (`.env` file with `ZAI_API_KEY`, `ZAI_BASE_URL`)
- Vector store running (Qdrant)

## Quick Start

### 1. Start Services

```bash
docker-compose up -d
```

### 2. Run Configuration Validation

```bash
curl http://localhost:8000/validate
```

### 3. Check Results

**Successful validation** returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "total_duration_ms": 561,
  "checks": [
    {"name": "internal_dns", "status": "passed", ...},
    {"name": "external_endpoint", "status": "passed", ...},
    {"name": "url_format", "status": "passed", ...},
    {"name": "embedding_dimensions", "status": "passed", ...}
  ]
}
```

**Failed validation** returns `status: "unhealthy"` with details for each failed check.

## Interpreting Results

### Check: internal_dns

| Status | Meaning | Action |
|--------|---------|--------|
| passed | Backend can reach Qdrant via Docker DNS | None needed |
| failed | DNS resolution or connection failed | Check Qdrant container is running: `docker ps` |
| timeout | Connection took >10s | Check Docker network configuration |

### Check: external_endpoint

| Status | Meaning | Action |
|--------|---------|--------|
| passed | localhost:8000 is accessible | None needed |
| failed | Cannot reach localhost:8000 | Check port 8000 is published in docker-compose.yml |
| timeout | Connection took >10s | Check for port conflicts |

### Check: url_format

| Status | Meaning | Action |
|--------|---------|--------|
| passed | Base URL is correctly formatted | None needed |
| failed | Path duplication detected (e.g., /v1/v1) | Update `ZAI_BASE_URL` in `.env` to remove trailing `/v1` |

### Check: embedding_dimensions

| Status | Meaning | Action |
|--------|---------|--------|
| passed | Embeddings are 1536-dimensional | None needed |
| failed | Dimension mismatch detected | Verify embedding model configuration |
| timeout | Embedding generation took >10s | Check API connectivity |

## Common Issues

### Issue: "DNS resolution failed"

**Cause**: Qdrant container not running or wrong network

**Solution**:
```bash
# Check Qdrant is running
docker ps | grep qdrant

# Restart services
docker-compose restart qdrant-db

# Verify network
docker network ls | grep rag-network
```

### Issue: "Path duplication: /v1/v1"

**Cause**: `ZAI_BASE_URL` ends with `/v1` and client appends `/v1`

**Solution**:
```bash
# Update .env
ZAI_BASE_URL=https://api.z.ai  # Remove trailing /v1
```

### Issue: "Embedding dimension mismatch: expected 1536, got 768"

**Cause**: Wrong embedding model configured

**Solution**: Verify the embedding model in code uses `text-embedding-ada-002` or equivalent 1536-dimension model.

## Programmatic Usage

### From Firefox Extension

```javascript
async function validateConfig() {
  const response = await fetch('http://localhost:8000/validate');
  const report = await response.json();
  
  if (report.status !== 'healthy') {
    const failedChecks = report.checks.filter(c => c.status !== 'passed');
    console.error('Configuration issues:', failedChecks);
    return false;
  }
  return true;
}
```

### From Backend (Python)

```python
import httpx

async def validate_config() -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.get('http://localhost:8000/validate')
        report = response.json()
        return report['status'] == 'healthy'
```

## Next Steps

After successful validation:

1. Proceed with form-filling operations via `/fill-form` endpoint
2. Monitor validation results during development
3. Add validation check to deployment health checks
