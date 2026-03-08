# Quickstart: RAG Backend API

**Feature**: 002-rag-backend | **Date**: 2026-03-08

## Prerequisites

- Python 3.11+
- Docker and Docker Compose running
- Qdrant vector store (from 001-docker-infra)
- Z.ai API credentials

---

## Quick Start

### 1. Set Up Environment

```bash
# Navigate to project root
cd /home/krusty/projects/job-forms

# Create .env file (if not exists)
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:
```bash
ZAI_API_KEY=your_api_key_here
ZAI_BASE_URL=https://api.z.ai/v1
QDRANT_URL=http://qdrant-db:6333
```

### 2. Start Infrastructure

```bash
# Start Qdrant vector database
docker-compose up -d qdrant-db

# Verify Qdrant is running
curl http://localhost:6333/healthz
```

### 3. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run the API

```bash
# Development mode with auto-reload
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Or via Docker
docker-compose up -d api-backend
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Generate an answer
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Years of Python experience"}'
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/fill-form` | POST | Generate answer for form field |
| `/health` | GET | Health check with service status |

---

## Request Examples

### Generate Form Answer

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Years of Python experience",
    "context_hints": "Looking for backend development"
  }'
```

**Response (200):**
```json
{
  "answer": "5 years of Python experience in backend development",
  "sources": [
    {
      "content": "Worked as Python Developer...",
      "metadata": {"company": "TechCorp"},
      "relevance_score": 0.92
    }
  ],
  "has_data": true,
  "confidence": "high",
  "processing_time_ms": 1250
}
```

### Health Check

```bash
curl http://localhost:8000/health
```

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "vector_store": {"status": "healthy", "latency_ms": 12},
    "llm": {"status": "healthy", "latency_ms": 180}
  }
}
```

---

## Development Workflow

### Project Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Configuration/settings
│   ├── api/
│   │   ├── routes.py        # API endpoints
│   │   └── schemas.py       # Request/response models
│   ├── services/
│   │   ├── rag.py           # RAG pipeline
│   │   └── vector_store.py  # Qdrant connection
│   └── prompts/
│       └── system.py        # Anti-hallucination prompts
└── tests/
    ├── test_api.py
    ├── test_rag.py
    └── test_vector_store.py
```

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=term-missing

# Run specific test file
pytest tests/test_api.py -v
```

### Development Server

```bash
# Start with auto-reload
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# With debug logging
uvicorn src.main:app --reload --log-level debug
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZAI_API_KEY` | Yes | - | Z.ai API key |
| `ZAI_BASE_URL` | No | `https://api.z.ai/v1` | Z.ai API base URL |
| `QDRANT_URL` | No | `http://qdrant-db:6333` | Qdrant connection URL |
| `QDRANT_COLLECTION` | No | `resume_embeddings` | Collection name |
| `EMBEDDING_DIMENSION` | No | `1536` | Embedding dimensions |
| `RETRIEVAL_K` | No | `5` | Number of documents to retrieve |
| `MAX_RESPONSE_TIME_MS` | No | `5000` | Max processing time |

### CORS Configuration

The API is configured to accept requests from:
- `moz-extension://*` (Firefox extensions)
- `http://localhost:*` (Local development)

---

## Troubleshooting

### Qdrant Connection Failed

```bash
# Check Qdrant is running
docker-compose ps qdrant-db

# Check Qdrant logs
docker-compose logs qdrant-db

# Verify connectivity
curl http://localhost:6333/healthz
```

### No Relevant Context Found

This is expected behavior when the resume doesn't contain the requested information:
```json
{
  "answer": "This information is not available in the resume.",
  "has_data": false,
  "confidence": "none"
}
```

### LLM Rate Limiting

The API automatically retries with exponential backoff:
- Retry 1: 1 second delay
- Retry 2: 2 second delay
- Retry 3: 4 second delay
- Retry 4: 8 second delay
- Retry 5: 16 second delay (max)

### Slow Response Time

If responses exceed 5 seconds:
1. Check Qdrant latency: `curl http://localhost:6333/metrics`
2. Check LLM API latency
3. Reduce `RETRIEVAL_K` if using too many documents

---

## Next Steps

1. **Populate vector store** with resume embeddings (separate ingestion pipeline)
2. **Test with Firefox extension** (feature 003-form-filler-extension)
3. **Monitor performance** with health endpoint metrics
