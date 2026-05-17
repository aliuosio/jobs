# Testing Conventions

## Principles

- **TDD Required**: Write failing tests first, then implementation
- **Never delete failing tests to pass** — fix the underlying code
- Integration tests require Docker services (Qdrant, PostgreSQL)
- `conftest.py` per subdirectory with fixtures

## Run Commands

```bash
# Via Docker (recommended)
docker compose exec api-backend pytest tests/

# Local venv
.venv/bin/pytest tests/
```

## Stack

| Test Type | Tool |
|-----------|------|
| Unit | pytest |
| Integration | pytest + Docker services |
| End-to-end | Playwright |
| Load | locust + Playwright |