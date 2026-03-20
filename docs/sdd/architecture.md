# Software Design Document: Architecture

**Project**: Job Forms Helper  
**Version**: 1.0.0  
**Last Updated**: 2026-03-19

## 1. System Overview

Job Forms Helper is an AI-powered system that automatically fills job application forms using resume data. The system employs a RAG (Retrieval-Augmented Generation) pipeline to match form fields with relevant resume content stored in a vector database.

### 1.1 Key Capabilities

- Semantic field detection from HTML form signals
- Vector-based resume content retrieval
- Grounded LLM answer generation with anti-hallucination
- Direct field value extraction for known types (email, phone, name)
- Real-time form filling compatible with React/Angular frameworks

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Backend Framework | FastAPI | Latest |
| Language | Python | 3.11+ |
| Vector Database | Qdrant | Latest |
| LLM Provider | Mistral AI | mistral-small-latest |
| Embedding Model | Mistral | mistral-embed (1024-dim) |
| Frontend | Firefox Extension | Manifest V3 |
| Container Runtime | Docker / Docker Compose | Latest |

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FIREFOX EXTENSION                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Popup UI       │  │  Background     │  │  Content Script │             │
│  │  (popup.html)   │  │  (background.js)│  │  (content.js)   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                  │                          │
│                          ┌─────────────────────┼─────────────────────┐      │
│                          ▼           ▼         ▼         ▼           │      │
│                   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│      │
│                   │  Form    │ │  Field   │ │  Signal  │ │   API    ││      │
│                   │  Scanner │ │  Filler  │ │Extractor │ │  Client  ││      │
│                   └──────────┘ └──────────┘ └──────────┘ └──────────┘│      │
│                          │           │                      │        │      │
└──────────────────────────┼───────────┼──────────────────────┼────────┘      │
                           │           │                      │               │
                           │           │   HTTP POST          │               │
                           │           │   /fill-form         │               │
                           │           │                      ▼               │
┌──────────────────────────┼───────────┼─────────────────────────────────────┐
│                          │           │        BACKEND API (FastAPI)         │
│                          │           │   ┌─────────────────────────────────┐│
│                          │           │   │         API Routes              ││
│                          │           │   │  /health  /validate  /fill-form ││
│                          │           │   └─────────────────────────────────┘│
│                          │           │                   │                  │
│                          │           │                   ▼                  │
│                          │           │   ┌─────────────────────────────────┐│
│                          │           │   │        Field Classifier         ││
│                          │           │   │  (Semantic field detection)     ││
│                          │           │   └─────────────────────────────────┘│
│                          │           │                   │                  │
│                          │           │    ┌──────────────┼──────────────┐  │
│                          │           │    ▼              ▼              ▼  │
│                          │           │ ┌────────┐  ┌──────────┐  ┌────────┐│
│                          │           │ │Embedder│  │Retriever │  │Generator│
│                          │           │ │Service │  │ Service  │  │ Service ││
│                          │           │ └────────┘  └──────────┘  └────────┘│
│                          │           │      │            │             │    │
│                          │           │      │            ▼             │    │
│                          │           │      │     ┌──────────┐         │    │
│                          │           │      │     │  Qdrant  │         │    │
│                          │           │      │     │  Vector  │         │    │
│                          │           │      │     │   DB     │         │    │
│                          │           │      │     └──────────┘         │    │
│                          │           │      │                          │    │
│                          │           │      └────────────┬─────────────┘    │
│                          │           │                   ▼                  │
│                          │           │     ┌─────────────────────────────┐ │
│                          │           │     │       Mistral API           │ │
│                          │           │     │  (Embeddings + Generation)  │ │
│                          │           │     └─────────────────────────────┘ │
└──────────────────────────┼───────────┼─────────────────────────────────────┘
                           │           │
                           ▼           ▼
                    ┌─────────────────────┐
                    │    Job Application  │
                    │    Web Page (DOM)   │
                    └─────────────────────┘
```

## 3. Component Descriptions

### 3.1 Firefox Extension

#### 3.1.1 Popup UI (`popup/popup.html`)
- User interface for extension activation
- Displays fill status and results
- Provides manual refresh trigger

#### 3.1.2 Background Script (`background/background.js`)
- Handles extension lifecycle events
- Manages tab communication
- Coordinates between popup and content scripts

#### 3.1.3 Content Scripts

| Script | Responsibility |
|--------|---------------|
| `content.js` | Main orchestrator, coordinates all content script modules |
| `form-scanner.js` | Detects form fields using 5-strategy label detection |
| `field-filler.js` | Injects values with React/Angular event compatibility |
| `form-observer.js` | MutationObserver for dynamic form detection |
| `signal-extractor.js` | Extracts autocomplete, label, name attributes |
| `api-client.js` | HTTP client for backend communication (10s timeout) |

### 3.2 Backend API

#### 3.2.1 API Routes (`src/api/routes.py`)
- `/health` - Service health check
- `/validate` - Configuration validation
- `/fill-form` - Main form filling endpoint

#### 3.2.2 Services

| Service | File | Responsibility |
|---------|------|---------------|
| Embedder | `src/services/embedder.py` | Generate 1024-dim embeddings via Mistral API |
| Retriever | `src/services/retriever.py` | Vector search against Qdrant (k=5) |
| Generator | `src/services/generator.py` | Grounded LLM answer generation |
| Field Classifier | `src/services/field_classifier.py` | Semantic field type detection |
| Validation | `src/services/validation.py` | Configuration health checks |

### 3.3 External Dependencies

| Dependency | Purpose | Configuration |
|------------|---------|---------------|
| Qdrant | Vector storage for resume chunks | `QDRANT_URL`, `QDRANT_COLLECTION` |
| Mistral API | Embeddings + LLM inference | `MISTRAL_API_KEY`, `MISTRAL_BASE_URL` |

## 4. Data Models

### 4.1 Request Models

```python
class AnswerRequest(BaseModel):
    label: str           # Form field label (1-1000 chars)
    signals: dict | None # Optional field classification signals
```

### 4.2 Response Models

```python
class AnswerResponse(BaseModel):
    answer: str                    # Generated answer text
    has_data: bool                 # Whether context was found
    confidence: ConfidenceLevel    # HIGH | MEDIUM | LOW | NONE
    context_chunks: int            # Number of retrieved chunks (0-5)
    field_value: str | None        # Direct extracted value
    field_type: str | None         # Semantic field type
```

### 4.3 Qdrant Payload Schema

```json
{
  "text": "string - resume chunk text",
  "t": "p | e | s - chunk type (profile, experience, skills)",
  "profile": {
    "fn": "Full Name",
    "em": "email@example.com",
    "ph": "+1-555-123-4567",
    "adr": { "city": "City", "st": "Street", "zip": "12345", "cc": "US" },
    "social": { "gh": "github_username", "li": "linkedin_handle" }
  }
}
```

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                      │
│                                                              │
│  ┌─────────────────────┐     ┌─────────────────────────────┐│
│  │   api-backend       │     │         qdrant              ││
│  │   (FastAPI)         │     │     (Vector Database)       ││
│  │                     │     │                             ││
│  │   Port: 8000        │────▶│   HTTP Port: 6333           ││
│  │                     │     │   gRPC Port: 6334           ││
│  └─────────────────────┘     │                             ││
│                              │   Volume: qdrant_storage    ││
│  Environment:                └─────────────────────────────┘│
│  - MISTRAL_API_KEY                                         │
│  - QDRANT_URL=http://qdrant:6333                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Mistral API   │
                    │   (External)    │
                    └─────────────────┘
```

## 6. Security Considerations

### 6.1 CORS Configuration
- Allows `moz-extension://*` origins
- Allows `http://localhost` for development
- Credentials enabled for session management

### 6.2 Input Validation
- Label length: 1-1000 characters
- Request payload: Max 10KB
- Signals dictionary: Optional, validated as dict

### 6.3 Error Handling
- 400: Invalid request payload
- 413: Payload too large
- 500: Internal server error
- 503: External service unavailable

## 7. Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Embedding Generation | ~300ms | Mistral API latency |
| Vector Search | ~50ms | Qdrant query time |
| LLM Generation | ~500ms | Mistral API latency |
| Total Request | ~1s | End-to-end fill-form |
| Retrieval k | 5 | Constitution II compliance |
| Embedding Dimensions | 1024 | Constitution I compliance |

## 8. File Structure

```
.
├── src/
│   ├── api/
│   │   ├── routes.py          # API endpoint handlers
│   │   └── schemas.py         # Pydantic request/response models
│   ├── services/
│   │   ├── embedder.py        # Mistral embedding client
│   │   ├── retriever.py       # Qdrant vector search
│   │   ├── generator.py       # LLM answer generation
│   │   ├── field_classifier.py # Semantic field detection
│   │   └── validation.py      # Configuration validation
│   ├── utils/
│   │   └── retry.py           # Retry logic
│   ├── config.py              # Pydantic Settings
│   └── main.py                # FastAPI application
├── extension/
│   ├── content/
│   │   ├── content.js         # Main orchestrator
│   │   ├── form-scanner.js    # Field detection
│   │   ├── field-filler.js    # Value injection
│   │   ├── form-observer.js   # Dynamic form detection
│   │   ├── signal-extractor.js # Signal extraction
│   │   └── api-client.js      # Backend communication
│   ├── popup/
│   │   ├── popup.html         # Popup UI
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styles
│   ├── background/
│   │   └── background.js      # Background script
│   └── manifest.json          # Extension manifest
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── docs/
│   └── sdd/                   # Software Design Documents
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Backend container
└── requirements.txt           # Python dependencies
```

## 9. Constitution Compliance

This architecture adheres to the following constitutional principles:

| Principle | Implementation |
|-----------|---------------|
| I. SOLID | Single-responsibility services |
| II. DRY | Centralized config, shared utilities |
| III. YAGNI | No speculative features |
| IV. KISS | Linear data flow, explicit code |
| V. Type Safety | Full type annotations, Pydantic validation |
| VI. Composition | DI over inheritance |
| VII. Git-Flow | Feature branches for all changes |

### Runtime Constitution Compliance

| Runtime Constitution | Implementation |
|---------------------|---------------|
| I. Embedding Dimensions | 1024-dim vectors (mistral-embed) |
| II. Retrieval Configuration | k=5 context chunks |
| III. Anti-Hallucination | Grounded prompts, temperature=0.3 |
| IV. CORS Configuration | moz-extension://* origins |
| V. Event Dispatching | bubbles: true on input/change events |
