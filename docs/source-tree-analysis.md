# Source Tree Analysis

**Project:** Jobs  
**Generated:** 2026-04-09  
**Scan Level:** Deep

---

## Directory Structure

```
jobs/
├── src/                         # Python FastAPI backend (API Layer)
│   ├── __init__.py
│   ├── main.py                  # FastAPI app + lifespan
│   ├── config.py                # Pydantic settings (env vars)
│   ├── api/                     # API Layer
│   │   ├── __init__.py
│   │   ├── routes.py            # All endpoint handlers
│   │   └── schemas.py           # Pydantic request/response models
│   ├── services/                # Business Logic Layer
│   │   ├── __init__.py
│   │   ├── embedder.py          # Mistral embeddings
│   │   ├── retriever.py         # Qdrant hybrid search
│   │   ├── generator.py        # LLM answer generation
│   │   ├── fill_form.py         # Form filling logic
│   │   ├── field_classifier.py  # Semantic field detection
│   │   ├── job_offers.py        # Job offers CRUD + SSE
│   │   ├── hyde.py              # Hypothetical Document Embeddings
│   │   ├── reranker.py          # Cross-encoder reranking
│   │   ├── validation.py        # Config validation
│   │   ├── csv_export.py        # CSV export for applied jobs
│   │   ├── broadcast.py         # SSE broadcasting
│   │   └── sparse_tokenizer.py  # BM25 tokenization
│   └── utils/                   # Utilities
│       ├── __init__.py
│       └── cache.py            # Redis caching utilities
│
├── extension/                   # Firefox Extension (Manifest v3)
│   ├── manifest.json            # Extension manifest
│   ├── background/
│   │   └── background.js        # Background script (module)
│   ├── content/                 # Content scripts (injected pages)
│   │   ├── content.js           # Main entry point
│   │   ├── form-scanner.js      # 5-strategy label detection
│   │   ├── field-filler.js      # Value injection (React/Angular compatible)
│   │   ├── form-observer.js     # MutationObserver for dynamic forms
│   │   ├── signal-extractor.js  # Extract autocomplete, html_type, label
│   │   └── content.css          # Injected styles
│   ├── popup/                   # Extension popup UI
│   │   ├── popup.html           # Popup HTML
│   │   ├── popup.js             # Popup logic (Job Links Manager)
│   │   └── popup.css            # Popup styles
│   ├── services/                # Extension services
│   │   ├── api-service.js       # Backend API client
│   │   ├── storage-service.js   # browser.storage.local wrapper
│   │   └── sse-service.js       # Server-Sent Events client
│   ├── icons/                   # Extension icons
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── tests/                   # Extension tests
│
├── n8n-workflows/               # n8n workflow JSONs
│   ├── 1.Job Offers Extractor.json
│   ├── 2.Job Offers Research.json
│   ├── 3.Job Skills Import.json
│   ├── 4.Job Offers Relevance.json
│   ├── 5.Job Offers Research Email.json
│   ├── 6.Job Application Writer.json
│   └── 7.Jobs Fit Chat.json
│
├── workflows/                   # Additional n8n workflows
│
├── tests/                       # Python tests
│   └── (pytest tests)
│
├── specs/                       # Feature specifications
│   ├── 001-form-qa-field-testing/
│   ├── 002-dynamic-field-detection/
│   ├── ... (various feature specs)
│
├── docs/                        # Documentation output
│
├── _bmad/                       # BMad workflow configs
│
├── scripts/                     # Utility scripts
│   └── ingest_profile.py        # Resume ingestion script
│
├── docker-compose.yml           # Docker services (Qdrant, API, n8n, Postgres, Redis)
├── Dockerfile                   # Backend container
├── .env.example                 # Environment template
├── requirements.txt            # Python dependencies
├── package.json                 # (empty/minimal)
├── README.md                    # Project docs
├── ruff.toml                    # Linter config
└── .gitignore
```

---

## Critical Folders Explained

### `src/` - Backend API
| Folder | Purpose | Key Files |
|--------|---------|------------|
| `api/` | HTTP endpoints | `routes.py`, `schemas.py` |
| `services/` | Business logic | 12 service modules |
| `utils/` | Helpers | `cache.py` |

**Entry Point:** `src/main.py` - FastAPI application with lifespan management

---

### `extension/` - Browser Extension
| Folder | Purpose | Key Files |
|--------|---------|------------|
| `content/` | Page injection | 5 content scripts |
| `popup/` | Popup UI | Job Links Manager |
| `background/` | BG script | Event handling |
| `services/` | Data layer | API, storage, SSE |

**Entry Point:** `manifest.json` defines all entry points

---

### `n8n-workflows/` - Automation
| File | Purpose |
|------|---------|
| Job Offers Extractor | Extract jobs from sources |
| Job Offers Research | Research job details |
| Job Skills Import | Import skills to vector DB |
| Job Offers Relevance | Score job relevance |
| Research Email | Generate research emails |
| Application Writer | Write cover letters |
| Jobs Fit Chat | Chat about job fit |

---

## Entry Points

| Component | Entry Point | How to Run |
|-----------|-------------|------------|
| Backend API | `src/main.py` | `uvicorn src.main:app --reload` |
| Extension | `extension/manifest.json` | Load in Firefox about:debugging |
| Docker | `docker-compose.yml` | `docker-compose up -d` |

---

## Integration Points

- **Extension → Backend**: HTTP REST (`/api/v1/search`, `/job-offers/*`)
- **Backend → Qdrant**: gRPC (vector search)
- **Backend → PostgreSQL**: asyncpg (job offers)
- **Backend → Redis**: aioredis (cache + SSE)
- **n8n → Backend**: HTTP (job management)

---

## Related Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Development Guide](./development-guide.md)