# Architecture - Jobs Backend

**Part:** Backend API  
**Technology:** Python 3.11+, FastAPI, Qdrant, PostgreSQL, Redis  
**Pattern:** Service-oriented Architecture with RAG Pipeline

---

## Executive Summary

The Jobs backend is a FastAPI service implementing a Retrieval-Augmented Generation (RAG) pipeline for automatically filling job application forms. It uses Qdrant vector database for semantic search, Mistral API for embeddings and LLM generation, PostgreSQL for job offers persistence, and Redis for caching.

---

## Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Web Framework | FastAPI | REST API server |
| Vector Database | Qdrant | Semantic similarity search |
| LLM/Embeddings | Mistral API | `mistral-embed` (1024-dim), `mistral-small-latest` |
| Database | PostgreSQL | Job offers CRUD + processing metadata |
| Cache | Redis | Response caching, SSE |
| Async | asyncpg, aioredis | Async database clients |

---

## Architecture Pattern

### Service-Oriented Architecture (SOA)

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (routes.py)                   │
│  /health, /validate, /api/v1/search, /job-offers/*            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │embedder.py   │ │retriever.py  │ │generator.py  │            │
│  │              │ │              │ │              │            │
│  │embed(query)  │ │hybrid_search │ │classify_and  │            │
│  │              │ │hybrid_search │ │extract()     │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │field_class.. │ │job_offers.py │ │  hyde.py     │            │
│  │              │ │              │ │              │            │
│  │classify_     │ │CRUD + SSE    │ │generate_     │            │
│  │field_type()  │ │              │ │hypothetical()│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Qdrant      │ │PostgreSQL    │ │   Redis      │            │
│  │  (Vectors)   │ │(Job Offers)  │ │  (Cache)     │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Services

### 1. Embedder Service (`src/services/embedder.py`)

**Responsibility:** Generate vector embeddings for query text

```python
class Embedder:
    async def embed(self, text: str) -> list[float]:
        """Generate 1024-dimensional embedding using mistral-embed"""
```

**Dependencies:** Mistral API (`mistral-embed` model)

---

### 2. Retriever Service (`src/services/retriever.py`)

**Responsibility:** Hybrid search combining vector and BM25 similarity

```python
class Retriever:
    async def hybrid_search(query: str, query_vector: list[float], k: int) -> list[dict]:
        """Combine vector similarity + BM25 ranking"""

    async def search_with_reranking(query: str, query_vector: list[float], k: int) -> list[dict]:
        """Hybrid search + cross-encoder reranking"""
```

**Features:**
- Hybrid search: `HYBRID_VECTOR_WEIGHT` (default 0.7) + `HYBRID_BM25_WEIGHT` (default 0.3)
- Phrase bonus for exact matches
- Optional cross-encoder reranking
- Optional LLM rubric reranking
- Optional MMR (Maximal Marginal Relevance) diversification

**Dependencies:** Qdrant vector database

---

### 3. Generator Service (`src/services/generator.py`)

**Responsibility:** LLM-based answer generation with field classification

```python
class Generator:
    async def classify_and_extract(context: str, label: str, signals: dict | None) -> Classification:
        """Use LLM to classify field type and extract answer"""
```

**Features:**
- Anti-hallucination prompts (grounded in retrieved context)
- Field type classification (name, email, phone, etc.)
- Confidence scoring

**Dependencies:** Mistral API (`mistral-small-latest`)

---

### 4. HyDE Service (`src/services/hyde.py`)

**Responsibility:** Hypothetical Document Embeddings for improved retrieval

```python
class HyDE:
    async def generate_hypothetical(self, query: str) -> str:
        """Generate hypothetical document that answers the query"""

    async def embed_hypothetical(self, query: str) -> list[float]:
        """Get embedding of generated hypothetical document"""
```

**Features:**
- Enabled via `HYDE_ENABLED` (default: True)
- Configurable model, max tokens, temperature
- Cache with TTL (`HYDE_CACHE_TTL`, default: 3600s)

---

### 5. Field Classifier Service (`src/services/field_classifier.py`)

**Responsibility:** Detect form field semantic type from browser signals

```python
class SemanticFieldType(Enum):
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PHONE = "phone"
    CITY = "city"
    POSTCODE = "postcode"
    STREET = "street"
    # ...

def classify_field_type(signals: dict) -> SemanticFieldType | None:
    """Detect field type from autocomplete, html_type, label"""
```

**Supported Fields (6-field + extended):**
- First Name, Last Name, Email, Phone
- City, Postcode, Street Address

---

### 6. Job Offers Service (`src/services/job_offers.py`)

**Responsibility:** Job offers CRUD with PostgreSQL and real-time sync

```python
class JobOffersService:
    async def get_job_offers(limit: int | None, offset: int | None) -> list[dict]:
        """List job offers with processing metadata"""

    async def update_and_broadcast(job_offer_id: int, **kwargs) -> dict:
        """Update job offer + broadcast via SSE"""

    async def get_applied_jobs_for_csv() -> list[dict]:
        """Get applied jobs for CSV export"""
```

**Features:**
- PostgreSQL for persistence (asyncpg)
- Redis caching
- SSE (Server-Sent Events) for real-time updates
- CSV export for applied jobs

---

## API Endpoints

### Health & Validation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/validate` | GET | Configuration validation (DNS, endpoints, API) |

### Search & Form Filling
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/search` | POST | Unified search + generation endpoint |

**Search Request Schema:**
```python
class SearchRequest(BaseModel):
    query: str                    # Form field label
    generate: bool = False        # Generate answer via LLM
    signals: dict | None = None  # Browser signals (autocomplete, html_type)
    use_hyde: bool = True         # Use HyDE
    use_reranking: bool = False   # Use cross-encoder reranking
    top_k: int = 5                # Number of results
    include_scores: bool = False   # Include score breakdown
```

### Job Offers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/job-offers` | GET | List job offers (supports `?format=csv`) |
| `/job-offers/{id}` | GET | Get single job offer |
| `/job-offers/{id}` | POST | Create job offer |
| `/job-offers/{id}` | PUT | Replace job offer |
| `/job-offers/{id}` | PATCH | Partial update |
| `/job-offers/{id}` | DELETE | Delete job offer |
| `/job-offers/{id}/process` | PATCH | Update processing metadata |
| `/job-offers/stream` | GET | SSE stream for real-time updates |

---

## Data Models

### Job Offer (PostgreSQL)
```sql
CREATE TABLE job_offers (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    company TEXT,
    status VARCHAR(20) DEFAULT 'not_applied',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_offers_process (
    job_offer_id INTEGER REFERENCES job_offers(id),
    research BOOLEAN DEFAULT FALSE,
    research_email BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (job_offer_id)
);
```

### Resume Chunk (Qdrant)
```python
{
    "id": "chunk_1",
    "vector": [0.1, 0.2, ...],  # 1024-dimensional
    "payload": {
        "text": "5 years of software development...",
        "source": "resume",
        "type": "experience"
    }
}
```

---

## Configuration

All configuration via environment variables (see `src/config.py`):

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_URL` | http://qdrant:6333 | Qdrant connection |
| `MISTRAL_API_KEY` | (required) | Mistral API key |
| `MISTRAL_EMBEDDING_MODEL` | mistral-embed | Embedding model |
| `EMBEDDING_DIMENSION` | 1024 | Vector size |
| `HYDE_ENABLED` | true | Enable HyDE |
| `EMBEDDING_RERANK_ENABLED` | false | Enable cross-encoder |
| `DATABASE_URL` | PostgreSQL URL | PostgreSQL connection |
| `REDIS_URL` | redis://redis:6379 | Redis connection |

---

## Extension Integration

The Firefox extension communicates with the backend:

1. **Form Filling**: `POST /api/v1/search` with query + signals → receives generated answer
2. **Job Tracking**: `GET /job-offers` + `PATCH /job-offers/{id}/process` for status updates
3. **Real-time Sync**: `GET /job-offers/stream` SSE for live status updates

---

## Related Documentation

- [Project Overview](./project-overview.md)
- [API Contracts](./api-contracts.md)
- [Development Guide](./development-guide.md)