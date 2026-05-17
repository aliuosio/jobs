# API Design Conventions

## Routing

- All route handlers: `async def`
- Use services, not direct imports in routes
- Global singleton services imported directly in routes (`job_offers_service`, `generator`, `retriever`, `reranker`, `hyde`, `embedder`, `query_cache`)

## Anti-Patterns

- Never fabricate experience not in resume (GeneratorService)
- Never infer values not in context
- Never add explanatory text for simple field types