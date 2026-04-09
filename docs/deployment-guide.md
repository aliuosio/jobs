# Deployment Guide

**Project:** Jobs  
**Last Updated:** 2026-04-09

---

## Overview

The Jobs system can be deployed using Docker Compose for local development or containerized for production.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Docker | Latest stable |
| Docker Compose | V2+ |
| Mistral API Key | Required for embeddings + LLM |

---

## Docker Services

The `docker-compose.yml` defines:

| Service | Port | Description |
|---------|------|-------------|
| `api-backend` | 8000 | FastAPI backend |
| `qdrant` | 6333/6334 | Vector database (HTTP/gRPC) |
| `postgres` | 5432 | Job offers database |
| `redis` | 6379 | Cache + SSE |
| `n8n` | 5678 | Workflow automation |

---

## Local Deployment

### Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with MISTRAL_API_KEY

# 2. Start services
docker-compose up -d

# 3. Verify
curl http://localhost:8000/health
curl http://localhost:8000/validate
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-backend
```

### Stop Services

```bash
docker-compose down
```

---

## Production Deployment

### Build Custom Image

```bash
# Build backend image
docker build -t jobs-backend:latest .

# Tag for registry
docker tag jobs-backend:latest registry/jobs-backend:v1.0.0
```

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  api-backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
      - QDRANT_URL=http://qdrant:6333
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - qdrant
      - postgres
      - redis
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=jobs
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  qdrant_data:
  postgres_data:
  redis_data:
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MISTRAL_API_KEY` | Yes | Mistral API key |
| `QDRANT_URL` | No | Qdrant URL (default: http://qdrant:6333) |
| `DATABASE_URL` | No | PostgreSQL URL |
| `REDIS_URL` | No | Redis URL (default: redis://redis:6379) |
| `HYDE_ENABLED` | No | Enable HyDE (default: true) |
| `EMBEDDING_RERANK_ENABLED` | No | Enable reranking (default: false) |

---

## Extension Deployment

### Firefox

1. Package extension: `zip -r extension.zip extension/`
2. Submit to Firefox Add-ons (AMO)
3. Or distribute as unsigned (for development)

### Chrome (Future)

- Manifest v3 compatible
- Convert `manifest.json` for Chrome Web Store

---

## Health Checks

| Service | Check |
|---------|-------|
| Backend | `GET /health` → `{"status": "healthy"}` |
| Qdrant | `GET http://localhost:6333/collections` |
| PostgreSQL | `docker exec postgres pg_isready` |
| Redis | `docker exec redis redis-cli ping` |

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs <service>

# Check resource usage
docker stats
```

### Connection Refused

```bash
# Verify network
docker network ls
docker network inspect jobs_default
```

---

## Related Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Development Guide](./development-guide.md)