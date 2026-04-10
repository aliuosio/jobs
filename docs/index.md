# Project Documentation Index

**Project:** Jobs  
**Version:** 0.5.3  
**Generated:** 2026-04-09  
**Documentation Type:** Brownfield Project Documentation

---

## Project Overview

- **Type:** Multi-part project with 3 components
- **Primary Language:** Python (backend), JavaScript (extension)
- **Architecture:** Service-oriented with RAG pipeline

---

## Quick Reference

### Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11+, FastAPI |
| Vector DB | Qdrant |
| LLM/Embeddings | Mistral API |
| Database | PostgreSQL |
| Cache | Redis |
| Extension | Firefox Manifest v3 |
| Automation | n8n |

### Entry Points

- **Backend:** `src/main.py` → `uvicorn src.main:app --reload --port 8000`
- **Extension:** `extension/manifest.json` → Load in Firefox `about:debugging`
- **Services:** `docker-compose up -d`

---

## Generated Documentation

### Core Documentation
- [Project Overview](./project-overview.md) - Executive summary and tech stack
- [Architecture](./architecture.md) - Technical architecture details
- [Source Tree Analysis](./source-tree-analysis.md) - Directory structure

### Development
- [Development Guide](./development-guide.md) - Setup, testing, common tasks

### API & Integration
- [API Contracts](./api-contracts.md) - REST API endpoint reference

### Components
- [Component Inventory](./component-inventory.md) - Extension component breakdown

### Operations
- [Deployment Guide](./deployment-guide.md) - Docker deployment

### Existing Documentation
- [README.md](../README.md) - Original project documentation
- [Technical Overview](./technical-overview.md) - Technical architecture docs
- [Testing Guide](./testing-guide.md) - Testing documentation
- [n8n RAG Integration](./n8n-rag-search-integration.md) - n8n integration docs
- [BMad Shortcuts](./bmad-shortcuts.md) - BMad workflow reference

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Mistral API key
- Firefox 109.0+ (for extension)

### Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add MISTRAL_API_KEY

# 2. Start services
docker-compose up -d

# 3. Verify backend
curl http://localhost:8000/health

# 4. Install extension
# Open Firefox → about:debugging#/runtime/this-firefox
# Load Temporary Add-on → select extension/ directory
```

---

## Project Structure

```
jobs/
├── src/              # Python FastAPI backend
├── extension/       # Firefox extension (Manifest v3)
├── n8n-workflows/   # n8n automation
├── workflows/       # Additional n8n workflows
├── tests/           # Python tests
├── specs/           # Feature specifications
├── docs/            # ← You are here (documentation output)
├── docker-compose.yml
└── README.md
```

---

## Related Tools

- **BMad Workflows:** Use `/bmad-*` commands for feature development
- **n8n:** Workflow automation at `http://localhost:5678`
- **Qdrant Dashboard:** Vector database at `http://localhost:6333`

---

*Documentation generated via BMad Document Project workflow (Deep Scan)*