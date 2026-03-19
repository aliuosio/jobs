# API Contract: Form QA Field Testing

**Date**: 2026-03-19
**Feature**: 001-form-qa-field-testing

## Overview

This document defines the API contract for the /fill-form endpoint that handles form field filling using Qdrant-backed retrieval.

## Base URL

```
http://localhost:8000
```

## Endpoints

### POST /fill-form

Fill a form field using resume data from Qdrant.

**Request**:
```json
{
  "label": "First Name",
  "signals": {
    "autocomplete": "given-name",
    "html_type": "text",
    "input_name": "firstName",
    "label_text": "First Name"
  }
}
```

**Request Schema**:
- `label` (string, required): Form field label text
- `signals` (object, optional): Additional context signals
  - `autocomplete` (string, optional): HTML autocomplete attribute
  - `html_type` (string, optional): HTML input type
  - `input_name` (string, optional): HTML input name attribute
  - `label_text` (string, optional): Visible label text

**Response (200 OK)**:
```json
{
  "answer": "John",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 3,
  "field_value": "John",
  "field_type": "first_name"
}
```

**Response Schema**:
- `answer` (string): Generated answer text
- `has_data` (boolean): Whether data was found
- `confidence` (string): Confidence level - "high", "medium", or "low"
- `context_chunks` (integer): Number of relevant context pieces
- `field_value` (string, optional): Extracted field value
- `field_type` (string, optional): Detected field type

**Error Response (400 Bad Request)**:
```json
{
  "detail": "Invalid request format"
}
```

**Error Response (404 Not Found)**:
```json
{
  "answer": "No resume data available for this field",
  "has_data": false,
  "confidence": "low",
  "context_chunks": 0,
  "field_value": null,
  "field_type": null
}
```

### GET /health

Check service health.

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-19T12:00:00Z"
}
```

### GET /validate

Validate system configuration.

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-19T12:00:00Z",
  "total_duration_ms": 561,
  "checks": [
    {
      "name": "internal_dns",
      "status": "passed",
      "message": "Qdrant is reachable",
      "duration_ms": 100
    }
  ]
}
```

## Field Type Mappings

| Field Type | Autocomplete Values | HTML Types | Input Names | Label Patterns |
|------------|---------------------|------------|-------------|-----------------|
| first_name | given-name | text | firstName, fname, first_name | First Name, Name, Given Name |
| last_name | family-name | text | lastName, lname, last_name | Last Name, Surname, Family Name |
| email | email | email | email, emailAddress | Email, Email Address, E-mail |
| city | address-level2 | text | city | City, Town |
| postcode | postal-code | text | postcode, zip, postalCode | Postcode, ZIP, Postal Code |
| street | street-address | text | street, address1 | Street, Address, Street Address |

## Validation Rules

### Email Validation
- Pattern: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- Must contain @ symbol
- Must have valid domain format

### Postcode Validation
- Pattern: `^[A-Za-z0-9 \\-]+$`
- Allows alphanumeric characters
- Allows spaces and hyphens
- Examples: "12345", "SW1A 1AA", "10115", "80110"

## Rate Limits

- Default: 100 requests per minute per IP
- Burst: 20 requests per second
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Codes

| Code | Description | Recovery Action |
|------|-------------|-----------------|
| 400 | Invalid request format | Check request body schema |
| 404 | No resume data found | Seed resume data via ingest script |
| 429 | Rate limit exceeded | Wait and retry with exponential backoff |
| 500 | Internal server error | Check logs, verify Qdrant connection |
| 503 | Service unavailable | Check health endpoint, verify dependencies |

## CORS Configuration

```
Access-Control-Allow-Origin: moz-extension://*
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Content-Type

All requests and responses use `application/json`.
