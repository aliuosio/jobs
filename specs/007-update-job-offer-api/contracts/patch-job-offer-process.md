# API Contract: Update Job Offer Process

**Feature**: `007-update-job-offer-api`  
**Date**: 2026-03-20

## Endpoint Specification

### PATCH /job-offers/{id}/process

Update the processing metadata for a job offer.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Job offer ID (must be positive integer) |

**Request Body**:

```json
{
  "research": boolean,
  "research_email": boolean,
  "applied": boolean
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| research | boolean | No | null | Whether job research has been completed |
| research_email | boolean | No | null | Whether research email has been sent |
| applied | boolean | No | null | Whether job application has been submitted |

**Notes**:
- All fields are optional to support partial updates
- Fields not provided will preserve their current values
- Empty payload `{}` is valid (no-op update)
- Boolean `null` in request is treated as "not provided"

### Success Response (200 OK)

```json
{
  "id": 123,
  "title": "Software Engineer",
  "url": "https://example.com/job/123",
  "process": {
    "job_offers_id": 123,
    "research": true,
    "research_email": false,
    "applied": true
  }
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Job offer ID |
| title | string | Job posting title |
| url | string | URL to job posting |
| process | object | Processing metadata (null if no record exists) |
| process.job_offers_id | integer | Foreign key to job offer |
| process.research | boolean | Research completed flag |
| process.research_email | boolean | Research email sent flag |
| process.applied | boolean | Application submitted flag |

### Error Responses

#### 400 Bad Request

Invalid job offer ID format (non-integer, negative, zero).

```json
{
  "detail": "Job offer ID must be a positive integer"
}
```

#### 404 Not Found

Job offer with specified ID does not exist.

```json
{
  "detail": "Job offer not found"
}
```

#### 500 Internal Server Error

Unexpected server error.

```json
{
  "detail": "Internal server error"
}
```

#### 503 Service Unavailable

Database temporarily unavailable.

```json
{
  "detail": "Database temporarily unavailable"
}
```

## Usage Examples

### cURL

```bash
# Full update
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{"research": true, "applied": true}'

# Partial update
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{"applied": true}'

# No-op (get current state)
curl -X PATCH http://localhost:8000/job-offers/1/process \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Python (httpx)

```python
import httpx

async def update_job_offer_process(job_offer_id: int, **fields):
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"http://localhost:8000/job-offers/{job_offer_id}/process",
            json=fields
        )
        response.raise_for_status()
        return response.json()

# Usage
result = await update_job_offer_process(1, applied=True)
```

## OpenAPI Schema

```yaml
/job-offers/{id}/process:
  patch:
    summary: Update job offer process
    operationId: updateJobOfferProcess
    tags:
      - job-offers
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
          minimum: 1
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProcessUpdateRequest'
    responses:
      '200':
        description: Updated job offer with process data
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobOfferWithProcess'
      '400':
        description: Invalid job offer ID
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      '404':
        description: Job offer not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      '500':
        description: Internal server error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    ProcessUpdateRequest:
      type: object
      properties:
        research:
          type: boolean
          description: Whether job research has been completed
        research_email:
          type: boolean
          description: Whether research email has been sent
        applied:
          type: boolean
          description: Whether job application has been submitted

    JobOfferWithProcess:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        url:
          type: string
        process:
          type: object
          properties:
            job_offers_id:
              type: integer
            research:
              type: boolean
            research_email:
              type: boolean
            applied:
              type: boolean

    ErrorResponse:
      type: object
      properties:
        detail:
          type: string
```
