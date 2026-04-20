# src/

FastAPI backend package with RAG pipeline and business logic.

## STRUCTURE
```
src/
├── api/         # Routes + Pydantic schemas
├── services/    # Core business services
└── utils/       # Shared utilities
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| API routes | `src/api/routes.py` | FastAPI endpoints |
| Schemas | `src/api/schemas.py` | Request/response models |
| Retriever | `src/services/retriever.py` | Vector search |
| Generator | `src/services/generator.py` | LLM answers |
| Field classifier | `src/services/field_classifier.py` | Field detection |
| Job offers | `src/services/job_offers.py` | PostgreSQL service |
| Config | `src/config.py` | Settings |
| Cache | `src/utils/cache.py` | Query caching |

## ENTRY POINT
`src/main.py` - FastAPI app with lifespan (Qdrant + PostgreSQL)

## CONVENTIONS
- `__init__.py` per package
- Pydantic v2 models
- Ruff linter (line-length=100, target-version=py311)
- Use services, not direct imports in routes
- FastAPI with lifespan context (Qdrant + PostgreSQL)

## ANTI-PATTERNS
- Do NOT use `as any` or type suppression
- Generator: NEVER fabricate experience, NEVER infer values not in context