# src/

FastAPI backend with RAG pipeline and business logic.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API routes | `src/api/routes.py` | FastAPI endpoints |
| Schemas | `src/api/schemas.py` | Pydantic v2 models |
| Retriever | `src/services/retriever.py` | Vector search |
| Generator | `src/services/generator.py` | LLM response generation |
| Field classifier | `src/services/field_classifier.py` | Form field detection |
| Job offers | `src/services/job_offers.py` | PostgreSQL CRUD |
| Config | `src/config.py` | Settings |
| Cache | `src/utils/cache.py` | Query caching |

## ENTRY POINT

`src/main.py` - FastAPI app with lifespan context (Qdrant + PostgreSQL)

## CONVENTIONS

- `__init__.py` per package
- Pydantic v2 models (BaseModel, Field, Enum, Annotated)
- Ruff linter (line-length=100, target-version=py311)
- Use services, not direct imports in routes
- All route handlers: `async def`
- Global singleton services imported directly in routes

## ANTI-PATTERNS

- Do NOT use `as any` or type suppression
- Generator: NEVER fabricate experience, NEVER infer values not in context
- Do NOT add explanatory text for simple field types