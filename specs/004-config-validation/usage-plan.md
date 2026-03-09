# Usage Plan: Configuration Validation (004-config-validation)

This document provides a comprehensive testing and usage plan for the Configuration Validation feature.

## Overview

The `/validate` endpoint runs four configuration checks to verify system health:

1. **internal_dns** - Backend can reach Qdrant via Docker DNS
2. **external_endpoint** - localhost:8000 is accessible
3. **url_format** - API base URL is correctly formatted
4. **embedding_dimensions** - Embeddings are 1536-dimensional

## Prerequisites

Before testing, ensure:

- [ ] Docker and Docker Compose are installed
- [ ] `.env` file exists with `ZAI_API_KEY` set
- [ ] No other services using ports 6333, 6334, or 8000

## Test Scenarios

### Scenario 1: Full Stack Validation (All Services Running)

**Purpose**: Verify all checks pass when system is properly configured.

**Steps**:

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for health checks (30 seconds)
sleep 30

# 3. Run validation
curl http://localhost:8000/validate | jq
```

**Expected Result**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-09T12:00:00.000Z",
  "total_duration_ms": 561,
  "checks": [
    {
      "name": "internal_dns",
      "status": "passed",
      "message": "Successfully connected to qdrant-db:6333",
      "duration_ms": 50,
      "details": null
    },
    {
      "name": "external_endpoint",
      "status": "passed",
      "message": "localhost:8000/health is reachable",
      "duration_ms": 5,
      "details": null
    },
    {
      "name": "url_format",
      "status": "passed",
      "message": "Base URL format is correct",
      "duration_ms": 1,
      "details": {"normalized_url": "https://api.z.ai/v1"}
    },
    {
      "name": "embedding_dimensions",
      "status": "passed",
      "message": "Embeddings are 1536-dimensional",
      "duration_ms": 505,
      "details": {"expected": 1536, "actual": 1536}
    }
  ]
}
```

---

### Scenario 2: Qdrant Unavailable (Internal DNS Failure)

**Purpose**: Verify internal_dns check fails when Qdrant is not running.

**Steps**:

```bash
# 1. Stop Qdrant only
docker-compose stop qdrant-db

# 2. Run validation
curl http://localhost:8000/validate | jq
```

**Expected Result**:
```json
{
  "status": "unhealthy",
  "checks": [
    {
      "name": "internal_dns",
      "status": "failed",
      "message": "Failed to connect to qdrant-db:6333: connection_refused",
      "details": {
        "hostname": "qdrant-db",
        "port": 6333,
        "error_type": "connection_refused"
      }
    },
    {
      "name": "embedding_dimensions",
      "status": "failed",
      "message": "Cannot verify embeddings: vector store unavailable",
      "details": {
        "skipped": true,
        "reason": "internal_dns check failed"
      }
    }
  ]
}
```

**Note**: `embedding_dimensions` is skipped because `internal_dns` failed.

---

### Scenario 3: URL Format Error (Trailing /v1)

**Purpose**: Verify url_format check detects path duplication.

**Steps**:

```bash
# 1. Update .env with problematic URL
echo 'ZAI_BASE_URL=https://api.z.ai/v1/v1' >> .env

# 2. Restart backend to pick up new env
docker-compose restart api-backend

# 3. Wait for startup
sleep 10

# 4. Run validation
curl http://localhost:8000/validate | jq '.checks[] | select(.name == "url_format")'
```

**Expected Result**:
```json
{
  "name": "url_format",
  "status": "failed",
  "message": "URL format issue: Duplicated path segment: /v1/v1",
  "duration_ms": 1,
  "details": {
    "base_url": "https://api.z.ai/v1/v1",
    "normalized_url": "https://api.z.ai/v1/v1",
    "issue": "Duplicated path segment: /v1/v1",
    "recommendation": "Remove the duplicated /v1 from the URL"
  }
}
```

**Fix**:
```bash
# Correct the URL
sed -i 's|ZAI_BASE_URL=.*|ZAI_BASE_URL=https://api.z.ai/v1|' .env
docker-compose restart api-backend
```

---

### Scenario 4: Invalid API Key (Embedding Failure)

**Purpose**: Verify embedding_dimensions check fails with invalid credentials.

**Steps**:

```bash
# 1. Set invalid API key
echo 'ZAI_API_KEY=invalid_key_12345' > .env.tmp
cat .env.example >> .env.tmp
mv .env.tmp .env

# 2. Restart backend
docker-compose restart api-backend
sleep 10

# 3. Run validation
curl http://localhost:8000/validate | jq '.checks[] | select(.name == "embedding_dimensions")'
```

**Expected Result**:
```json
{
  "name": "embedding_dimensions",
  "status": "failed",
  "message": "Failed to generate test embedding: ...",
  "details": {
    "error_type": "AuthenticationError",
    "error_message": "..."
  }
}
```

---

### Scenario 5: Timeout Handling

**Purpose**: Verify checks timeout after 10 seconds.

**Note**: This is difficult to test without introducing artificial delays. The timeout is implemented with `asyncio.wait_for()` in `validation.py`.

**Manual Test** (requires network manipulation):
```bash
# Block Qdrant port temporarily
sudo iptables -A INPUT -p tcp --dport 6333 -j DROP

# Run validation (should timeout after 10s)
curl http://localhost:8000/validate | jq '.checks[] | select(.name == "internal_dns")'

# Restore access
sudo iptables -D INPUT -p tcp --dport 6333 -j DROP
```

**Expected Result**:
```json
{
  "name": "internal_dns",
  "status": "timeout",
  "message": "Check timed out after 10.0 seconds",
  "details": {"timeout_seconds": 10.0}
}
```

---

## AI Testing Instructions

When an AI agent tests this feature, follow this sequence:

### Automated Test Script

```bash
#!/bin/bash
# test-validation.sh

set -e

echo "=== Configuration Validation Test Suite ==="

# Test 1: Health check
echo -e "\n[1/4] Testing /health endpoint..."
HEALTH=$(curl -s http://localhost:8000/health)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed: $HEALTH"
    exit 1
fi

# Test 2: Validation endpoint exists
echo -e "\n[2/4] Testing /validate endpoint exists..."
VALIDATE=$(curl -s http://localhost:8000/validate)
if echo "$VALIDATE" | grep -q '"checks"'; then
    echo "✓ Validation endpoint accessible"
else
    echo "✗ Validation endpoint failed: $VALIDATE"
    exit 1
fi

# Test 3: All checks present
echo -e "\n[3/4] Verifying all checks present..."
for check in internal_dns external_endpoint url_format embedding_dimensions; do
    if echo "$VALIDATE" | grep -q "\"name\": \"$check\""; then
        echo "  ✓ $check present"
    else
        echo "  ✗ $check missing"
        exit 1
    fi
done

# Test 4: Response structure
echo -e "\n[4/4] Verifying response structure..."
if echo "$VALIDATE" | jq -e '.status, .timestamp, .total_duration_ms, .checks' > /dev/null 2>&1; then
    echo "✓ Response structure valid"
else
    echo "✗ Invalid response structure"
    exit 1
fi

echo -e "\n=== All tests passed ==="
```

### Python Test Script

```python
# test_validation.py
import httpx
import asyncio

async def test_validation():
    async with httpx.AsyncClient() as client:
        # Test health
        response = await client.get("http://localhost:8000/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        print("✓ Health check passed")
        
        # Test validation
        response = await client.get("http://localhost:8000/validate")
        assert response.status_code == 200
        report = response.json()
        
        assert "status" in report
        assert "checks" in report
        assert len(report["checks"]) == 4
        
        check_names = {c["name"] for c in report["checks"]}
        expected = {"internal_dns", "external_endpoint", "url_format", "embedding_dimensions"}
        assert check_names == expected
        print("✓ Validation check passed")
        
        # Print results
        for check in report["checks"]:
            status = "✓" if check["status"] == "passed" else "✗"
            print(f"  {status} {check['name']}: {check['status']}")
        
        return report["status"] == "healthy"

if __name__ == "__main__":
    result = asyncio.run(test_validation())
    exit(0 if result else 1)
```

---

## Integration with CI/CD

Add to CI pipeline:

```yaml
# .github/workflows/validate.yml
- name: Start services
  run: docker-compose up -d

- name: Wait for services
  run: sleep 30

- name: Run validation
  run: |
    STATUS=$(curl -s http://localhost:8000/validate | jq -r '.status')
    if [ "$STATUS" != "healthy" ]; then
      echo "Validation failed"
      curl -s http://localhost:8000/validate | jq '.checks[] | select(.status != "passed")'
      exit 1
    fi
```

---

## Troubleshooting Checklist

When validation fails, check each component:

| Check | Issue | Diagnostic Command | Fix |
|-------|-------|-------------------|-----|
| internal_dns | Qdrant not running | `docker ps \| grep qdrant` | `docker-compose up -d qdrant-db` |
| internal_dns | Wrong network | `docker network ls` | Check docker-compose.yml network |
| external_endpoint | Port blocked | `curl localhost:8000/health` | Check port 8000 availability |
| url_format | Trailing /v1 | `grep ZAI_BASE_URL .env` | Remove trailing /v1 |
| embedding_dimensions | Invalid API key | Check .env | Update ZAI_API_KEY |

---

## Related Documentation

- [Feature Specification](./spec.md) - Full feature requirements
- [Quickstart Guide](./quickstart.md) - Quick setup instructions
- [Tasks](./tasks.md) - Implementation tasks and checkpoints
