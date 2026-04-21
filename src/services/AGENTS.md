# src/services/

Core business logic for RAG pipeline and form filling.

## WHERE TO LOOK

| Service | File | Role |
|---------|------|------|
| Retriever | `retriever.py` | Vector search + HyDE + reranking |
| Generator | `generator.py` | LLM response generation |
| Embedder | `embedder.py` | Mistral embeddings |
| Field Classifier | `field_classifier.py` | Form field detection |
| Fill Form | `fill_form.py` | Auto-fill logic |
| Job Offers | `job_offers.py` | PostgreSQL CRUD |
| Validation | `validation.py` | Input validation |
| Reranker | `reranker.py` | Result reranking (BM25, dense, sparse) |
| HyDE | `hyde.py` | Hypothetical Document Embeddings |
| Broadcast | `broadcast.py` | SSE broadcasting |
| CSV Export | `csv_export.py` | Job data export |

## CONVENTIONS

- Service classes as global singletons
- All methods: `async def` / `await`
- asyncpg for PostgreSQL
- AsyncOpenAI client for Mistral API
- HyDE (Hypothetical Document Embeddings) for retrieval improvement

## ANTI-PATTERNS

- NEVER fabricate experience not in resume
- NEVER infer values not in context
- Do NOT add explanatory text for simple fields