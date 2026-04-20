# src/services/

Core business logic services for RAG pipeline and form filling.

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

## CONVENTIONS
- Service classes with clear responsibilities
- Async/await patterns throughout
- Heavy use of Qdrant vector search
- HyDE (Hypothetical Document Embeddings) for retrieval

## GENERATOR RULES
- NEVER fabricate experience not in resume
- NEVER infer values not in context
- DO NOT add explanatory text for simple fields
