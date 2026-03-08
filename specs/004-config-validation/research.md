# Research: Configuration Validation

**Feature**: 004-config-validation
**Date**: 2026-03-08

## Research Questions

### Q1: Async HTTP Health Checks

**Decision**: Use `httpx` with async client

**Rationale**: 
- httpx is already a common dependency in FastAPI projects
- Native async/await support matches FastAPI's async architecture
- Built-in timeout handling with `Timeout` object
- Clean exception hierarchy for error handling

**Alternatives Considered**:
- `aiohttp`: More verbose, separate session management required
- `requests`: Synchronous only, would block the event loop
- `urllib3`: Lower-level, more boilerplate

**Implementation Pattern**:
```python
async with httpx.AsyncClient(timeout=10.0) as client:
    response = await client.get("http://qdrant-db:6333/health")
```

---

### Q2: Test Embedding Generation for Dimension Validation

**Decision**: Generate a minimal embedding from a dummy text and check dimensions

**Rationale**:
- Most direct way to verify embedding configuration
- Uses the same code path as production (no mock bypass)
- Can use a single word like "test" for minimal token usage
- Read-only: does not store anything in vector database

**Alternatives Considered**:
- Check model config only: Doesn't verify actual output dimensions
- Use cached embedding: Requires pre-existing data, may not exist
- Mock the call: Doesn't validate real configuration

**Implementation Pattern**:
```python
embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
vector = await embeddings.aembed_query("test")
dimension_count = len(vector)
```

---

### Q3: URL Normalization for Path Duplication Detection

**Decision**: Strip trailing slashes from base_url, ensure paths start with `/`

**Rationale**:
- The `/v1/v1` issue occurs when base_url ends with `/v1` and code appends `/v1`
- Normalize by: 1) stripping trailing slashes, 2) ensuring paths have leading slash
- Detect duplication by checking for repeated path segments

**Alternatives Considered**:
- Regex validation: Overly complex for this simple case
- URL parsing with urllib: More robust but heavier
- String comparison only: Misses edge cases

**Implementation Pattern**:
```python
def check_url_duplication(base_url: str, path: str) -> tuple[bool, str]:
    normalized_base = base_url.rstrip("/")
    full_url = f"{normalized_base}/{path.lstrip('/')}"
    # Check for duplicated segments like /v1/v1
    parts = full_url.split("/")
    for i in range(len(parts) - 1):
        if parts[i] == parts[i+1] and parts[i]:
            return False, f"Duplicated path segment: /{parts[i]}/{parts[i+1]}"
    return True, full_url
```

---

### Q4: Timeout Handling for Multiple Validation Checks

**Decision**: Use `asyncio.wait_for` with per-check timeout, fail-fast on first timeout

**Rationale**:
- Requirement FR-009: "fail entire validation if any check times out"
- `asyncio.wait_for` provides clean timeout semantics
- Run checks sequentially to report first failure quickly
- 10-second per-check timeout as specified

**Alternatives Considered**:
- Run all checks concurrently with `asyncio.gather`: Faster but harder to report which check timed out
- Global timeout on entire endpoint: Less granular error reporting
- Retry on timeout: Not specified in requirements

**Implementation Pattern**:
```python
async def run_check(check_func, name: str, timeout: float = 10.0) -> CheckResult:
    try:
        return await asyncio.wait_for(check_func(), timeout=timeout)
    except asyncio.TimeoutError:
        return CheckResult(
            name=name,
            status="failed",
            message=f"Check timed out after {timeout} seconds"
        )
```

---

## Additional Decisions

### Check Execution Order

**Decision**: Run checks in priority order based on dependencies

**Order**:
1. Internal DNS (qdrant-db) - Other checks may depend on vector store
2. External Endpoint (localhost:8000) - Independent
3. URL Formatting - Independent, no network call
4. Embedding Dimensions - Depends on vector store connection

### Error Response Format

**Decision**: Return HTTP 200 with failed check details (not HTTP 5xx)

**Rationale**:
- The endpoint itself is working correctly
- Validation failures are expected outcomes, not server errors
- Client can parse JSON to see which checks failed
- Consistent with health check endpoint conventions

---

## Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| httpx | ^0.25.0 | Async HTTP client for connectivity checks |

Note: `langchain-openai` and `qdrant-client` already required by 002-rag-backend.

---

## Summary

All research questions resolved. Implementation will use:
- `httpx` for async HTTP health checks
- Direct embedding generation for dimension validation
- URL normalization with duplication detection
- Sequential check execution with `asyncio.wait_for` timeouts
- HTTP 200 responses with per-check status details
