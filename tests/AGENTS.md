# tests/

Python test suite: unit, integration, e2e, and load tests.

## STRUCTURE

```
tests/
├── unit/         # Unit tests (pytest)
├── integration/  # Integration tests (pytest + Docker services)
├── e2e/         # End-to-end tests (Playwright)
└── load/        # Load tests (playwright + locust)
```

## WHERE TO LOOK

| Test Type | Location | Notes |
|----------|----------|-------|
| Unit | `tests/unit/` | Individual components, fixtures |
| Integration | `tests/integration/` | Docker services (Qdrant, PostgreSQL) |
| E2E | `tests/e2e/` | Playwright browser tests |
| Load | `tests/load/` | locust + Playwright |

## RUN

```bash
# Via Docker (recommended)
docker compose exec api-backend pytest tests/

# Local venv
.venv/bin/pytest tests/
```

## CONVENTIONS

- Do NOT delete failing tests to pass - fix the code
- Integration tests require Docker services
- conftest.py per subdirectory
- fixtures in conftest.py
- Playwright for e2e/load tests