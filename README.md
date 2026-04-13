# Jobs

**Version 0.7.1**

An AI-powered system for job application management: automatically fills job application forms using resume data (RAG pipeline) and tracks job postings with application status. The extension provides a Job Links Manager to monitor applied, in-progress, and pending job applications with local caching, real-time sync, and instant UI rendering.

## Overview

Job Forms Helper consists of four main components:

1. **Backend API** - A FastAPI service that processes form field labels and generates answers based on resume data stored in a vector database. Built with FastAPI and Pydantic v2, uses vector embeddings, reranking, and hybrid search.
2. **Browser Extension** - A Chrome/Firefox extension with two main features:
   - **Job Forms Helper** - Detects form fields on job application pages and fills them using the backend API
   - **Job Links Manager** - Tracks job postings with application status (Applied/In Progress/Not Applied), displays job lists, and exports applied jobs as CSV
   - Currently undergoing ES Module conversion refactoring
3. **n8n Automation Workflows** - No-code automation pipelines for job offers extraction, skills import, application writer, and job fit chat
4. **Test Suite** - Comprehensive testing including unit, integration, end-to-end, and load tests

Git repository: `git@github.com:aliuosio/jobs.git`
Latest commit: `49c7ed81b4991fee77e21d447a6782571a56353a`

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
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Field Classif.│  │Validation Svc│  │Job Offers Svc│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                              │                   │
│                                              ↓                   │
│                                    ┌──────────────┐             │
│                                    │  PostgreSQL  │             │
│                                    │  + Redis     │             │
│                                    └──────────────┘             │
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
docker compose logs -f n8n # wait for the workflows to be imported
```

This starts:
- **Qdrant** (vector database) on ports 6333/6334
- **PostgreSQL** (persistent database) on port 5432
- **Redis** (cache layer) on port 6379
- **n8n** (no-code automation workflows) on port 5678
- **Backend API** on port 8000

n8n workflows include:
  - Job Offers Extractor
  - Job Skills Import
  - Job Application Writer
  - Jobs Fit Chat

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

### Search and Generate Answers

**API Endpoint**: `POST /api/v1/search`

```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is your work experience?", "generate": true}'
```

**Response**:
```json
{
  "results": [...],
  "generated_answer": "5 years of software development experience...",
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
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Email Address", "generate": true, "signals": {"autocomplete": "email", "html_type": "email"}}'
```

**Response**:
```json
{
  "results": [...],
  "generated_answer": "john.doe@example.com",
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

The extension has two tabs in the popup:

#### Job Links Tab

The **Job Links** tab displays tracked job postings with their application status:

1. Click the extension icon in the toolbar
2. The **Job Links** tab shows all job offers from the backend
3. Each job shows:
   - Job title and company
   - Application status badge (Applied/Not Applied/In Progress)
   - Link to the original job posting
4. Use **"Show Applied"** checkbox to filter visibility
5. Click **"Refresh Jobs"** to reload from backend
6. Click **"Export Applied"** to download applied jobs as CSV

**Job Status Indicators:**
- 🟢 **Applied** - Application submitted
- 🟡 **In Progress** - Currently working on application
- ⚪ **Not Applied** - Not yet applied

#### Job Forms Helper Tab

1. Navigate to a job application page
2. Switch to **"Job Forms Helper"** tab
3. Click **"Scan Page"** to detect form fields
4. Click **"Fill All Fields"** to auto-fill detected fields
5. Review and submit the form

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/validate` | GET | Configuration validation |
| `/api/v1/search` | POST | Unified search + generation endpoint (preferred) |
| `/fill-form` | POST | (removed, use /api/v1/search) |
| `/job-offers` | GET | List all job offers |
| `/job-offers` | POST | Create a new job offer |
| `/job-offers/{id}` | GET | Get a specific job offer |
| `/job-offers/{id}` | PUT | Update a job offer |
| `/job-offers/{id}` | PATCH | Partially update a job offer |
| `/job-offers/{id}` | DELETE | Delete a job offer |
| `/job-offers/stream` | GET | SSE stream for real-time job status updates |

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
| `POSTGRES_URL` | No | `postgresql://postgres:postgres@postgres:5432/jobs` | PostgreSQL connection URL |
| `REDIS_URL` | No | `redis://redis:6379` | Redis connection URL |

### Retrieval Enhancements (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `HYDE_ENABLED` | false | Enable HyDE (Hypothetical Document Embeddings) |
| `HYDE_MODEL` | mistral-small-latest | LLM model for HyDE generation |
| `HYDE_MAX_TOKENS` | 200 | Max tokens in HyDE draft |
| `HYDE_TEMPERATURE` | 0.7 | Temperature for HyDE generation |
| `EMBEDDING_RERANK_ENABLED` | false | Enable cross-encoder reranking |
| `EMBEDDING_RERANK_TOP_K` | 50 | Number of candidates to rerank |
| `CROSS_ENCODER_MODEL` | ms-marco-MiniLM-L-6-v2 | Cross-encoder model |
| `LLM_RERANK_ENABLED` | false | Enable LLM rubric reranking |
| `LLM_RERANK_TOP_K` | 10 | Number of candidates for LLM rerank |
| `MMR_ENABLED` | false | Enable MMR diversification |
| `MMR_K` | 10 | Number of results for MMR |
| `MMR_LAMBDA` | 0.5 | MMR balance (0=relevance, 1=diversity) |
| `RETRIEVAL_VECTOR_WEIGHT` | 0.5 | Weight for vector similarity |
| `RETRIEVAL_BM25_WEIGHT` | 0.3 | Weight for BM25 scores |
| `RETRIEVAL_RERANK_WEIGHT` | 0.2 | Weight for reranking scores |

### Docker Ports

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 8000 | HTTP API |
| Qdrant HTTP | 6333 | REST API + Dashboard |
| Qdrant gRPC | 6334 | gRPC API |
| PostgreSQL | 5432 | Relational database |
| Redis | 6379 | Cache layer |
| n8n | 5678 | Automation workflows UI |

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
│   │   ├── job_offers.py  # Job offers CRUD operations
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
├── scripts/               # Utility scripts (Python and bash) for environment setup, data migration, and sync operations
│   ├── ingest_profile.py  # Profile ingestion
│   ├── export_stories.py  # BMAD story exporter
│   ├── sync_stories.py    # BMAD GitHub bridge
│   ├── migrate_sparse_vectors.py # Hybrid search data migration
│   └── init-env.sh        # Environment initialization
├── tests/                 # Test files
├── specs/                 # Feature specifications
│   ├── 001-es-module-conversion/ # ES Module conversion specification
│   ├── 002-dynamic-field-detection/ # Dynamic field detection
│   ├── 003-unit-tests-english/ # English unit tests
│   ├── 004-job-links-selector/ # Job links selector
│   ├── 005-job-links-selector/ # Job links selector v2
│   ├── 006-job-offers-api/ # Job offers API
│   ├── 007-update-job-offer-api/ # Update job offer API
│   ├── 008-job-applied-toggle/ # Job applied toggle
│   ├── 011-job-status-filter-fix/ # Status filter fix
│   └── 012-job-status-sync/ # Real-time status sync
├── docs/                  # Documentation
├── docker-compose.yml     # Docker services
├── .docker/               # Docker configurations
│   └── api-backend/
│       └── requirements.txt # Production Python dependencies
├── Dockerfile             # Backend container
└── requirements.txt       # Development Python dependencies
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
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "First Name", "generate": true, "signals": {"autocomplete": "given-name"}}'

# Test Last Name
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Last Name", "generate": true, "signals": {"autocomplete": "family-name"}}'

# Test Email
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Email", "generate": true, "signals": {"autocomplete": "email"}}'

# Test City
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "City", "generate": true, "signals": {"autocomplete": "address-level2"}}'

# Test Postcode
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Postcode", "generate": true, "signals": {"autocomplete": "postal-code"}}'

# Test Street
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Street", "generate": true, "signals": {"autocomplete": "street-address"}}'
```

#### Expected Response Format

```json
{
  "generated_answer": "Osiozekha",
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

# Run integration tests for /api/v1/search endpoint
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

### Recent Updates (v0.7.1)

✅ **Cache-first job loading** - instant popup rendering with local persistence
✅ **Highlight styling** for new/updated job postings
✅ **Loading states & error handling** for refresh operations
✅ **Persisted job state** across browser restarts
✅ **Fixed CSV export** with correct timestamp handling
✅ **Fresh job listings fetch** on popup open
✅ **Extension debug mode** for development

### Backend Services

- **Embedder Service**: Generates 1024-dimensional embeddings using Mistral's `mistral-embed` model
- **Retriever Service**: Performs semantic search against Qdrant vector database
- **Generator Service**: Produces grounded answers using `mistral-small-latest` with anti-hallucination prompts
- **Field Classifier Service**: Detects field types (email, phone, name, etc.) from form signals
- **Job Offers Service**: Manages job offers with PostgreSQL storage and real-time sync
- **Validation Service**: Runs health checks on DNS, endpoints, and API configuration

### Extension Components

- **Content Script**: Main injection script managing form detection and filling
- **Form Scanner**: 5-strategy label detection (for-id, wrapper, aria-labelledby, proximity, name/id fallback)
- **Field Filler**: React/Angular-compatible value injection with maxlength support
- **Form Observer**: MutationObserver for dynamic form detection
- **Signal Extractor**: Extracts autocomplete, label, name attributes for field classification
- **API Client**: 10-second timeout HTTP client with structured error handling
- **Job Links Manager**: Displays tracked job links with applied status filtering, visited link tracking, cache-first loading, and real-time SSE synchronization

### Job Offers API

The Job Offers API provides CRUD operations for managing job applications with real-time status synchronization:

**Features:**
- Full CRUD operations (Create, Read, Update, Delete)
- PostgreSQL database for persistent storage
- Redis caching for improved performance
- Server-Sent Events (SSE) for real-time status updates
- Applied status toggle (applied/not_applied/in_progress)
- Job link tracking and filtering

**Example Usage:**

```bash
# List all job offers
curl http://localhost:8000/job-offers

# Create a new job offer
curl -X POST http://localhost:8000/job-offers \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/job/123", "title": "Software Engineer", "company": "Tech Corp"}'

# Update job offer status
curl -X PATCH http://localhost:8000/job-offers/1 \
  -H "Content-Type: application/json" \
  -d '{"applied": true}'

# Stream real-time updates
curl http://localhost:8000/job-offers/stream
```

**Data Model:**
- `id`: Unique identifier
- `url`: Job posting URL
- `title`: Job title
- `company`: Company name
- `applied`: Application status (boolean)
- `status`: Application state (applied/not_applied/in_progress)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

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

## Changelog

### 0.7.1 (Current)
- ✅ Added BMAD story management system
- ✅ Added GitHub sync bridge for stories
- ✅ Added hybrid search with BM25 weighting
- ✅ Added Redis caching layer
- ✅ Added profile ingestion script
- ✅ Added sparse vector migration tools
- ✅ Fixed popup width increased to 480px
- ✅ Added job offer letter status endpoint
- ✅ Improved cover letter generation flow

### 0.5.3
- ✅ Added cache-first job loading with instant popup startup
- ✅ Added highlight styling for new job postings
- ✅ Fixed refresh job button loading state
- ✅ Implemented persisted job state across browser sessions
- ✅ Corrected timestamp formatting in CSV export
- ✅ Added popup debug panel for development
- ✅ Fixed dynamic field population regression
- ✅ Improved job offer caching performance

### 0.5.1
- ✅ Added SSE real-time status sync
- ✅ Implemented job status filtering
- ✅ Added CSV export for applied jobs
- ✅ Fixed form observer dynamic field detection

## Roadmap

* [ ] Verify resume input/output pipeline
* [ ] Automated cover letter generation
* [ ] Integrate cover letter generation into Extension
* [x] LinkedIn application automation
* [ ] Multi-profile support
* [ ] Analytics dashboard for application success rate

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.