# Job Forms Helper

An AI-powered system that automatically fills job application forms using resume data. The system uses a RAG (Retrieval-Augmented Generation) pipeline to match form fields with relevant resume content.

## Overview

Job Forms Helper consists of two main components:

1. **Backend API** - A FastAPI service that processes form field labels and generates answers based on resume data stored in a vector database
2. **Firefox Extension** - A browser extension that detects form fields on job application pages and fills them using the backend API

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Firefox Extension                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Content Script│→ │ Form Scanner │  │ Field Filler │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                                    ↑                   │
│         ↓                                    │                   │
│  ┌──────────────┐                   ┌──────────────┐           │
│  │ API Client   │──────────────────→│Backend API   │           │
│  └──────────────┘                   └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Backend Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Embedder Svc  │→ │ Retriever Svc│→ │ Generator Svc│          │
│  │(Mistral)     │  │ (Qdrant)     │  │ (Mistral)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │Field Classif.│  │Validation Svc│                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Mistral API key (for embeddings and inference)
- Firefox browser (for the extension)

### 1. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Mistral API key
# MISTRAL_API_KEY=your_api_key_here
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
  "context_chunks": 3,
  "field_value": null,
  "field_type": null
}
```

### Direct Field Extraction

For known field types (name, email, phone), the API can extract values directly:

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Email Address", "signals": {"autocomplete": "email", "html_type": "email"}}'
```

**Response**:
```json
{
  "answer": "john.doe@example.com",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 1,
  "field_value": "john.doe@example.com",
  "field_type": "email"
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
  "timestamp": "2026-03-19T12:00:00.000Z",
  "total_duration_ms": 561,
  "checks": [
    {"name": "internal_dns", "status": "passed", "message": "...", "duration_ms": 100},
    {"name": "external_endpoint", "status": "passed", "message": "...", "duration_ms": 150},
    {"name": "url_format", "status": "passed", "message": "...", "duration_ms": 5},
    {"name": "embedding_dimensions", "status": "passed", "message": "...", "duration_ms": 306}
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
| `MISTRAL_API_KEY` | Yes | - | Mistral API key |
| `MISTRAL_BASE_URL` | No | `https://api.mistral.ai/v1` | Mistral API base URL |
| `MISTRAL_EMBEDDING_MODEL` | No | `mistral-embed` | Embedding model name |
| `QDRANT_URL` | No | `http://qdrant:6333` | Qdrant connection URL |
| `QDRANT_COLLECTION` | No | `resume` | Vector collection name |
| `EMBEDDING_DIMENSION` | No | `1024` | Embedding vector size |
| `RETRIEVAL_K` | No | `5` | Number of context chunks |
| `MAX_RETRIES` | No | `4` | Max retry attempts |
| `RETRY_BASE_DELAY` | No | `1.0` | Base delay between retries |

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
│   │   ├── routes.py      # Endpoint handlers
│   │   └── schemas.py     # Pydantic models
│   ├── services/          # Business logic services
│   │   ├── embedder.py    # Mistral embedding service
│   │   ├── retriever.py   # Qdrant vector search
│   │   ├── generator.py   # LLM answer generation
│   │   ├── field_classifier.py  # Semantic field detection
│   │   └── validation.py  # Config validation
│   ├── utils/             # Utility functions
│   │   └── retry.py       # Retry logic
│   ├── config.py          # Configuration management
│   └── main.py            # FastAPI application
├── extension/             # Firefox extension
│   ├── content/           # Content scripts
│   │   ├── content.js     # Main content script
│   │   ├── form-scanner.js # Field detection
│   │   ├── field-filler.js # Value injection
│   │   ├── form-observer.js # Dynamic form detection
│   │   ├── signal-extractor.js # Signal extraction
│   │   └── api-client.js  # Backend communication
│   ├── popup/             # Popup UI
│   ├── background/        # Background script
│   └── manifest.json      # Extension manifest
├── scripts/               # Utility scripts
│   └── ingest_profile.py  # Profile ingestion
├── tests/                 # Test files
├── specs/                 # Feature specifications
│   ├── 001-docker-infra/  # Docker setup spec
│   ├── 002-rag-backend/   # RAG pipeline spec
│   ├── 003-form-filler-extension/ # Extension spec
│   ├── 004-config-validation/ # Validation spec
│   └── 005-label-field-type-detection/ # Field detection spec
├── docs/                  # Documentation
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

### Six-Field Form Testing

The system supports direct field extraction for six core form fields from flat payloads:

| Field | Autocomplete Signal | Flat Field Name | Example Value |
|-------|---------------------|-----------------|---------------|
| First Name | `given-name` | `firstname` | `Osiozekha` |
| Last Name | `family-name` | `lastname` | `Aliu` |
| Email | `email` | `email` | `aliu@dev-hh.de` |
| City | `address-level2` | `city` | `Hamburg` |
| Postcode | `postal-code` | `postcode` | `22399` |
| Street | `street-address` | `street` | `Schleusentwiete 1` |

#### Testing All Six Fields

```bash
# Test First Name
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "First Name", "signals": {"autocomplete": "given-name"}}'

# Test Last Name
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Last Name", "signals": {"autocomplete": "family-name"}}'

# Test Email
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Email", "signals": {"autocomplete": "email"}}'

# Test City
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "City", "signals": {"autocomplete": "address-level2"}}'

# Test Postcode
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Postcode", "signals": {"autocomplete": "postal-code"}}'

# Test Street
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Street", "signals": {"autocomplete": "street-address"}}'
```

#### Expected Response Format

```json
{
  "answer": "Osiozekha",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 1,
  "field_value": "Osiozekha",
  "field_type": "first_name"
}
```

#### Running Six-Field Tests

```bash
# Run unit tests for six-field classification
pytest tests/unit/test_field_classifier_six_fields.py -v

# Run integration tests for /fill-form endpoint
pytest tests/integration/test_fill_form.py -v

# Run end-to-end tests
pytest tests/e2e/test_end2end_fill_form.py -v
```

See [specs/001-form-qa-field-testing/](specs/001-form-qa-field-testing/) for detailed specification and testing guidance.

### Local Development

```bash
# Run backend without Docker
uvicorn src.main:app --reload --port 8000

# Or with Docker (recommended for full stack)
docker-compose up -d
```

## Key Features

### Backend Services

- **Embedder Service**: Generates 1024-dimensional embeddings using Mistral's `mistral-embed` model
- **Retriever Service**: Performs semantic search against Qdrant vector database
- **Generator Service**: Produces grounded answers using `mistral-small-latest` with anti-hallucination prompts
- **Field Classifier Service**: Detects field types (email, phone, name, etc.) from form signals
- **Validation Service**: Runs health checks on DNS, endpoints, and API configuration

### Extension Components

- **Content Script**: Main injection script managing form detection and filling
- **Form Scanner**: 5-strategy label detection (for-id, wrapper, aria-labelledby, proximity, name/id fallback)
- **Field Filler**: React/Angular-compatible value injection with maxlength support
- **Form Observer**: MutationObserver for dynamic form detection
- **Signal Extractor**: Extracts autocomplete, label, name attributes for field classification
- **API Client**: 10-second timeout HTTP client with structured error handling

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
- `url_format`: Check `MISTRAL_BASE_URL` format
- `embedding_dimensions`: Verify API key is valid

## Todos

* verify resume input/output 
* get job descriptions (optimise Crawler)
* generate cover letter 
* add cover letter generation to Extension

## License

[Add license information]