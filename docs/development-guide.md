# Development Guide

**Project:** Jobs  
**Last Updated:** 2026-04-09

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Docker | Latest | Services (Qdrant, PostgreSQL, Redis, n8n) |
| Firefox | 109.0+ | Extension testing |
| Node.js | (optional) | Extension builds if needed |

---

## Environment Setup

### 1. Clone and Configure

```bash
# Clone repository
git clone <repo-url>
cd jobs

# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required: MISTRAL_API_KEY
```

### 2. Start Services

```bash
# Start all Docker services
docker-compose up -d

# Verify services
curl http://localhost:8000/health
```

---

## Running Locally

### Backend Only

```bash
# Activate virtual environment
source .venv/bin/activate

# Run with hot reload
uvicorn src.main:app --reload --port 8000

# Or use the Makefile
make run
```

### Full Stack (Recommended)

```bash
# Start all services via Docker
docker-compose up -d

# View logs
docker-compose logs -f api-backend
```

---

## Testing

### Run All Tests

```bash
pytest tests/ -v
```

### Specific Test Suites

```bash
# Unit tests
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# E2E tests
pytest tests/e2e/ -v
```

### Six-Field Form Tests

```bash
# Test field extraction for 6 core fields
pytest tests/unit/test_field_classifier_six_fields.py -v

# Test /api/v1/search endpoint
pytest tests/integration/test_fill_form.py -v
```

---

## Extension Development

### Loading Extension in Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select any file in `extension/` directory
4. Extension icon appears in toolbar

### Extension Debug Mode

The extension has a debug panel. Access via popup (toggle in popup UI).

---

## Code Style

### Python (Backend)

- Format: `ruff format`
- Lint: `ruff check`
- Config: `ruff.toml`

```bash
# Format and lint
ruff check --fix .
ruff format .
```

### JavaScript (Extension)

- Follow existing patterns in the codebase
- ES6+ syntax

---

## Building

### Backend Docker Image

```bash
docker build -t jobs-backend:latest .
```

### Run with Custom Image

```bash
docker-compose up -d api-backend
```

---

## Common Tasks

### Add a New API Endpoint

1. Add route in `src/api/routes.py`
2. Add schema in `src/api/schemas.py` if needed
3. Add service function in `src/services/` if needed

### Add a New Extension Feature

1. Add content script in `extension/content/`
2. Register in `manifest.json`
3. Test in Firefox

### Add a New n8n Workflow

1. Create workflow in n8n UI
2. Export JSON to `n8n-workflows/` or `workflows/`

---

## Database

### PostgreSQL Schema

Job offers table is auto-created on startup. To reset:

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d jobs

# Drop and recreate
DROP TABLE IF EXISTS job_offers_process;
DROP TABLE IF EXISTS job_offers;
```

---

## Troubleshooting

### Backend won't start

```bash
# Check Qdrant
docker ps | grep qdrant

# Check logs
docker-compose logs api-backend

# Validate config
curl http://localhost:8000/validate
```

### Extension can't connect

```bash
# Verify backend
curl http://localhost:8000/health

# Check CORS in src/main.py
# Ensure port 8000 accessible
```

---

## Related Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Testing Guide](./testing-guide.md)