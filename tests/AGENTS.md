# tests/

Python test suite with unit, integration, e2e, and load tests.

## STRUCTURE
```
tests/
├── unit/         # Unit tests
├── integration/  # Integration tests
├── e2e/         # End-to-end tests
└── load/        # Load tests
```

## WHERE TO LOOK
| Test Type | Location | Notes |
|----------|----------|-------|
| Unit | `tests/unit/` | Individual components |
| Integration | `tests/integration/` | Service interactions |
| E2E | `tests/e2e/` | Full workflows |
| Load | `tests/load/` | Performance |

## RUN
```bash
pytest tests/
```

## CONVENTIONS
- Do NOT delete failing tests to pass - fix the code
- Follow existing test patterns in each directory
- Docker-First: Run tests via `docker compose exec api-backend pytest`

## RUN
```bash
# Via Docker (recommended)
docker compose exec api-backend pytest tests/

# Or local venv
.venv/bin/pytest tests/
```