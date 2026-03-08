# Data Model: RAG Backend API

**Feature**: 002-rag-backend | **Date**: 2026-03-08

## Overview

This document defines the data models for the RAG Backend API, including request/response schemas, configuration entities, and service interfaces.

---

## API Schemas (Pydantic Models)

### FillFormRequest

Request payload for form field answer generation.

```python
from pydantic import BaseModel, Field
from typing import Optional

class FillFormRequest(BaseModel):
    """Request to generate an answer for a form field."""
    
    label: str = Field(
        ...,
        description="The form field label text",
        min_length=1,
        max_length=500,
        examples=["Years of Python experience"]
    )
    
    context_hints: Optional[str] = Field(
        default=None,
        description="Optional context hints to improve retrieval",
        max_length=1000,
        examples=["Looking for backend development experience"]
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "label": "Years of Python experience",
                "context_hints": "Looking for backend development experience"
            }
        }
```

### FillFormResponse

Response payload containing the generated answer.

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SourceDocument(BaseModel):
    """A source document used to generate the answer."""
    
    content: str = Field(
        ...,
        description="The content of the source document"
    )
    
    metadata: dict = Field(
        default_factory=dict,
        description="Metadata about the source (page, section, etc.)"
    )
    
    relevance_score: Optional[float] = Field(
        default=None,
        description="Relevance score from vector search",
        ge=0.0,
        le=1.0
    )

class FillFormResponse(BaseModel):
    """Response containing the generated answer."""
    
    answer: str = Field(
        ...,
        description="The generated answer based on resume context"
    )
    
    sources: List[SourceDocument] = Field(
        default_factory=list,
        description="Source documents used to generate the answer"
    )
    
    has_data: bool = Field(
        default=True,
        description="Whether relevant data was found in the resume"
    )
    
    confidence: Optional[str] = Field(
        default=None,
        description="Confidence level: 'high', 'medium', 'low', or 'none'"
    )
    
    processing_time_ms: int = Field(
        ...,
        description="Time taken to process the request in milliseconds"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "answer": "5 years of Python experience in backend development",
                "sources": [
                    {
                        "content": "Python Developer at TechCorp (2019-2024)",
                        "metadata": {"section": "work_experience"},
                        "relevance_score": 0.92
                    }
                ],
                "has_data": True,
                "confidence": "high",
                "processing_time_ms": 1234
            }
        }
```

### HealthResponse

Response for health check endpoint.

```python
from pydantic import BaseModel, Field
from typing import Literal

class HealthResponse(BaseModel):
    """Health check response."""
    
    status: Literal["healthy", "degraded", "unhealthy"] = Field(
        ...,
        description="Overall health status"
    )
    
    version: str = Field(
        ...,
        description="API version"
    )
    
    qdrant_connected: bool = Field(
        ...,
        description="Whether Qdrant connection is available"
    )
    
    qdrant_collections: int = Field(
        ...,
        description="Number of collections in Qdrant"
    )
    
    resume_embeddings_count: Optional[int] = Field(
        default=None,
        description="Number of vectors in resume_embeddings collection"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "qdrant_connected": True,
                "qdrant_collections": 1,
                "resume_embeddings_count": 150
            }
        }
```

### ErrorResponse

Standard error response format.

```python
from pydantic import BaseModel, Field
from typing import Optional

class ErrorResponse(BaseModel):
    """Standard error response."""
    
    error: str = Field(
        ...,
        description="Error type"
    )
    
    message: str = Field(
        ...,
        description="Human-readable error message"
    )
    
    detail: Optional[str] = Field(
        default=None,
        description="Additional error details"
    )
    
    request_id: Optional[str] = Field(
        default=None,
        description="Request ID for debugging"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid request payload",
                "detail": "label field is required",
                "request_id": "req_abc123"
            }
        }
```

---

## Configuration Entities

### Settings

Application configuration loaded from environment.

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    # API Configuration
    app_name: str = "RAG Backend API"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    
    # Z.ai API Configuration
    zai_api_key: str  # Required, no default
    zai_base_url: str = "https://api.z.ai/v1"
    zai_model: str = "gpt-4-turbo-preview"
    
    # Qdrant Configuration
    qdrant_url: str = "http://qdrant-db:6333"
    qdrant_collection: str = "resume_embeddings"
    qdrant_timeout: int = 30
    
    # RAG Configuration
    embedding_dimension: int = 1536  # Constitution I
    retrieval_k: int = 5  # Constitution II
    llm_temperature: float = 0.1  # Low for RAG
    max_tokens: int = 4000
    
    # CORS Configuration
    cors_origins: list[str] = ["moz-extension://*", "http://localhost:*"]
    cors_allow_credentials: bool = True
    
    # Retry Configuration
    max_retries: int = 5
    retry_min_wait: float = 1.0
    retry_max_wait: float = 32.0
    
    # Performance
    request_timeout: int = 60
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
```

---

## Service Entities

### VectorStoreConnection

Manages Qdrant client connection.

```python
from dataclasses import dataclass
from typing import Optional
from qdrant_client import QdrantClient

@dataclass
class VectorStoreConnection:
    """Vector store connection configuration."""
    
    client: QdrantClient
    collection_name: str
    embedding_dimension: int = 1536
    
    # Connection state
    is_connected: bool = False
    last_ping_time: Optional[float] = None
    
    # Collection info
    vectors_count: Optional[int] = None
    indexed_vectors_count: Optional[int] = None
```

### RAGPipeline

RAG processing pipeline configuration.

```python
from dataclasses import dataclass
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_qdrant import QdrantVectorStore

@dataclass
class RAGPipeline:
    """RAG pipeline configuration."""
    
    llm: ChatOpenAI
    vector_store: QdrantVectorStore
    retriever_k: int = 5
    
    # System prompt
    system_prompt: str = ""  # Loaded from prompts/system.py
    
    # Performance tracking
    last_query_time_ms: Optional[int] = None
    total_queries: int = 0
```

---

## Internal Data Flows

### Retrieval Context

```python
from dataclasses import dataclass
from typing import List
from langchain_core.documents import Document

@dataclass
class RetrievalContext:
    """Context retrieved from vector store."""
    
    query: str
    documents: List[Document]
    total_tokens: int  # For token limit monitoring
    retrieval_time_ms: int
```

### GeneratedAnswer

```python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class GeneratedAnswer:
    """Generated answer with metadata."""
    
    text: str
    sources: List[dict]
    has_data: bool
    confidence: str  # 'high', 'medium', 'low', 'none'
    
    # Processing metrics
    retrieval_time_ms: int
    generation_time_ms: int
    total_time_ms: int
```

---

## State Transitions

### Request Processing Flow

```
1. Request received
   └── Validate payload (FillFormRequest)
   
2. Retrieval phase
   ├── Embed query
   ├── Search Qdrant with k=5
   └── Return RetrievalContext
   
3. Generation phase
   ├── Build prompt with context
   ├── Call LLM with system prompt
   └── Return GeneratedAnswer
   
4. Response formatting
   ├── Map to FillFormResponse
   └── Return to client
```

### Error States

| Condition | Response |
|-----------|----------|
| Invalid payload | 422 Validation Error |
| Qdrant unavailable | 503 Service Unavailable |
| No relevant context | 200 with `has_data: false` |
| LLM rate limit | Retry with exponential backoff |
| LLM timeout | 504 Gateway Timeout |

---

## Data Validation Rules

### Form Label Validation
- Minimum length: 1 character
- Maximum length: 500 characters
- Must be non-empty string

### Context Hints Validation
- Optional field
- Maximum length: 1000 characters
- Can be null or empty string

### Answer Validation
- Must be non-empty string
- Maximum length: 4000 characters (configurable)
- Must not contain fabricated information

---

## Schema Relationships

```
┌─────────────────┐
│ FillFormRequest │
│ ─────────────── │
│ label           │
│ context_hints   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ RetrievalContext│      │ RAGPipeline     │
│ ─────────────── │      │ ─────────────── │
│ query           │─────▶│ llm             │
│ documents       │      │ vector_store    │
│ total_tokens    │      │ retriever_k     │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│ GeneratedAnswer │
│ ─────────────── │
│ text            │
│ sources         │
│ has_data        │
│ confidence      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│FillFormResponse │
│ ─────────────── │
│ answer          │
│ sources         │
│ has_data        │
│ confidence      │
│ processing_time │
└─────────────────┘
```

---

## Files to Create

| File | Content |
|------|---------|
| `backend/src/api/schemas.py` | Pydantic models |
| `backend/src/config.py` | Settings class |
| `backend/src/services/vector_store.py` | VectorStoreConnection |
| `backend/src/services/rag.py` | RAGPipeline |
