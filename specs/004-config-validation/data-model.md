# Data Model: Configuration Validation

**Feature**: 004-config-validation
**Date**: 2026-03-08

## Entities

### CheckResult

Individual validation check result.

| Field | Type | Description |
|-------|------|-------------|
| name | str | Check identifier (e.g., "internal_dns") |
| status | enum | `passed`, `failed`, `timeout` |
| message | str | Human-readable result or error details |
| duration_ms | int | Execution time in milliseconds |
| details | dict | Optional additional data (e.g., actual dimensions) |

**Validation Rules**:
- `name` must be one of: `internal_dns`, `external_endpoint`, `url_format`, `embedding_dimensions`
- `status` must be a valid enum value
- `message` must be non-empty when `status` is `failed` or `timeout`

### ValidationReport

Complete validation response.

| Field | Type | Description |
|-------|------|-------------|
| status | enum | `healthy`, `unhealthy` |
| timestamp | datetime | ISO 8601 timestamp of validation run |
| total_duration_ms | int | Total execution time |
| checks | list[CheckResult] | Individual check results |

**Validation Rules**:
- `status` is `healthy` only if all checks pass
- `status` is `unhealthy` if any check fails or times out
- At least one check must be present

---

## Check Types

### 1. Internal DNS Check (`internal_dns`)

Verifies backend can reach vector database via Docker internal DNS.

| Field | Expected Value |
|-------|---------------|
| Target | `qdrant-db:6333` |
| Method | HTTP GET to `/` or health endpoint |
| Success | HTTP 200 response |
| Failure | Connection refused, DNS resolution failure, non-200 response |

**Details on failure**:
```json
{
  "hostname": "qdrant-db",
  "port": 6333,
  "error_type": "connection_refused" | "dns_failure" | "http_error",
  "http_status": 503
}
```

### 2. External Endpoint Check (`external_endpoint`)

Verifies external clients can reach backend via localhost.

| Field | Expected Value |
|-------|---------------|
| Target | `localhost:8000` |
| Method | HTTP GET to `/health` |
| Success | HTTP 200 response |
| Failure | Connection refused, timeout, non-200 response |

**Details on failure**:
```json
{
  "url": "http://localhost:8000/health",
  "error_type": "connection_refused" | "timeout" | "http_error",
  "http_status": null
}
```

### 3. URL Format Check (`url_format`)

Verifies inference API base URL does not result in path duplication.

| Field | Expected Value |
|-------|---------------|
| Input | `ZAI_BASE_URL` environment variable |
| Validation | No duplicated path segments (e.g., `/v1/v1`) |
| Success | Clean URL without duplication |
| Failure | Path duplication detected |

**Details on failure**:
```json
{
  "base_url": "https://api.example.com/v1",
  "normalized_url": "https://api.example.com/v1",
  "issue": "Trailing /v1 may cause duplication with /v1 path",
  "recommendation": "Use https://api.example.com instead"
}
```

### 4. Embedding Dimensions Check (`embedding_dimensions`)

Verifies embeddings are 1536-dimensional.

| Field | Expected Value |
|-------|---------------|
| Expected | 1536 dimensions |
| Method | Generate test embedding, count dimensions |
| Success | Dimension count equals 1536 |
| Failure | Dimension count != 1536 |

**Details on failure**:
```json
{
  "expected": 1536,
  "actual": 768,
  "model": "text-embedding-ada-002"
}
```

---

## State Transitions

```
┌─────────────────────────────────────────────────────────┐
│                    Validation Request                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Run Internal DNS Check                  │
│              (depends on: none)                          │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
┌───────────────────┐          ┌───────────────────┐
│ External Endpoint │          │    URL Format     │
│  (parallel)       │          │    (parallel)     │
└───────────────────┘          └───────────────────┘
            │                             │
            └──────────────┬──────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Run Embedding Dimensions Check              │
│         (depends on: internal_dns success)               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Aggregate Results                      │
│            Return ValidationReport (HTTP 200)            │
└─────────────────────────────────────────────────────────┘
```

---

## Pydantic Models

```python
from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CheckStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    TIMEOUT = "timeout"

class ReportStatus(str, Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"

class CheckName(str, Enum):
    INTERNAL_DNS = "internal_dns"
    EXTERNAL_ENDPOINT = "external_endpoint"
    URL_FORMAT = "url_format"
    EMBEDDING_DIMENSIONS = "embedding_dimensions"

class CheckResult(BaseModel):
    name: CheckName
    status: CheckStatus
    message: str
    duration_ms: int = Field(ge=0)
    details: Optional[dict] = None

class ValidationReport(BaseModel):
    status: ReportStatus
    timestamp: datetime
    total_duration_ms: int = Field(ge=0)
    checks: list[CheckResult] = Field(min_length=1)
```
