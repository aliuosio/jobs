# API Contracts: Extension Modernization

## External Interface: Backend API

The extension communicates with the FastAPI backend at `http://localhost:8000`.

### Endpoints

| Method | Endpoint | Request | Response |
|--------|----------|---------|---------|
| GET | `/job-offers` | - | `JobLink[]` |
| GET | `/job-offers/{id}` | - | `JobLink` |
| PATCH | `/job-offers/{id}/process` | - | `ProcessJobResponse` |
| POST | `/api/v1/search` | `SearchRequest` | `SearchResponse` |
| GET | `/health` | - | `HealthResponse` |

---

## TypeScript Interfaces (generated from API)

```typescript
// Job offers
interface JobLink {
  id: string
  url: string
  title: string
  company: string
  status: 'applied' | 'in_progress' | 'not_applied'
  createdAt: string
  updatedAt: string
}

// Search request for form field detection
interface SearchRequest {
  query: string
  signals?: string[]
  use_hyde?: boolean
  use_reranking?: boolean
  top_k?: number
  include_scores?: boolean
  generate?: boolean
}

// Search response with detected fields
interface SearchResponse {
  results: FormField[]
  query: string
  total_retrieved: number
  generated_answer?: string
  confidence?: number
  field_type?: string
}

// Form field for auto-fill
interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox'
  value?: string
  filled: boolean
  detectedAt: string
}

// Process job response
interface ProcessJobResponse {
  research: string
  research_email: string
  applied: boolean
}

// Health check
interface HealthResponse {
  status: string
}
```

---

## Error Handling

All errors return:

```typescript
interface ApiError {
  error: string
  message?: string
}
```

HTTP status codes:
- 400: Bad request
- 401: Unauthorized
- 404: Not found
- 500: Internal server error