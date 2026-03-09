# job-forms Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-08

## Active Technologies
- Python 3.11+ (aligned with 002-rag-backend) + FastAPI, httpx (async HTTP client), qdrant-client, langchain-openai (embedding validation) (004-config-validation)
- Qdrant vector database (read-only checks for dimension validation) (004-config-validation)
- Firefox WebExtension APIs, no external npm packages needed for MVP (003-form-filler-extension)
- N/A (stateless extension, communicates with backend API) (003-form-filler-extension)

- (004-config-validation)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for 

## Code Style

: Follow standard conventions

## Recent Changes
- 003-form-filler-extension: Added Firefox WebExtension APIs, no external npm packages needed for MVP
- 004-config-validation: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
- 004-config-validation: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
