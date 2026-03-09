# Quickstart: RAG Backend API

Get the RAG Backend running in 5 minutes.

## Prerequisites

- Docker & Docker Compose
- Z.ai API key
- Resume embeddings already indexed in Qdrant (see 001-docker-infra)

## Quick Start

### 1. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit and add your Z.ai API key
# ZAI_API_KEY=your-api-key-here
```

### 2. Start Services

```bash
# Start the backend and Qdrant
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

### 3. Verify Health

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### 4. Test Form Filling

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Years of Python experience"}'
```

Expected response:
```json
{
  "answer": "5 years of professional Python experience",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 3
}
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health check |
| `/fill-form` | POST | Generate answer for form field |

## Request/Response Examples

### Generate Answer

**Request**:
```bash
POST /fill-form
Content-Type: application/json

{
  "label": "What is your highest degree?"
}
```

**Response (success)**:
```json
{
  "answer": "Bachelor of Science in Computer Science from MIT, 2020",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 2
}
```

**Response (no data)**:
```json
{
  "answer": "I don't have information about that in the resume.",
  "has_data": false,
  "confidence": "none",
  "context_chunks": 0
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_URL` | `http://qdrant-db:6333` | Qdrant connection URL |
| `QDRANT_COLLECTION` | `resumes` | Vector collection name |
| `ZAI_API_KEY` | **Required** | Z.ai API key |
| `ZAI_BASE_URL` | `https://api.z.ai/v1` | Z.ai API endpoint |
| `EMBEDDING_DIMENSION` | `1536` | Vector dimensions |
| `RETRIEVAL_K` | `5` | Context chunks to retrieve |

## Common Issues

### CORS Errors from Extension

**Symptom**: Browser extension requests fail with CORS errors.

**Solution**: Ensure backend is running with CORS middleware:
```python
# Already configured in src/main.py
allow_origins=["moz-extension://*", "http://localhost"]
```

### Vector Store Connection Failed

**Symptom**: `Connection refused to qdrant-db:6333`

**Solution**: 
1. Ensure Qdrant container is running: `docker-compose ps`
2. Check network: `docker network ls | grep rag-network`
3. Verify DNS: `docker exec backend ping qdrant-db`

### No Relevant Context Found

**Symptom**: All queries return `has_data: false`

**Solution**: 
1. Verify Qdrant has embeddings: `curl http://localhost:6333/collections/resumes`
2. Check collection has points: `curl http://localhost:6333/collections/resumes/points/count`
3. Re-index resume if needed (see 001-docker-infra)

### API Rate Limiting

**Symptom**: 429 errors from Z.ai API

**Solution**: The backend implements exponential backoff (1s, 2s, 4s, 8s). Wait and retry automatically.

## Development

### Run Locally (without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment
export ZAI_API_KEY=your-key
export QDRANT_URL=http://localhost:6333

# Run server
uvicorn src.main:app --reload --port 8000
```

### Run Tests

```bash
# Unit tests
pytest tests/unit/

# Integration tests (requires running services)
pytest tests/integration/

# All tests with coverage
pytest --cov=src tests/
```

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│ Firefox Extension│────▶│  Backend API     │
│ (moz-extension)  │     │  localhost:8000  │
└──────────────────┘     └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
           ┌────────────────┐         ┌────────────────┐
           │  Qdrant DB     │         │  Z.ai API      │
           │  qdrant-db:6333│         │  (inference)   │
           └────────────────┘         └────────────────┘
```

## Next Steps

1. **Index Resume**: Use the ingestion pipeline to add your resume to Qdrant
2. **Configure Extension**: Point the Firefox extension to `http://localhost:8000`
3. **Test End-to-End**: Fill a job application form using the extension
