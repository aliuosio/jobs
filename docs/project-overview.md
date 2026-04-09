# Project Overview - Jobs

**Version:** 0.5.3  
**Last Updated:** 2026-04-09  
**Documentation Type:** Brownfield Project Documentation

---

## Executive Summary

**Jobs** is an AI-powered system for job application management. It automatically fills job application forms using resume data via a RAG (Retrieval-Augmented Generation) pipeline and tracks job postings with application status through a Firefox browser extension.

The system consists of three main components:
1. **Backend API** - FastAPI service with vector-based RAG pipeline
2. **Firefox Extension** - Browser extension for form filling and job tracking
3. **n8n Workflows** - Automation for job extraction and processing

---

## Technology Stack Summary

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend Language** | Python | 3.11+ |
| **Web Framework** | FastAPI | - |
| **Vector Database** | Qdrant | - |
| **LLM/Embeddings** | Mistral API | mistral-embed, mistral-small-latest |
| **Database** | PostgreSQL | - |
| **Cache** | Redis | - |
| **Browser Extension** | JavaScript (ES6+) | Firefox Manifest v3 |
| **Automation** | n8n | - |

---

## Architecture Type

**Multi-part Project:**
- `src/` - Python FastAPI backend (API, services, utilities)
- `extension/` - Firefox browser extension (Manifest v3)
- `n8n-workflows/`, `workflows/` - n8n automation workflows

---

## Repository Structure

```
jobs/
├── src/                    # Python FastAPI backend
│   ├── api/               # API routes and Pydantic schemas
│   ├── services/          # Business logic services
│   │   ├── embedder.py    # Mistral embedding service
│   │   ├── retriever.py   # Qdrant vector search
│   │   ├── generator.py   # LLM answer generation
│   │   ├── field_classifier.py  # Semantic field detection
│   │   ├── job_offers.py  # Job offers CRUD with PostgreSQL
│   │   ├── hyde.py        # HyDE (Hypothetical Document Embeddings)
│   │   ├── reranker.py    # Cross-encoder reranking
│   │   └── ...
│   └── config.py          # Configuration management
├── extension/             # Firefox extension (Manifest v3)
│   ├── content/           # Content scripts (form scanning, field filling)
│   ├── popup/             # Popup UI (job links manager)
│   ├── background/        # Background script
│   ├── services/          # API client, storage, SSE
│   └── manifest.json      # Extension manifest
├── n8n-workflows/         # n8n workflow JSON files
├── workflows/             # Additional n8n workflows
├── tests/                 # Test files
├── specs/                 # Feature specifications
├── docs/                  # Documentation
├── docker-compose.yml     # Docker services configuration
└── README.md              # Project documentation
```

---

## Key Features

### Backend API
- **RAG Pipeline**: Semantic search using Qdrant vector database
- **Hybrid Search**: Vector + BM25 with configurable weights
- **HyDE**: Hypothetical Document Embeddings for improved retrieval
- **Field Classification**: Semantic detection of form field types (name, email, phone, etc.)
- **Job Offers API**: Full CRUD with PostgreSQL, Redis caching, SSE real-time sync

### Firefox Extension
- **Form Scanner**: Detects form fields using 5-strategy label detection
- **Field Filler**: React/Angular-compatible value injection
- **Form Observer**: MutationObserver for dynamic form detection
- **Job Links Manager**: Track job applications with status (Applied/In Progress/Not Applied)
- **Cache-first loading**: Instant popup rendering with local persistence

### n8n Workflows
- Job extraction from search results
- Job research and relevance scoring
- Skills import and management

---

## Integration Points

| From | To | Type | Details |
|------|-----|------|---------|
| Extension | Backend | HTTP REST | `/api/v1/search` for form filling |
| Extension | Backend | SSE | `/job-offers/stream` for real-time updates |
| Backend | Qdrant | gRPC | Vector similarity search |
| Backend | PostgreSQL | asyncpg | Job offers persistence |
| Backend | Redis | redis-py | Caching layer |
| n8n | Backend | HTTP | Job offers management |

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Mistral API key
- Firefox browser (for extension)

### Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add MISTRAL_API_KEY

# 2. Start services
docker-compose up -d

# 3. Verify
curl http://localhost:8000/health

# 4. Install extension
# Open Firefox → about:debugging#/runtime/this-firefox
# Load Temporary Add-on → select extension/ directory
```

---

## Related Documentation

- [Technical Overview](./technical-overview.md)
- [Testing Guide](./testing-guide.md)
- [n8n RAG Integration](./n8n-rag-search-integration.md)
- [BMad Shortcuts](./bmad-shortcuts.md)