# Software Design Document: Data Flow

**Project**: Job Forms Helper  
**Version**: 1.1.0  
**Last Updated**: 2026-03-22

## 1. RAG Pipeline Overview

The Retrieval-Augmented Generation pipeline processes form field labels through three stages:

1. **Embedding**: Convert the field label into a 1024-dimensional vector
2. **Retrieval**: Search the Qdrant vector database for the top-k similar context chunks
3. **Generation**: Use retrieved context to generate a grounded answer via LLM

4. **Validation**: Check the configuration before processing

```
┌──────────────────┐        ┌──────────────────┐
│  Firefox Extension │        │    FastAPI Backend    │  Qdrant │  Mistral API │
│                  │        │                        │             │          │
│     Content      │───────►│   API Client  │───►│   Routes  │───→│   Services │          │
│      Script      │                              │ (fill-form)│             │            │          │
│                  │                              │             │          ▼
│   Form Field    │ Embedder   │  Retriever  │ Generator │ Answer    │
│   (label)     │ (text)     │ (vector)   │ (chunks)  │ (text)   │
│                  │                              │             │          │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

## 2. Sequence Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Request Processing Flow                              │
├─────────────────────────────────────────────────────────────────────────────┘
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Extension detects form field                                  │  │  │
│  │ 2. Extract signals (autocomplete, type, label)                    │  │  │
│  │ 3. Send POST /fill-form to backend                             │  │  │
│  │    { label: "What is your work experience?",                    │  │  │
│  │      signals: { autocomplete: "email", html_type: "email" } }        │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 4. FastAPI receives request                                        │  │  │
│  │    - Validates payload (max 10KB)                                     │  │  │
│  │    - Extracts field label and signals                                 │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 5. Embedder Service (Constitution I)                               │  │  │
│  │    - Calls Mistral API with mistral-embed model                    │  │  │
│  │    - Generates 1024-dimensional vector                                │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 6. Retriever Service (Constitution II)                              │  │  │
│  │    - Queries Qdrant with k=5 (default)                       │  │  │
│  │    - Returns chunks with payload and similarity scores                │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 7. Field Classifier Service                                    │  │  │
│  │    - Analyzes signals to detect field type                      │  │  │
│  │    - Returns: email, phone, name, city, etc.                   │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 8. Direct Extraction (if field type detected)                  │  │  │
│  │    - Extract value from profile chunk (e.g., "john@example.com")        │  │  │
│  │    - Skip LLM for known fields                                     │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 9. Generator Service (Constitution III)                          │  │  │
│  │    - Assembles context from retrieved chunks                        │  │  │
│  │    - Calls Mistral API with anti-hallucination prompt            │  │  │
│  │    - Returns grounded answer                                        │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 10. Response Assembly                                           │  │  │
│  │    - Combines answer, confidence, field value                  │  │  │
│  │    - Returns JSON response to extension                                 │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 11. Field Filler (Extension)                                  │  │  │
│  │    - Receives answer from API response                                │  │  │
│  │    - Sets input value with React/Angular compatibility (Constitution V)   │  │  │
│  │    - Dispatches input and change events with bubbles: true             │  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
```

## 3. Confidence Levels

| Level | Criteria | Use Case |
|-------|----------|---------|
| `high` | avg score >= 0.8 | Strong match in resume |
| `medium` | avg score >= 0.5 | Partial match in resume |
| `low` | avg score < 0.5 | Weak match, may need review |
| `none` | 0 chunks | No relevant data found |

## 4. Data Transformations

### Embedding Transformation
```
Input:  "What is your work experience?"
         ↓
Vector: [0.123, -0.456, 0.789, ..., 0.234]  (1024 floats)
```
### Context Assembly
```
Chunks: [{id: "abc", score: 0.85, payload: {...}},
         {id: "def", score: 0.72, payload: {...}},
         ...]
         ↓
Context: "[1] 5 years of experience at TechCorp developing Python applications..."
         "[2] Led team of 5 engineers..."
         ...
```
## 5. Error Handling

| Error Type | HTTP Status | Response |
|------------|-------------|----------|
| Invalid request | 400 | `{"detail": "Invalid request"}` |
| Payload too large | 413 | `{"detail": "Request payload exceeds 10KB limit"}` |
| Internal error | 500 | `{"detail": "Internal server error"}` |
| Service unavailable | 503 | `{"detail": "Service temporarily unavailable"}` |

## 6. Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Max request size | 10KB | Enforced via Content-Length header |
| Retrieval k | 5 | Constitution II compliance |
| Embedding dimension | 1024 | Constitution I compliance (Mistral mistral-embed) |
| LLM temperature | 0.3 | Constitution III compliance (low for factual responses) |
| Request timeout | 10s | Extension API client timeout |

## 7. Dependencies

### Python Dependencies
- `fastapi` - Web framework
- `pydantic` + `pydantic-settings` - Data validation
- `qdrant-client` - Vector database client
- `openai` - OpenAI-compatible API client (for Mistral)
- `httpx` - HTTP client for validation service

### External Services
- **Mistral API** - LLM and embeddings
- **Qdrant** - Vector database

## 8. Security Considerations

- API key stored in environment variables (never committed)
- CORS enabled for extension origins only
- Input validation via Pydantic constraints
- No authentication required for API endpoints (internal service)

---

## 9. Job Status Sync Feature (v1.1.0)

### Overview

The Job Status Sync feature provides real-time synchronization of job application status between the Firefox extension and the backend API using Server-Sent Events (SSE).

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Job Status Sync Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   Firefox    │          │   FastAPI        │          │   PostgreSQL     │
│   Extension  │          │   Backend        │          │   Database       │
│              │          │                  │          │                  │
│  Background  │◄────────►│  SSE Endpoint    │◄───────►│  job_offers      │
│  (SSE Client)│   SSE    │  /api/v1/stream  │   Query │  job_offers_     │
│              │          │                  │          │  process         │
│  Popup UI    │◄──msg───│                  │          │                  │
│              │          │                  │          │                  │
└──────────────┘          └──────────────────┘          └──────────────────┘
```

### Data Flow

1. **Extension Startup**: Background script establishes SSE connection to `/api/v1/stream`
2. **Initial State**: SSE sends current job offers with process data
3. **User Action**: User toggles applied status in extension
4. **API Update**: PATCH `/job-offers/{id}/process` updates database
5. **Broadcast**: Backend broadcasts updated data to all SSE subscribers
6. **UI Update**: Extension receives update via SSE and refreshes popup

### SSE Endpoint

**Endpoint**: `GET /api/v1/stream`

**Headers**:
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Message Format**:
```json
data: [{"id": 1, "title": "Job Title", "url": "https://...", "process": {"applied": true}}]
```

### Reconnection Strategy

The extension implements exponential backoff reconnection:
- Base delay: 1000ms
- Max delay: 30000ms
- Jitter: ±25%
- Max attempts: unlimited (0)

### Success Criteria (per spec)

| Criterion | Target | Verification |
|-----------|--------|--------------|
| SC-001: Accuracy | ≥95% | Without manual refresh |
| SC-002: Process Data | 100% | All records with process |
| SC-003: Update Latency | ≤1s | SSE to database change |
| SC-004: Error Recovery | ≤2s | Empty state display |
| SC-005: UI Update | ≤1s | After SSE event |

### Database Schema

```sql
-- job_offers_process table
CREATE TABLE job_offers_process (
    id SERIAL PRIMARY KEY,
    job_offers_id INTEGER REFERENCES job_offers(id),
    research BOOLEAN DEFAULT false,
    research_email BOOLEAN DEFAULT false,
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated via ON CONFLICT for last-write-wins
INSERT INTO job_offers_process (job_offers_id, applied)
VALUES ($1, $2)
ON CONFLICT (job_offers_id) DO UPDATE SET
    applied = $2,
    updated_at = CURRENT_TIMESTAMP;
```

### Color Coding

| Status | Color | Hex |
|--------|-------|-----|
| Not Applied | Green | #22C55E |
| Applied | Red | #EF4444 |
