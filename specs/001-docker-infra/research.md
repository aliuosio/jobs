# Research: Docker Infrastructure Setup

**Feature**: 001-docker-infra | **Date**: 2026-03-08

## Summary

Research consolidated from librarian and explore agents to resolve all technical unknowns for Docker infrastructure configuration.

---

## 1. Docker Health Check Configuration

### Decision
Use **curl-based health check** for api-backend with `/health` endpoint.

### Rationale
- curl is widely available and provides clear HTTP status feedback with `-f` flag
- Most Debian/Ubuntu base images include curl by default
- Simpler than Python script approach for standard web services

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| wget | Alpine-specific, requires different syntax (`--spider`) |
| Python script | Overkill for simple HTTP health check |
| TCP check | Doesn't verify application is responding correctly |

### Configuration
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 30s
```

### FastAPI Health Endpoint
```python
from fastapi import FastAPI, Response

app = FastAPI()

@app.get("/health")
async def health() -> Response:
    """Health check endpoint."""
    return Response(status_code=200)
```

---

## 2. Qdrant Health Check Configuration

### Decision
Use **TCP check** for qdrant-db (official Qdrant recommendation).

### Rationale
- Qdrant's official docker-compose examples use TCP check
- No dependency on curl/wget in Qdrant image
- Simpler and faster than HTTP check

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| HTTP `/healthz` | Requires curl, more complex |
| wget spider | Qdrant image may not have wget |

### Configuration
```yaml
healthcheck:
  test: ["CMD-SHELL", "bash -c ':> /dev/tcp/127.0.0.1/6333' || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Available Qdrant Health Endpoints
- `/healthz` - Server has started
- `/livez` - Server is alive
- `/readyz` - Server is ready to be used
- `/metrics` - Prometheus metrics

---

## 3. Environment Variable Strategy

### Decision
Use **shell script with heredoc** for `.env` auto-generation.

### Rationale
- Simple and portable (no external dependencies)
- Provides sensible defaults
- Can generate secure random secrets
- Aligns with user clarification: "Auto-generate (script creates .env if missing)"

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| `.env.example` only | Requires manual copy, more error-prone |
| Python script | Overkill for simple env file generation |
| Docker env_file only | Doesn't help with initial setup |

### Script Pattern
```bash
#!/bin/bash
set -euo pipefail

ENV_FILE=".env"

if [[ -f "$ENV_FILE" ]]; then
    echo "✓ $ENV_FILE already exists"
    exit 0
fi

cat << EOF > "$ENV_FILE"
# Qdrant Configuration
QDRANT_URL=http://qdrant-db:6333

# Z.ai API Configuration
ZAI_API_KEY=your_api_key_here
ZAI_BASE_URL=https://api.z.ai/v1
EOF

chmod 600 "$ENV_FILE"
echo "✓ Generated $ENV_FILE - please update ZAI_API_KEY"
```

---

## 4. Required Environment Variables

### For api-backend
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QDRANT_URL` | Yes | `http://qdrant-db:6333` | Qdrant connection URL |
| `ZAI_API_KEY` | Yes | (none) | Z.ai API key for embeddings |
| `ZAI_BASE_URL` | No | `https://api.z.ai/v1` | Z.ai API base URL |

### For qdrant-db
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QDRANT__LOG_LEVEL` | No | `INFO` | Logging verbosity |

---

## 5. Docker Compose Configuration Details

### Volume Mount Paths
| Service | Container Path | Host Path |
|---------|---------------|-----------|
| qdrant-db | `/qdrant/storage` | `./qdrant_storage` |

### Network Configuration
- **Network name**: `rag-network`
- **Driver**: `bridge`
- **DNS**: Docker internal DNS resolves service names

### Port Mapping
| Service | Container Port | Host Port | Purpose |
|---------|---------------|-----------|---------|
| qdrant-db | 6333 | 6333 | HTTP REST API + Dashboard |
| qdrant-db | 6334 | 6334 | gRPC API |
| api-backend | 8000 | 8000 | FastAPI backend |

---

## 6. Project State Assessment

### Current State
- **Greenfield project** - no Python implementation exists yet
- Existing `docker-compose.yml` is incomplete (missing health checks, restart policy, logging config)
- No `.env` file or `.env.example` exists
- No `scripts/` directory exists

### Files to Create/Modify
| File | Action | Priority |
|------|--------|----------|
| `docker-compose.yml` | MODIFY | P1 |
| `scripts/init-env.sh` | CREATE | P1 |
| `.env.example` | CREATE | P2 |
| `.gitignore` | MODIFY (add .env) | P2 |

---

## 7. Constitution Compliance Notes

### Applicable Principles
- **IV. CORS Policy**: api-backend must expose port 8000 for Firefox extension → ✅ Covered by port mapping
- **Infrastructure Mapping**: qdrant-db at internal DNS, api-backend at localhost:8000 → ✅ Covered by network config

### No Violations
Infrastructure layer does not touch embedding, retrieval, or generation logic.

---

## References

- [Docker Compose Health Check Documentation](https://docs.docker.com/compose/compose-file/05-services/#healthcheck)
- [Qdrant Installation Guide](https://qdrant.tech/documentation/guides/installation/)
- [Qdrant Configuration](https://qdrant.tech/documentation/guides/configuration/)
- [Qdrant Monitoring](https://qdrant.tech/documentation/guides/monitoring/)
- [FastAPI Health Check Patterns](https://github.com/vllm-project/vllm)
