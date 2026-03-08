# API Contract: Configuration Validation

**Feature**: 004-config-validation
**Date**: 2026-03-08
**Version**: 1.0.0

## Endpoint: Validate Configuration

Runs all configuration validation checks and returns results.

### Request

```
GET /validate
```

**Headers**:
| Header | Value | Required |
|--------|-------|----------|
| Accept | application/json | No |

**Query Parameters**: None

**Request Body**: None

### Response

**Status Code**: `200 OK` (always, even when validation fails)

**Headers**:
| Header | Value |
|--------|-------|
| Content-Type | application/json |

**Response Body**:

```json
{
  "status": "healthy" | "unhealthy",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "total_duration_ms": 1234,
  "checks": [
    {
      "name": "internal_dns",
      "status": "passed" | "failed" | "timeout",
      "message": "Successfully connected to qdrant-db:6333",
      "duration_ms": 50,
      "details": null
    },
    {
      "name": "external_endpoint",
      "status": "passed",
      "message": "localhost:8000 is reachable",
      "duration_ms": 10,
      "details": null
    },
    {
      "name": "url_format",
      "status": "passed",
      "message": "Base URL format is correct",
      "duration_ms": 1,
      "details": {
        "normalized_url": "https://api.example.com"
      }
    },
    {
      "name": "embedding_dimensions",
      "status": "passed",
      "message": "Embeddings are 1536-dimensional",
      "duration_ms": 500,
      "details": {
        "expected": 1536,
        "actual": 1536
      }
    }
  ]
}
```

### Example Responses

#### Successful Validation

```json
{
  "status": "healthy",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "total_duration_ms": 561,
  "checks": [
    {
      "name": "internal_dns",
      "status": "passed",
      "message": "Successfully connected to qdrant-db:6333",
      "duration_ms": 50,
      "details": null
    },
    {
      "name": "external_endpoint",
      "status": "passed",
      "message": "localhost:8000/health is reachable",
      "duration_ms": 10,
      "details": null
    },
    {
      "name": "url_format",
      "status": "passed",
      "message": "Base URL format is correct",
      "duration_ms": 1,
      "details": {
        "normalized_url": "https://api.z.ai/v1"
      }
    },
    {
      "name": "embedding_dimensions",
      "status": "passed",
      "message": "Embeddings are 1536-dimensional",
      "duration_ms": 500,
      "details": {
        "expected": 1536,
        "actual": 1536
      }
    }
  ]
}
```

#### Failed Validation (DNS Failure)

```json
{
  "status": "unhealthy",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "total_duration_ms": 50,
  "checks": [
    {
      "name": "internal_dns",
      "status": "failed",
      "message": "Failed to connect to qdrant-db:6333: DNS resolution failed",
      "duration_ms": 50,
      "details": {
        "hostname": "qdrant-db",
        "port": 6333,
        "error_type": "dns_failure"
      }
    },
    {
      "name": "external_endpoint",
      "status": "passed",
      "message": "localhost:8000/health is reachable",
      "duration_ms": 10,
      "details": null
    },
    {
      "name": "url_format",
      "status": "passed",
      "message": "Base URL format is correct",
      "duration_ms": 1,
      "details": {
        "normalized_url": "https://api.z.ai/v1"
      }
    },
    {
      "name": "embedding_dimensions",
      "status": "failed",
      "message": "Cannot verify embeddings: vector store unavailable",
      "duration_ms": 0,
      "details": {
        "skipped": true,
        "reason": "internal_dns check failed"
      }
    }
  ]
}
```

#### Timeout Example

```json
{
  "status": "unhealthy",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "total_duration_ms": 10000,
  "checks": [
    {
      "name": "internal_dns",
      "status": "timeout",
      "message": "Check timed out after 10 seconds",
      "duration_ms": 10000,
      "details": {
        "timeout_seconds": 10
      }
    },
    {
      "name": "external_endpoint",
      "status": "passed",
      "message": "localhost:8000/health is reachable",
      "duration_ms": 10,
      "details": null
    },
    {
      "name": "url_format",
      "status": "passed",
      "message": "Base URL format is correct",
      "duration_ms": 1,
      "details": {
        "normalized_url": "https://api.z.ai/v1"
      }
    },
    {
      "name": "embedding_dimensions",
      "status": "failed",
      "message": "Cannot verify embeddings: vector store unavailable",
      "duration_ms": 0,
      "details": {
        "skipped": true,
        "reason": "internal_dns check timed out"
      }
    }
  ]
}
```

### Error Responses

This endpoint does not return HTTP error codes for validation failures. The HTTP status is always `200 OK` with the validation status in the response body.

**Potential HTTP Errors** (indicate server issues, not validation issues):

| Status | Condition |
|--------|-----------|
| 500 | Internal server error (unhandled exception) |
| 503 | Service temporarily unavailable |

---

## CORS

This endpoint follows the same CORS policy as other API endpoints:

- `moz-extension://*` origins allowed
- `localhost` origins allowed
- Credentials: allowed
- Methods: GET, OPTIONS

---

## Usage

### cURL

```bash
curl http://localhost:8000/validate
```

### JavaScript (from extension)

```javascript
const response = await fetch('http://localhost:8000/validate');
const report = await response.json();

if (report.status === 'healthy') {
  console.log('All configuration checks passed');
} else {
  for (const check of report.checks) {
    if (check.status !== 'passed') {
      console.error(`${check.name}: ${check.message}`);
    }
  }
}
```

### Python

```python
import httpx

response = httpx.get('http://localhost:8000/validate')
report = response.json()

if report['status'] == 'healthy':
    print('All checks passed')
else:
    for check in report['checks']:
        if check['status'] != 'passed':
            print(f"{check['name']}: {check['message']}")
```
