# Technical Overview

This document provides a technical overview of the Job Forms Helper system architecture and components.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Firefox       │     │   Backend API   │     │    Qdrant       │
│   Extension     │────▶│   (FastAPI)     │────▶│   (Vector DB)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Z.ai API      │
                        │ (Embeddings+LLM)│
                        └─────────────────┘
```

## Components

### 1. Backend API (FastAPI)

The backend is a Python FastAPI application that implements a RAG (Retrieval-Augmented Generation) pipeline.

**Entry Point**: `src/main.py`

- Creates FastAPI application with CORS middleware
- Manages application lifespan (connects to Qdrant on startup)
- Includes API router from `src/api/routes.py`

#### API Routes (`src/api/routes.py`)

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/health` | GET | `health_check()` | Returns service health status |
| `/validate` | GET | `validate_configuration()` | Runs configuration validation checks |
| `/api/v1/search` | POST | `search()` | Unified search + generation endpoint |

#### Data Schemas (`src/api/schemas.py`)

Pydantic models for request/response validation:

- `AnswerRequest` - Form field label input
- `AnswerResponse` - Generated answer with confidence metadata
- `HealthResponse` - Health check response
- `ErrorResponse` - Error details
- `ValidationReport` - Complete validation results
- `CheckResult` - Individual validation check result

### 2. Services Layer

The services layer contains business logic for the RAG pipeline.

#### Embedder Service (`src/services/embedder.py`)

**Purpose**: Generate 1536-dimensional embeddings for text queries.

**Key Features**:
- Uses OpenAI-compatible API via `AsyncOpenAI` client
- Model: `text-embedding-3-small`
- Outputs 1536-dimensional vectors (Constitution I compliance)

```python
class EmbedderService:
    async def embed(self, text: str) -> list[float]:
        # Returns 1536-dimensional embedding vector
```

#### Retriever Service (`src/services/retriever.py`)

**Purpose**: Search Qdrant vector database for relevant context chunks.

**Key Features**:
- Async Qdrant client for non-blocking operations
- Returns top-k similar vectors (default k=5, Constitution II compliance)
- Connection lifecycle management (connect/close)
- Health check capability
- Hybrid search with BM25 fallback

```python
class RetrieverService:
    async def connect(self) -> None
    async def close(self) -> None
    async def search(self, query_vector: list[float], k: int | None = None) -> list[dict]
    async def hybrid_search(self, query_text: str, dense_vector: list[float], k: int | None = None) -> list[dict]
    async def health_check(self) -> bool
```

**Hybrid Search**: Combines dense vector similarity (70%) with BM25 sparse matching (30%) for improved domain-specific term matching. Includes phrase bonus for multi-word queries.

#### Generator Service (`src/services/generator.py`)

**Purpose**: Generate grounded answers using LLM based on retrieved context.

**Key Features**:
- Uses OpenAI-compatible API
- Model: `gpt-4o-mini`
- Anti-hallucination system prompt (Constitution III compliance)
- Low temperature (0.3) for factual responses

```python
class GeneratorService:
    async def generate_answer(self, context: str, question: str) -> str:
        # Returns answer grounded in provided context
```

#### Validation Service (`src/services/validation.py`)

**Purpose**: Run configuration validation checks.

**Validation Checks**:

1. **internal_dns** - Verifies backend can reach Qdrant via Docker DNS (`qdrant-db:6333`)
2. **external_endpoint** - Verifies `localhost:8000/health` is accessible
3. **url_format** - Validates `ZAI_BASE_URL` format (no path duplication)
4. **embedding_dimensions** - Generates test embedding and verifies 1536 dimensions

**Key Features**:
- 10-second timeout per check
- Dependency handling (embedding check skipped if DNS fails)
- Parallel execution of independent checks
- Detailed error messages with actionable recommendations

```python
async def run_all_checks() -> ValidationReport:
    # Runs all four checks and returns aggregated report
```

### 3. Configuration (`src/config.py`)

Pydantic Settings for environment variable management:

```python
class Settings(BaseSettings):
    QDRANT_URL: str = "http://qdrant-db:6333"
    QDRANT_COLLECTION: str = "resumes"
    ZAI_API_KEY: str  # Required
    ZAI_BASE_URL: str = "https://api.z.ai/v1"
    EMBEDDING_DIMENSION: int = 1536
    RETRIEVAL_K: int = 5
    MAX_RETRIES: int = 4
    RETRY_BASE_DELAY: float = 1.0
```

### 4. Firefox Extension

A Manifest V3 WebExtension for Firefox.

**Manifest**: `extension/manifest.json`

#### Content Scripts

| Script | Purpose |
|--------|---------|
| `api-client.js` | HTTP client for backend communication with timeout handling |
| `form-scanner.js` | Detects and scans form fields on web pages |
| `field-filler.js` | Fills form fields with generated answers |
| `form-observer.js` | Monitors DOM for dynamically added forms |
| `content.js` | Main content script coordinator |

#### API Client (`extension/content/api-client.js`)

**Configuration**:
- Endpoint: `http://localhost:8000`
- Timeout: 10 seconds
- Error handling with custom `ApiError` class

**Key Functions**:
- `search(query, options)` - POST to `/api/v1/search`
- `checkApiHealth()` - GET `/health`

#### Popup UI (`extension/popup/`)

- `popup.html` - Extension popup interface
- `popup.js` - Popup logic and event handlers
- `popup.css` - Popup styling

#### Background Script (`extension/background/background.js`)

Handles extension lifecycle events and message passing.

## Data Flow

### Form Fill Request Flow

```
1. Extension detects form field with label
2. Extension calls POST /api/v1/search with generate=true
3. Backend generates embedding for query
4. Backend searches Qdrant for similar vectors
5. Backend assembles context from retrieved chunks
6. Backend generates answer using LLM
7. Backend returns answer with confidence level
8. Extension fills form field with answer
```

### Validation Flow

```
1. Client calls GET /validate
2. Backend runs checks in order:
   a. internal_dns (first, no deps)
   b. external_endpoint + url_format (parallel)
   c. embedding_dimensions (depends on internal_dns)
3. Backend aggregates results
4. Backend returns ValidationReport
```

## Infrastructure

### Docker Services (`docker-compose.yml`)

**qdrant-db**:
- Image: `qdrant/qdrant:latest`
- Ports: 6333 (HTTP), 6334 (gRPC)
- Volume: `./qdrant_storage` for persistence
- Network: `rag-network`

**api-backend**:
- Build: Local Dockerfile
- Port: 8000
- Volume: `./src:/app/src` for development
- Depends on: qdrant-db (health condition)

### Network

All services run on `rag-network` bridge network, enabling:
- Internal DNS resolution (`qdrant-db:6333`)
- Service isolation from host network

## Constitutional Compliance

The system follows these architectural principles:

1. **Constitution I**: 1536-dimensional embeddings
2. **Constitution II**: k=5 retrieval (5 context chunks)
3. **Constitution III**: Anti-hallucination prompts for grounded answers
4. **Constitution IV**: CORS configured for extension access

## Error Handling

- All API errors return structured `ErrorResponse`
- Timeouts are handled with 10-second limits
- Validation checks report actionable error messages
- Extension handles API unavailability gracefully