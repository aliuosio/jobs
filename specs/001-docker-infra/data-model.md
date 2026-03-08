# Data Model: Docker Infrastructure Setup

**Feature**: 001-docker-infra | **Date**: 2026-03-08

## Overview

This feature defines infrastructure configuration rather than application data models. The "data model" consists of Docker service definitions, network configuration, and environment variable schemas.

---

## Service Definitions

### qdrant-db (Vector Database)

| Property | Value | Notes |
|----------|-------|-------|
| Image | `qdrant/qdrant:latest` | Official Qdrant image |
| Container Name | `qdrant-db` | DNS hostname for internal resolution |
| Ports | `6333:6333`, `6334:6334` | HTTP dashboard + gRPC |
| Volume | `./qdrant_storage:/qdrant/storage` | Persistent storage |
| Network | `rag-network` | Bridge network |
| Restart Policy | `no` | Manual restart only |
| Logging | `none` | Disabled per spec |
| Health Check | TCP port 6333 | Built-in bash check |

### api-backend (FastAPI Application)

| Property | Value | Notes |
|----------|-------|-------|
| Build Context | `.` | Local Dockerfile |
| Container Name | `api-backend` | DNS hostname |
| Ports | `8000:8000` | HTTP API |
| Network | `rag-network` | Bridge network |
| Restart Policy | `no` | Manual restart only |
| Logging | `none` | Disabled per spec |
| Health Check | HTTP `/health` | curl-based |
| Depends On | `qdrant-db` | With health condition |

---

## Network Configuration

### rag-network

| Property | Value |
|----------|-------|
| Driver | `bridge` |
| Scope | Local |
| DNS | Docker internal DNS enabled |

### DNS Resolution Rules

| From Service | To Service | Resolves To |
|--------------|------------|-------------|
| api-backend | qdrant-db | Container IP via Docker DNS |
| Host | qdrant-db | `localhost:6333`, `localhost:6334` |
| Host | api-backend | `localhost:8000` |

---

## Environment Variable Schema

### api-backend Environment

```yaml
environment:
  QDRANT_URL: ${QDRANT_URL:-http://qdrant-db:6333}
  ZAI_API_KEY: ${ZAI_API_KEY}
  ZAI_BASE_URL: ${ZAI_BASE_URL:-https://api.z.ai/v1}
```

| Variable | Type | Required | Default | Validation |
|----------|------|----------|---------|------------|
| `QDRANT_URL` | string | No | `http://qdrant-db:6333` | Valid URL |
| `ZAI_API_KEY` | string | Yes | (none) | Non-empty |
| `ZAI_BASE_URL` | string | No | `https://api.z.ai/v1` | Valid URL |

### qdrant-db Environment

```yaml
environment:
  QDRANT__LOG_LEVEL: INFO
```

| Variable | Type | Required | Default | Validation |
|----------|------|----------|---------|------------|
| `QDRANT__LOG_LEVEL` | enum | No | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |

---

## Volume Configuration

### qdrant_storage

| Property | Value |
|----------|-------|
| Type | Bind mount |
| Host Path | `./qdrant_storage` |
| Container Path | `/qdrant/storage` |
| Permissions | Read/Write (host user must have write access) |
| Auto-create | Yes (Docker creates if missing) |

---

## Health Check Definitions

### qdrant-db Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "bash -c ':> /dev/tcp/127.0.0.1/6333' || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### api-backend Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 30s
```

---

## Dependency Graph

```
┌─────────────┐
│  Host       │
│ (localhost) │
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐        ┌─────────────┐
│ api-backend │───────▶│  qdrant-db  │
│  :8000      │        │  :6333/6334 │
└─────────────┘        └─────────────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
          ┌─────────────┐
          │ rag-network │
          │  (bridge)   │
          └─────────────┘
```

---

## State Transitions

### Service Startup Sequence

```
1. Docker creates rag-network
2. Docker creates qdrant_storage directory (if missing)
3. qdrant-db container starts
4. qdrant-db health check begins (30s start period)
5. qdrant-db becomes healthy
6. api-backend container starts (waits for qdrant-db healthy)
7. api-backend health check begins (30s start period)
8. api-backend becomes healthy
9. System ready
```

### Failure States

| Condition | Behavior |
|-----------|----------|
| qdrant-db fails health check | api-backend waits indefinitely |
| api-backend fails health check | Marked unhealthy, no auto-restart |
| Port conflict | Docker reports error, container fails to start |
| Volume permission denied | Container fails to start |

---

## Configuration Files Summary

| File | Purpose | Created By |
|------|---------|------------|
| `docker-compose.yml` | Service definitions | This feature |
| `.env` | Environment variables | `scripts/init-env.sh` |
| `.env.example` | Template documentation | This feature |
| `.gitignore` | Exclude .env from VCS | This feature |
