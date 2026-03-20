# API Contract: Job Offers Endpoint

**Feature**: 006-job-offers-api
**Version**: 1.0.0
**Base URL**: `/job-offers`

## Endpoint: GET /job-offers
**Method**: GET
**Content-Type**: application/json
**Description**: Retrieve all job offers with processing metadata

### Request
```http
GET /job-offers HTTP/1.1
```

### Response 200 OK
```json
{
  "job_offers": [
    {
      "id": 1,
      "title": "Senior Python Developer",
      "url": "https://example.com/jobs/1",
      "process": {
        "job_offer_id": 1,
        "status": "processed"
      }
    }
  ]
}
```

### Response 503 - Database Unavailable
```json
{
  "detail": "Database temporarily unavailable"
}
```

### Response 500 - Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

### Error Codes
| Code | Condition |
|------|-----------|
| 200 | Success |
| 503 | PostgreSQL connection failure |
| 500 | Unexpected error |

### Query Parameters
None

### Response Schema
```typescript
interface JobOfferWithProcess {
  id: number;
  title: string;
  url: string;
  process: {
    job_offer_id: number;
    [key: string]: any;
  } | null;
}
```
