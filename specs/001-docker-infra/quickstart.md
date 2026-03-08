# Quickstart: Docker Infrastructure Setup

**Feature**: 001-docker-infra | **Date**: 2026-03-08

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+
- Available ports: 6333, 6334, 8000

---

## Quick Start

### 1. Initialize Environment

```bash
# Run the environment initialization script
./scripts/init-env.sh

# Edit .env and add your Z.ai API key
nano .env  # or your preferred editor
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 3. Verify Services

```bash
# Check service status
docker-compose ps

# Test Qdrant dashboard
open http://localhost:6333/dashboard

# Test API health
curl http://localhost:8000/health
```

---

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Qdrant Dashboard | http://localhost:6333/dashboard | Vector database management UI |
| Qdrant REST API | http://localhost:6333 | REST API endpoints |
| Qdrant gRPC | localhost:6334 | gRPC API |
| API Backend | http://localhost:8000 | FastAPI backend |
| API Health | http://localhost:8000/health | Health check endpoint |

---

## Common Commands

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d qdrant-db
docker-compose up -d api-backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs api-backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api-backend
```

### Health Checks

```bash
# Check container health status
docker-compose ps

# Manual health check
docker inspect --format='{{.State.Health.Status}}' qdrant-db
docker inspect --format='{{.State.Health.Status}}' api-backend
```

---

## Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:6333 failed: port is already allocated`

**Solution**:
```bash
# Find process using port
lsof -i :6333

# Kill process or change port in docker-compose.yml
```

### Permission Denied on Volume

**Error**: `permission denied` for `./qdrant_storage`

**Solution**:
```bash
# Create directory with correct permissions
mkdir -p ./qdrant_storage
chmod 755 ./qdrant_storage
```

### Container Unhealthy

**Check**:
```bash
# View health check logs
docker inspect qdrant-db | jq '.[0].State.Health'

# View container logs
docker-compose logs qdrant-db
```

### Missing ZAI_API_KEY

**Error**: API backend fails to start or returns auth errors

**Solution**:
```bash
# Ensure .env exists and has valid key
cat .env | grep ZAI_API_KEY

# Regenerate .env if needed
./scripts/init-env.sh
```

---

## Development Workflow

### Initial Setup (One-time)

```bash
# 1. Clone repository
git clone <repo-url>
cd job-forms

# 2. Initialize environment
./scripts/init-env.sh

# 3. Add your API key
echo 'ZAI_API_KEY=your_actual_key' >> .env

# 4. Start services
docker-compose up -d
```

### Daily Development

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs if needed
docker-compose logs -f api-backend

# Stop when done
docker-compose down
```

### After Code Changes

```bash
# Rebuild api-backend
docker-compose build api-backend

# Restart with new code
docker-compose up -d api-backend
```

---

## Data Persistence

### Vector Data Location

All vector embeddings are stored in:
```
./qdrant_storage/
```

### Backup Data

```bash
# Stop services first
docker-compose down

# Backup storage directory
tar -czf qdrant_backup_$(date +%Y%m%d).tar.gz ./qdrant_storage

# Restart services
docker-compose up -d
```

### Reset Data

```bash
# Stop services
docker-compose down

# Remove all vector data
rm -rf ./qdrant_storage

# Restart (fresh start)
docker-compose up -d
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────┐
│                    Host Machine                  │
│                                                  │
│  ┌─────────────┐         ┌─────────────────┐   │
│  │  Firefox    │ ──────▶ │  api-backend    │   │
│  │  Extension  │         │  localhost:8000 │   │
│  └─────────────┘         └────────┬────────┘   │
│                                   │             │
│                          ┌────────▼────────┐   │
│                          │   rag-network   │   │
│                          │    (bridge)     │   │
│                          └────────┬────────┘   │
│                                   │             │
│         ┌─────────────────────────┼─────────┐  │
│         │                         │         │  │
│         ▼                         ▼         │  │
│  ┌─────────────┐          ┌─────────────┐   │  │
│  │  Dashboard  │          │  qdrant-db  │   │  │
│  │  :6333      │ ◀─────── │  Internal   │   │  │
│  └─────────────┘          │  DNS only   │   │  │
│                           └─────────────┘   │  │
│                                              │  │
└─────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Verify infrastructure** is running with `docker-compose ps`
2. **Proceed to** feature `002-rag-backend` for API implementation
3. **Proceed to** feature `003-form-filler-extension` for browser extension
