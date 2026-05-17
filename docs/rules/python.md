# Python Conventions

## Project Layout

- `src/` layout with `__init__.py` per package
- No `pyproject.toml` — uses `requirements.txt` in `.docker/api-backend/`
- Ruff linter: line-length=100, target-version=py311 (see `ruff.toml`)

## Models

- Pydantic v2 (`BaseModel`, `Field`, `Enum`, `Annotated`)

## Backend Operations

- **Docker-First**: Always use Docker for backend operations (tests, dev server)
- asyncpg for PostgreSQL
- AsyncOpenAI client for Mistral API
- HyDE (Hypothetical Document Embeddings) for retrieval improvement
- Global singleton service classes imported directly in routes
- All methods: `async def` / `await`

## Code Quality

- No unnecessary comments — only essential docstrings