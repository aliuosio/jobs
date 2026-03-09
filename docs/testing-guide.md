# Testing Guide

This document describes how to run tests for the Job Forms Helper project.

## Current Test Status

**Note**: The test directory structure is set up, but actual test implementations are minimal. The project currently relies on:

1. **Manual testing** via API endpoints (`/health`, `/validate`, `/fill-form`)
2. **Integration testing** through the Docker stack
3. **Validation endpoint** for configuration verification

## Test Structure

```
tests/
├── __init__.py          # Test package marker
├── conftest.py          # Pytest fixtures
├── unit/
│   └── __init__.py      # Unit tests (scaffolding only)
└── integration/
    └── __init__.py      # Integration tests (scaffolding only)
```

## Running Tests

### Prerequisites

```bash
# Install test dependencies
pip install -r requirements.txt
```

The following test dependencies are included in `requirements.txt`:
- `pytest>=7.4.0` - Test framework
- `pytest-asyncio>=0.23.0` - Async test support

### Run All Tests

```bash
# Run all tests
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run with coverage (requires pytest-cov)
pytest tests/ --cov=src --cov-report=term-missing
```

### Run Specific Test Types

```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v
```

### Run Specific Test File

```bash
pytest tests/unit/test_validation.py -v
```

## Available Fixtures

The `conftest.py` provides:

```python
@pytest.fixture
async def client():
    """Async test client for API testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app), 
        base_url="http://test"
    ) as ac:
        yield ac
```

## Manual API Testing

Since unit tests are minimal, use these manual tests:

### Health Check

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### Configuration Validation

```bash
curl http://localhost:8000/validate | jq
# Expected: ValidationReport with 4 checks
```

### Form Fill

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "What is your name?"}' | jq
# Expected: AnswerResponse with answer and confidence
```

## Writing New Tests

### Unit Test Example

Create `tests/unit/test_validation.py`:

```python
import pytest
from src.services.validation import run_check, aggregate_results
from src.api.schemas import CheckName, CheckStatus

@pytest.mark.asyncio
async def test_run_check_timeout():
    """Test that check times out after 10 seconds."""
    async def slow_check():
        import asyncio
        await asyncio.sleep(15)
        return None
    
    result = await run_check(slow_check, CheckName.INTERNAL_DNS, timeout=1.0)
    assert result.status == CheckStatus.TIMEOUT
    assert "timed out" in result.message.lower()

@pytest.mark.asyncio
async def test_aggregate_results_all_passed():
    """Test aggregation when all checks pass."""
    from src.api.schemas import CheckResult
    
    checks = [
        CheckResult(
            name=CheckName.INTERNAL_DNS,
            status=CheckStatus.PASSED,
            message="OK",
            duration_ms=100
        )
    ]
    
    report = aggregate_results(checks, 100)
    assert report.status.value == "healthy"
```

### Integration Test Example

Create `tests/integration/test_api.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_validate_endpoint(client):
    """Test validation endpoint."""
    response = await client.get("/validate")
    assert response.status_code == 200
    data = response.json()
    assert "checks" in data
    assert len(data["checks"]) == 4

@pytest.mark.asyncio
async def test_fill_form_endpoint(client):
    """Test form fill endpoint."""
    response = await client.post(
        "/fill-form",
        json={"label": "Test field"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "confidence" in data
```

## Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/` | Test individual functions in isolation |
| Integration | `tests/integration/` | Test API endpoints and service interactions |
| E2E | Manual | Test full stack with Docker |

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest tests/ -v --tb=short
```

## Recommended Test Coverage

When implementing tests, prioritize:

1. **Validation service** - Test each check function independently
2. **API routes** - Test endpoint responses and error handling
3. **Configuration** - Test environment variable loading
4. **Error scenarios** - Test timeout handling, connection failures

## Related Documentation

- [Technical Overview](../docs/technical-overview.md)
- [Usage Plan for 004-config-validation](../specs/004-config-validation/usage-plan.md)
