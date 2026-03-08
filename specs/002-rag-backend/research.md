# Research: RAG Backend API

**Feature**: 002-rag-backend | **Date**: 2026-03-08

## Summary

Research consolidated from librarian and explore agents to resolve all technical unknowns for the RAG Backend API implementation.

---

## 1. LangChain + FastAPI Integration

### Decision
Use **dependency injection pattern** with FastAPI for LangChain components.

### Rationale
- Clean separation of concerns
- Easy testing with mock dependencies
- Singleton pattern for vector store connections
- Native async support for streaming responses

### Configuration
```python
from fastapi import Depends
from langchain_openai import ChatOpenAI
from langchain_qdrant import QdrantVectorStore

def get_llm():
    return ChatOpenAI(
        model="gpt-4-turbo-preview",
        temperature=0.1,  # Low for RAG
        streaming=True
    )

def get_vector_store():
    return QdrantVectorStore.from_existing_collection(
        embeddings=embeddings,
        collection_name="resume_embeddings",
        url="http://qdrant-db:6333"
    )
```

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Global variables | Harder testing, no lifecycle management |
| Factory pattern per request | Connection overhead, no pooling |

---

## 2. Qdrant Vector Store Integration

### Decision
Use **langchain-qdrant** package with official Qdrant Python client.

### Rationale
- Native LangChain integration
- Hybrid search support (dense + sparse)
- gRPC support for better performance
- Already clarified: use `qdrant-client` library

### Configuration
```python
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

client = QdrantClient(
    url="http://qdrant-db:6333",
    grpc_port=6334,
    prefer_grpc=True,
    timeout=30
)

vector_store = QdrantVectorStore(
    client=client,
    collection_name="resume_embeddings",
    embedding=embeddings
)

retriever = vector_store.as_retriever(
    search_kwargs={"k": 5}  # Constitution requirement
)
```

---

## 3. OpenAI-Compatible Client Configuration

### Decision
Use **ChatOpenAI** with custom `base_url` for Z.ai API.

### Rationale
- Supports any OpenAI-compatible endpoint
- Avoids path doubling issues (Constitution Risk Mitigation)
- Native streaming support

### Configuration
```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url=os.getenv("ZAI_BASE_URL", "https://api.z.ai/v1"),
    api_key=os.getenv("ZAI_API_KEY"),
    model="z-ai-model",
    temperature=0.1,
    streaming=True
)
```

### Path Validation (Constitution Risk Mitigation)
- Set `base_url` explicitly to `https://api.z.ai/v1`
- Do NOT append `/v1` again in calls - LangChain handles this

---

## 4. Anti-Hallucination System Prompts

### Decision
Use **strict grounding prompts** with explicit rules and verification.

### Rationale
- Constitution Principle III requires zero hallucination
- Explicit rules reduce fabrication risk
- Citation requirements add accountability

### System Prompt Template
```python
RAG_SYSTEM_PROMPT = """You are a precise assistant answering questions based on resume data.

CRITICAL RULES:
1. ONLY use information from the provided context
2. If context doesn't contain the answer, say: "This information is not available in the resume."
3. NEVER fabricate experience, skills, or qualifications
4. Cite context using [Source] notation
5. Acknowledge uncertainties explicitly

Context: {context}

Remember: Accuracy over completeness. Say "not available" rather than guessing."""
```

---

## 5. CORS Configuration for Firefox Extensions

### Decision
Use **regex pattern** with explicit extension ID validation.

### Rationale
- `moz-extension://*` wildcard doesn't work (only matches scheme)
- Need full origin with extension ID
- Production requires whitelisting specific IDs

### Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^moz-extension://[a-f0-9\-]+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=86400
)
```

### Security Note
For production, add middleware to validate specific extension IDs against whitelist.

---

## 6. Exponential Backoff Configuration

### Decision
Use **tenacity** library with exponential backoff for retries.

### Rationale
- Already clarified: exponential backoff (1s, 2s, 4s, 8s...)
- Standard pattern for API rate limiting
- Tenacity integrates well with async

### Configuration
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=32)
)
async def call_with_retry(func, *args):
    return await func(*args)
```

---

## 7. API Endpoints Structure

### Decision
Two endpoints: `/fill-form` (POST) and `/health` (GET).

### Rationale
- Already clarified in spec clarifications
- Simple, focused API surface
- Health endpoint for Docker health checks

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/fill-form` | POST | Generate answer from form label |
| `/health` | GET | Health check with DB connectivity |

---

## 8. Project Dependencies

### Core Dependencies
```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-qdrant>=0.1.0
qdrant-client>=1.7.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
tenacity>=8.2.0
```

### Development Dependencies
```
pytest>=7.0.0
pytest-asyncio>=0.21.0
httpx>=0.24.0
```

---

## 9. Codebase State Assessment

### Current State
- **Greenfield project** - no Python implementation exists
- Existing `docker-compose.yml` defines infrastructure
- Environment variable contract defined in 001-docker-infra

### Files to Create
| File | Purpose |
|------|---------|
| `backend/requirements.txt` | Python dependencies |
| `backend/src/main.py` | FastAPI app entry |
| `backend/src/config.py` | Settings/configuration |
| `backend/src/api/routes.py` | API endpoints |
| `backend/src/api/schemas.py` | Pydantic models |
| `backend/src/services/rag.py` | RAG pipeline |
| `backend/src/services/vector_store.py` | Qdrant connection |
| `backend/src/prompts/system.py` | System prompts |
| `backend/tests/` | Test suite |

---

## 10. Constitution Compliance Summary

| Principle | Implementation |
|-----------|----------------|
| I. Data Integrity | OpenAIEmbeddings with 1536 dimensions |
| II. Retrieval Law | `as_retriever(search_kwargs={"k": 5})` |
| III. Zero Hallucination | Strict system prompt with grounding rules |
| IV. CORS Policy | `moz-extension://` whitelisted via regex |
| V. DOM Injection | N/A (backend layer) |

---

## References

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [LangChain Qdrant Integration](https://qdrant.tech/documentation/frameworks/langchain/)
- [LangChain OpenAI Integration](https://python.langchain.com/docs/integrations/llms/openai/)
- [Tenacity Retry Library](https://tenacity.readthedocs.io/)
- [Firefox Extension IDs](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/)
