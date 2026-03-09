# Research: RAG Backend API

**Feature**: 002-rag-backend  
**Date**: 2026-03-09

## 1. FastAPI Application Structure

### Decision: Single-file main.py with service modules

**Rationale**: The API has only 2 endpoints (`/fill-form`, `/health`). A modular structure with separate services keeps code organized without over-engineering.

**Implementation Pattern**:
```python
# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from src.config import settings

app = FastAPI(title="RAG Backend API")

# CORS Configuration (Constitution IV)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["moz-extension://*", "http://localhost", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

**Alternatives Considered**:
- FastAPI routers in separate files - Rejected: Overkill for 2 endpoints
- Class-based views - Rejected: Functional endpoints sufficient for this scope

---

## 2. Configuration Management

### Decision: pydantic-settings with .env file

**Rationale**: pydantic-settings provides type-safe configuration with automatic .env loading and validation.

**Implementation Pattern**:
```python
# src/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    QDRANT_URL: str = "http://qdrant-db:6333"
    QDRANT_COLLECTION: str = "resumes"
    ZAI_API_KEY: str
    ZAI_BASE_URL: str = "https://api.z.ai/v1"
    EMBEDDING_DIMENSION: int = 1536
    RETRIEVAL_K: int = 5
    MAX_RETRIES: int = 4
    RETRY_BASE_DELAY: float = 1.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

**Alternatives Considered**:
- python-dotenv directly - Rejected: No type validation
- Environment variables only - Rejected: No defaults or validation

---

## 3. Qdrant Client Integration

### Decision: AsyncQdrantClient with lifespan management

**Rationale**: Async client matches FastAPI's async nature. Lifespan pattern ensures proper connection pooling.

**Implementation Pattern**:
```python
# src/services/retriever.py
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import SearchRequest
from src.config import settings

class RetrieverService:
    def __init__(self):
        self.client: AsyncQdrantClient | None = None
    
    async def connect(self):
        self.client = AsyncQdrantClient(url=settings.QDRANT_URL)
    
    async def search(self, query_vector: list[float], k: int = 5) -> list[dict]:
        """Search for top-k similar vectors (Constitution II: k=5)"""
        results = await self.client.search(
            collection_name=settings.QDRANT_COLLECTION,
            query_vector=query_vector,
            limit=k
        )
        return [{"id": r.id, "score": r.score, "payload": r.payload} for r in results]
    
    async def close(self):
        if self.client:
            await self.client.close()

# Lifespan management in main.py
from contextlib import asynccontextmanager

retriever = RetrieverService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await retriever.connect()
    yield
    await retriever.close()

app = FastAPI(lifespan=lifespan)
```

**Key Decisions**:
- Use `AsyncQdrantClient` for non-blocking I/O
- Lifespan context manager for connection lifecycle
- Direct `search()` method (Constitution II mandates k=5)

**Alternatives Considered**:
- LangChain Qdrant wrapper - Rejected: Adds abstraction layer without benefit
- Synchronous client - Rejected: Blocks event loop

---

## 4. OpenAI-Compatible Client

### Decision: OpenAI Python SDK with custom base_url

**Rationale**: Official SDK handles streaming, retries, and type safety. Custom base_url enables Z.ai compatibility.

**Implementation Pattern**:
```python
# src/services/generator.py
from openai import AsyncOpenAI
from src.config import settings

class GeneratorService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.ZAI_API_KEY,
            base_url=settings.ZAI_BASE_URL  # Constitution risk mitigation
        )
    
    async def generate_answer(self, context: str, question: str) -> str:
        """Generate grounded answer (Constitution III: Zero Hallucination)"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",  # Or Z.ai equivalent
            messages=[
                {
                    "role": "system",
                    "content": """You are a helpful assistant that answers questions about a job applicant's resume.
CRITICAL RULES:
1. ONLY use information from the provided context
2. If the context doesn't contain relevant information, say "I don't have information about that in the resume"
3. NEVER fabricate or infer experience not explicitly stated
4. Keep answers concise and factual"""
                },
                {
                    "role": "user",
                    "content": f"Context from resume:\n{context}\n\nQuestion: {question}"
                }
            ],
            temperature=0.3  # Lower temperature for factual responses
        )
        return response.choices[0].message.content

generator = GeneratorService()
```

**Key Decisions**:
- Explicit `base_url` override prevents path doubling (Constitution risk mitigation)
- Strong anti-hallucination system prompt (Constitution III)
- Low temperature (0.3) for factual responses

**Alternatives Considered**:
- httpx direct API calls - Rejected: SDK provides retry logic and type safety
- LangChain chat models - Rejected: Unnecessary abstraction

---

## 5. Exponential Backoff Retry

### Decision: tenacity library with async support

**Rationale**: tenacity is battle-tested, supports async, and provides clean decorators.

**Implementation Pattern**:
```python
# src/utils/retry.py
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from openai import RateLimitError, APIConnectionError
from qdrant_client.http.exceptions import UnexpectedResponse

# For Qdrant operations
retry_qdrant = retry(
    stop=stop_after_attempt(4),  # 4 attempts
    wait=wait_exponential(multiplier=1, min=1, max=8),  # 1s, 2s, 4s, 8s
    retry=retry_if_exception_type((APIConnectionError, UnexpectedResponse)),
    reraise=True
)

# For LLM operations
retry_llm = retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type((RateLimitError, APIConnectionError)),
    reraise=True
)
```

**Usage**:
```python
@retry_qdrant
async def search_with_retry(query_vector: list[float]) -> list[dict]:
    return await retriever.search(query_vector)

@retry_llm
async def generate_with_retry(context: str, question: str) -> str:
    return await generator.generate_answer(context, question)
```

**Alternatives Considered**:
- Manual implementation - Rejected: More code, less tested
- backoff library - Rejected: tenacity has better async support
- No retry - Rejected: Network failures are inevitable

---

## 6. Embedding Query Generation

### Decision: Use same embedding model as ingestion (text-embedding-3-small)

**Rationale**: Query embedding must match document embedding dimension (Constitution I: 1536-dim).

**Implementation Pattern**:
```python
# src/services/embedder.py
from openai import AsyncOpenAI
from src.config import settings

class EmbedderService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.ZAI_API_KEY,
            base_url=settings.ZAI_BASE_URL
        )
    
    async def embed(self, text: str) -> list[float]:
        """Generate 1536-dim embedding (Constitution I)"""
        response = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            dimensions=1536
        )
        return response.data[0].embedding

embedder = EmbedderService()
```

**Key Decisions**:
- Explicit `dimensions=1536` ensures compatibility (Constitution I)
- Same client configuration as generator for consistency

---

## 7. Testing Strategy

### Decision: pytest + pytest-asyncio + httpx AsyncClient

**Rationale**: Standard async testing stack for FastAPI.

**Test Structure**:
```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# tests/integration/test_api.py
@pytest.mark.asyncio
async def test_fill_form_endpoint(client):
    response = await client.post("/fill-form", json={"label": "Years of Python experience"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "has_data" in data
    assert "confidence" in data
    assert "context_chunks" in data

# tests/unit/test_retriever.py
@pytest.mark.asyncio
async def test_retriever_returns_k_results(mock_qdrant):
    results = await retriever.search(query_vector=[...], k=5)
    assert len(results) == 5
```

**Alternatives Considered**:
- TestClient (sync) - Rejected: Doesn't test async paths properly
- unittest - Rejected: pytest fixtures more flexible

---

## 8. Logging Strategy

### Decision: Python logging module with structured format

**Rationale**: Built-in, no dependencies, structured logs for debugging.

**Implementation Pattern**:
```python
# src/main.py
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# In route handler
@app.post("/fill-form")
async def fill_form(request: AnswerRequest):
    logger.info(f"Received query: {request.label}")
    # ...
    logger.info(f"Retrieved {len(context)} chunks")
    logger.info(f"Generated answer with confidence: {confidence}")
```

**FR-010 Compliance**: All requests and errors logged for debugging.

---

## Summary of Key Decisions

| Area | Decision | Constitution Alignment |
|------|----------|----------------------|
| API Framework | FastAPI with async | ✅ |
| Config | pydantic-settings + .env | ✅ |
| Vector DB | AsyncQdrantClient | ✅ Constitution II (k=5) |
| LLM Client | OpenAI SDK with base_url | ✅ Constitution III (anti-hallucination) |
| Retry | tenacity exponential backoff | ✅ Spec requirement |
| Embeddings | text-embedding-3-small (1536-dim) | ✅ Constitution I |
| CORS | moz-extension://* + localhost | ✅ Constitution IV |
| Testing | pytest + pytest-asyncio | ✅ |
