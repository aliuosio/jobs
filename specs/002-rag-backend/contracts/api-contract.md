# API Contract: RAG Backend

**Feature**: 002-rag-backend | **Date**: 2026-03-08

## Overview

This document defines the REST API contract for the RAG Backend service.

---

## Base URL

```
http://localhost:8000
```

In production: Internal Docker network via `api-backend:8000`

---

## Authentication

Currently **no authentication** required (development mode).

Future: API key authentication via `Authorization` header.

---

## Endpoints

### POST /fill-form

Generate an answer for a form field based on resume context.

**Request**

```http
POST /fill-form HTTP/1.1
Content-Type: application/json

{
  "label": "Years of Python experience",
  "context_hints": "Looking for backend development experience"
}
```

**Request Schema**

| Field | Type | Required | Constraints |
|------|------|----------|-------------|
| `label` | string | Yes | 1-500 chars |
| `context_hints` | string | No | Max 1000 chars |

**Success Response (200)**

```json
{
  "answer": "5 years of Python experience in backend development",
  "sources": [
    {
      "content": "Worked as Python Developer at TechCorp from 2019-2024...",
      "metadata": {"company": "TechCorp", "years": "2019-2024"},
      "relevance_score": 0.92
    }
  ],
  "has_data": true,
  "confidence": "high",
  "processing_time_ms": 1250
}
```

**Response Schema**

| Field | Type | Description |
|------|------|-------------|
| `answer` | string | Generated answer based on resume context |
| `sources` | array | Source documents used to generate answer |
| `sources[].content` | string | Content of source document |
| `sources[].metadata` | object | Metadata about source |
| `sources[].relevance_score` | number | Relevance score (0.0-1.0) |
| `has_data` | boolean | Whether relevant data was found |
| `confidence` | string | Confidence level: "high", "medium", "low", "none" |
| `processing_time_ms` | integer | Processing time in milliseconds |

**No Data Response (200)**

```json
{
  "answer": "This information is not available in the resume.",
  "sources": [],
  "has_data": false,
  "confidence": "none",
  "processing_time_ms": 500
}
```

**Error Responses**

| Status | Code | Description |
|-------|------|-------------|
| 400 | `INVALID_PAYLOAD` | Request validation failed |
| 422 | `VALIDATION_ERROR` | Field constraints violated |
| 503 | `SERVICE_UNAVAILABLE` | Vector database or LLM unavailable |
| 504 | `GATEWAY_TIMEOUT` | Request processing timeout |

---

### GET /health

Health check endpoint for service monitoring.

**Request**

```http
GET /health HTTP/1.1
```

**Success Response (200)**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "vector_store": {
      "status": "healthy",
      "latency_ms": 15
    },
    "llm": {
      "status": "healthy",
      "latency_ms": 250
    }
  },
  "uptime_seconds": 3600
}
```

**Response Schema**

| Field | Type | Description |
|------|------|-------------|
| `status` | string | Overall status: "healthy" or "unhealthy" |
| `version` | string | API version |
| `checks` | object | Individual service checks |
| `checks.vector_store.status` | string | Vector DB status |
| `checks.vector_store.latency_ms` | integer | Vector DB latency |
| `checks.llm.status` | string | LLM status |
| `checks.llm.latency_ms` | integer | LLM latency |
| `uptime_seconds` | integer | Service uptime in seconds |

**Unhealthy Response (503)**

```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "checks": {
    "vector_store": {
      "status": "unhealthy",
      "error": "Connection refused"
    },
    "llm": {
      "status": "healthy",
      "latency_ms": 250
    }
  },
  "uptime_seconds": 3600
}
```

---

## CORS Configuration

### Allowed Origins

| Origin | Environment |
|--------|-------------|
| `moz-extension://*` | All Firefox extensions |
| `http://localhost:*` | Local development |

### CORS Headers

```
Access-Control-Allow-Origin: {origin}
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Preflight Handling

OPTIONS requests are handled automatically by FastAPI CORS middleware.

---

## Rate Limiting

Currently **no rate limiting** in development mode.

Future: 100 requests per minute per client.

---

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'label' must be between 1 and 500 characters",
    "details": {
      "field": "label",
      "constraint": "min_length"
    }
  },
  "request_id": "req_abc123"
}
```

---

## Request/Response Examples

### Example 1: Successful Query

**Request**
```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Work experience"}'
```

**Response**
```json
{
  "answer": "5 years of software development experience including 3 years at TechCorp and 2 years at StartupInc",
  "sources": [
    {
      "content": "Software Developer at TechCorp (2021-2024)...",
      "metadata": {"company": "TechCorp", "role": "Software Developer"},
      "relevance_score": 0.95
    }
  ],
  "has_data": true,
  "confidence": "high",
  "processing_time_ms": 1800
}
```

### Example 2: No Data Found

**Request**
```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Pilot license number"}'
```

**Response**
```json
{
  "answer": "This information is not available in the resume.",
  "sources": [],
  "has_data": false,
  "confidence": "none",
  "processing_time_ms": 450
}
```

### Example 3: Health Check

**Request**
```bash
curl http://localhost:8000/health
```

**Response**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "vector_store": {
      "status": "healthy",
      "latency_ms": 12
    },
    "llm": {
      "status": "healthy",
      "latency_ms": 180
    }
  },
  "uptime_seconds": 7200
}
```
