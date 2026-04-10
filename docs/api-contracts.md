# API Contracts

**Project:** Jobs Backend API  
**Version:** 1.0.0  
**Base URL:** `http://localhost:8000`

---

## Table of Contents

1. [Health & Validation](#health--validation)
2. [Search & Form Filling](#search--form-filling)
3. [Job Offers](#job-offers)

---

## Health & Validation

### GET /health

Service health check.

**Response:**
```json
{
  "status": "healthy"
}
```

---

### GET /validate

Configuration validation with diagnostic checks.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "total_duration_ms": 561,
  "checks": [
    {"name": "internal_dns", "status": "passed", "message": "...", "duration_ms": 100},
    {"name": "external_endpoint", "status": "passed", "message": "...", "duration_ms": 150},
    {"name": "url_format", "status": "passed", "message": "...", "duration_ms": 5},
    {"name": "embedding_dimensions", "status": "passed", "message": "...", "duration_ms": 306}
  ]
}
```

---

## Search & Form Filling

### POST /api/v1/search

Unified search endpoint with optional LLM answer generation.

**Request:**
```json
{
  "query": "What is your work experience?",
  "generate": true,
  "signals": {
    "autocomplete": "email",
    "html_type": "email"
  },
  "use_hyde": true,
  "use_reranking": false,
  "top_k": 5,
  "include_scores": false
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Form field label to search for |
| `generate` | boolean | No | Generate answer via LLM (default: false) |
| `signals` | object | No | Browser signals for field classification |
| `signals.autocomplete` | string | No | autocomplete attribute value |
| `signals.html_type` | string | No | HTML type attribute |
| `use_hyde` | boolean | No | Use HyDE (default: true) |
| `use_reranking` | boolean | No | Use cross-encoder reranking |
| `top_k` | integer | No | Number of results (default: 5) |
| `include_scores` | boolean | No | Include score breakdown |

**Response:**
```json
{
  "results": [
    {
      "content": "5 years of software development experience...",
      "score": 0.85,
      "source": "resume",
      "scores": {
        "vector_score": 0.9,
        "bm25_score": 0.7,
        "rerank_score": null
      }
    }
  ],
  "query": "What is your work experience?",
  "total_retrieved": 5,
  "generated_answer": "5 years of software development experience working with Python, FastAPI, and React.",
  "confidence": "high",
  "field_type": null
}
```

**Direct Field Extraction Response** (when signals match known fields):
```json
{
  "results": [...],
  "query": "Email",
  "total_retrieved": 1,
  "generated_answer": "john.doe@example.com",
  "confidence": "high",
  "field_type": "email"
}
```

**Error Responses:**
- `422`: Validation error (invalid request body)
- `500`: Internal server error
- `503`: Service unavailable (Qdrant not connected)

---

## Job Offers

### GET /job-offers

List job offers with optional pagination and CSV export.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Max results |
| `offset` | integer | Pagination offset |
| `format` | string | Response format: `json` or `csv` |

**Response (JSON):**
```json
{
  "job_offers": [
    {
      "id": 1,
      "url": "https://example.com/job/123",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "status": "applied",
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-05T15:30:00Z",
      "process": {
        "research": true,
        "research_email": false,
        "applied": true
      }
    }
  ]
}
```

**Response (CSV):**
Returns CSV file with headers: `id, url, title, company, status, created_at, updated_at, research, research_email, applied`

---

### GET /job-offers/{job_offer_id}

Get a single job offer.

**Response:**
```json
{
  "id": 1,
  "url": "https://example.com/job/123",
  "title": "Software Engineer",
  "company": "Tech Corp",
  "status": "applied",
  "created_at": "2026-04-01T10:00:00Z",
  "updated_at": "2026-04-05T15:30:00Z",
  "process": {
    "research": true,
    "research_email": false,
    "applied": true
  }
}
```

---

### POST /job-offers

Create a new job offer.

**Request:**
```json
{
  "url": "https://example.com/job/456",
  "title": "Backend Developer",
  "company": "Startup Inc"
}
```

**Response:** Created job offer object

---

### PUT /job-offers/{job_offer_id}

Replace a job offer.

**Request:**
```json
{
  "url": "https://example.com/job/456",
  "title": "Senior Backend Developer",
  "company": "Startup Inc",
  "status": "in_progress"
}
```

---

### PATCH /job-offers/{job_offer_id}

Partial update a job offer.

**Request:**
```json
{
  "status": "applied"
}
```

---

### DELETE /job-offers/{job_offer_id}

Delete a job offer.

**Response:** `204 No Content`

---

### PATCH /job-offers/{job_offer_id}/process

Update processing metadata with upsert behavior.

**Request:**
```json
{
  "research": true,
  "research_email": true,
  "applied": false
}
```

**Response:**
```json
{
  "id": 1,
  "url": "https://example.com/job/123",
  "status": "in_progress",
  "process": {
    "research": true,
    "research_email": true,
    "applied": false
  }
}
```

---

### GET /job-offers/stream

Server-Sent Events stream for real-time job offer updates.

**Response:** SSE stream with event types:
- `job_offer_created`
- `job_offer_updated`
- `job_offer_deleted`

**Example:**
```
data: {"event": "job_offer_updated", "id": 1, "status": "applied"}
```

---

## Schema Reference

### ConfidenceLevel
```python
enum ConfidenceLevel:
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
```

### JobOfferStatus
```python
enum JobOfferStatus:
    NOT_APPLIED = "not_applied"
    IN_PROGRESS = "in_progress"
    APPLIED = "applied"
```

---

## Related Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Development Guide](./development-guide.md)