# Job Forms Helper

An AI-powered system that automatically fills job application forms using resume data. The system uses a RAG (Retrieval-Augmented Generation) pipeline to match form fields with relevant resume content.

## Overview

Job Forms Helper consists of two main components:

1. **Backend API** - A FastAPI service that processes form field labels and generates answers based on resume data stored in a vector database
2. **Firefox Extension** - A browser extension that detects form fields on job application pages and fills them using the backend API

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Z.ai API key (for embeddings and inference)
- Firefox browser (for the extension)

### 1. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Z.ai API key
# ZAI_API_KEY=your_api_key_here
```

### 2. Start Services

```bash
docker-compose up -d
```

This starts:
- **Qdrant** (vector database) on ports 6333/6334
- **Backend API** on port 8000

### 3. Verify Services

```bash
# Check backend health
curl http://localhost:8000/health

# Run configuration validation
curl http://localhost:8000/validate
```

### 4. Install Firefox Extension

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `extension/` directory
4. The extension icon will appear in your toolbar

## Usage

### Fill a Form Field

**API Endpoint**: `POST /fill-form`

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "What is your work experience?"}'
```

**Response**:
```json
{
  "answer": "5 years of software development experience...",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 3
}
```

### Validate Configuration

**API Endpoint**: `GET /validate`

```bash
curl http://localhost:8000/validate
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-09T12:00:00.000Z",
  "total_duration_ms": 561,
  "checks": [
    {"name": "internal_dns", "status": "passed", ...},
    {"name": "external_endpoint", "status": "passed", ...},
    {"name": "url_format", "status": "passed", ...},
    {"name": "embedding_dimensions", "status": "passed", ...}
  ]
}
```

### Using the Extension

1. Navigate to a job application page
2. Click the extension icon in the toolbar
3. Click "Fill Form" to auto-fill detected form fields
4. Review and submit the form

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/validate` | GET | Configuration validation |
| `/fill-form` | POST | Generate answer for form field |

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZAI_API_KEY` | Yes | - | Z.ai API key |
| `ZAI_BASE_URL` | No | `https://api.z.ai/v1` | API base URL |
| `QDRANT_URL` | No | `http://qdrant-db:6333` | Qdrant connection URL |
| `QDRANT_COLLECTION` | No | `resumes` | Vector collection name |
| `EMBEDDING_DIMENSION` | No | `1536` | Embedding vector size |
| `RETRIEVAL_K` | No | `5` | Number of context chunks |

### Docker Ports

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 8000 | HTTP API |
| Qdrant HTTP | 6333 | REST API + Dashboard |
| Qdrant gRPC | 6334 | gRPC API |

## Project Structure

```
.
├── src/                    # Backend source code
│   ├── api/               # API routes and schemas
│   ├── services/          # Business logic services
│   ├── config.py          # Configuration management
│   └── main.py            # FastAPI application
├── extension/             # Firefox extension
│   ├── content/           # Content scripts
│   ├── popup/             # Popup UI
│   ├── background/        # Background script
│   └── manifest.json      # Extension manifest
├── tests/                 # Test files
├── specs/                 # Feature specifications
├── docker-compose.yml     # Docker services
├── Dockerfile             # Backend container
└── requirements.txt       # Python dependencies
```

## Development

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/

# Run with verbose output
pytest tests/ -v
```

For detailed testing instructions, see [Testing Guide](docs/testing-guide.md).

### Local Development

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/

# Run with verbose output
pytest tests/ -v
```

### Local Development

```bash
# Run backend without Docker
uvicorn src.main:app --reload --port 8000

# Or with Docker (recommended for full stack)
docker-compose up -d
```

## Troubleshooting

### Backend won't start

1. Check that Qdrant is running: `docker ps | grep qdrant`
2. Verify environment variables: `cat .env`
3. Check logs: `docker-compose logs api-backend`

### Extension can't connect to backend

1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS configuration in `src/main.py`
3. Ensure port 8000 is not blocked

### Validation fails

Run `/validate` endpoint and check each check result:
- `internal_dns`: Qdrant container must be running
- `external_endpoint`: Port 8000 must be accessible
- `url_format`: Check `ZAI_BASE_URL` format
- `embedding_dimensions`: Verify API key is valid

## License

[Add license information]
