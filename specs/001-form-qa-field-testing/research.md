# Research: Form QA Field Testing

**Date**: 2026-03-19
**Feature**: 001-form-qa-field-testing

## Overview

This document consolidates research findings for implementing reliable form field testing for six core fields: firstname, lastname, email, city, postcode, and street.

## Technology Decisions

### Qdrant + FastAPI Integration

**Decision**: Use AsyncQdrantClient with FastAPI lifespan management
**Rationale**: 
- AsyncQdrantClient prevents blocking the event loop in async frameworks
- Singleton pattern via lifespan avoids expensive gRPC channel creation per request
- Dependency injection via FastAPI's Depends system enables testability
**Alternatives Considered**:
- Sync QdrantClient: Would block event loop, poor performance
- Per-request client creation: Expensive gRPC channel setup, resource exhaustion

### Data Model Structure

**Decision**: Flat top-level fields for all six core fields
**Rationale**:
- Simpler payload structure, easier to work with
- Consistent with existing field naming patterns
- Reduces complexity in field extraction logic
- Better testability and maintainability
**Alternatives Considered**:
- Nested profile object (profile.firstname, profile.adr.city): More complex, harder to maintain
- Mixed structure: Inconsistent, confusing for developers

### Validation Strategy

**Decision**: Pydantic validation with specific format rules
**Rationale**:
- Email: Standard format with @ symbol validation
- Postcode: Alphanumeric with spaces/hyphens to support international formats
- All six fields required to ensure data completeness
**Alternatives Considered**:
- No validation: Poor data quality, user confusion
- Overly strict validation (e.g., regex for every country's postcode): Too complex, maintenance burden

### Test Strategy

**Decision**: Three-tier testing approach (unit, integration, e2e)
**Rationale**:
- Unit tests: Field classifier logic with various signal combinations
- Integration tests: Mock Qdrant for deterministic, fast tests
- E2e tests: Real Qdrant instance for actual behavior validation
**Alternatives Considered**:
- Only unit tests: Misses integration issues
- Only e2e tests: Slow, non-deterministic

## Best Practices Identified

### AsyncQdrantClient Usage
- Use `AsyncQdrantClient` in async frameworks like FastAPI
- Create client once during app startup via lifespan events
- Store client in `app.state` for dependency injection
- Close client on shutdown to prevent resource leaks
- Never create client per request

### Field Extraction Patterns
- Use semantic field type detection from signals (autocomplete, html_type, input_name, label_text)
- Map field types to payload keys explicitly
- Handle missing fields gracefully with fallback messages
- Log extraction attempts for debugging

### Test Data Management
- Use deterministic seed data for reproducible tests
- Implement idempotent seeding (can run multiple times safely)
- Separate test fixtures from production data
- Clean up test data between test runs

## Integration Patterns

### FastAPI + Qdrant
- Lifespan context manager for connection management
- Dependency injection via `Depends(get_qdrant_client)`
- Health check endpoint for monitoring
- Retry logic for transient failures

### Error Handling
- Structured error responses with clear messages
- Graceful degradation when Qdrant unavailable
- Logging for debugging and monitoring
- User-friendly fallback messages

## References

- [Qdrant Python Client Docs](https://python-client.qdrant.tech/)
- [Qdrant Async API Guide](https://qdrant.tech/documentation/tutorials-develop/async-api/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pydantic Validation](https://docs.pydantic.dev/latest/)
