# Data Model: RAG Backend API

**Feature**: 002-rag-backend  
**Date**: 2026-03-09

## Entity Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ AnswerRequest   │────▶│ RAGPipeline     │────▶│ AnswerResponse  │
│ (input)         │     │ (internal)      │     │ (output)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌───────────────┐   ┌───────────────┐
            │ VectorStore   │   │ InferenceAPI  │
            │ (Qdrant)      │   │ (Z.ai)        │
            └───────────────┘   └───────────────┘
```

## Entities

### 1. AnswerRequest

**Purpose**: Input payload for form field answer generation.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `label` | string | Yes | Form field label text | Non-empty, max 1000 chars |

**Example**:
```json
{
  "label": "Years of Python experience"
}
```

**Validation Rules**:
- `label` must not be empty
- `label` must not exceed 1000 characters
- Request payload must be under 10KB (per spec assumption)

---

### 2. AnswerResponse

**Purpose**: Output payload containing generated answer and metadata.

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `answer` | string | Yes | Generated answer text | Grounded in retrieved context |
| `has_data` | bool | Yes | Whether relevant context was found | `false` if no chunks retrieved |
| `confidence` | string | Yes | Confidence level | Enum: `"high"`, `"medium"`, `"low"`, `"none"` |
| `context_chunks` | int | Yes | Number of context chunks retrieved | Range: 0-5 (Constitution II: k=5) |

**Example (success)**:
```json
{
  "answer": "5 years of professional Python experience, including 3 years with Django framework.",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 3
}
```

**Example (no data)**:
```json
{
  "answer": "I don't have information about that in the resume.",
  "has_data": false,
  "confidence": "none",
  "context_chunks": 0
}
```

**Confidence Levels** (determined by average similarity score of retrieved chunks):

| Level | Avg Score Threshold | Meaning |
|-------|---------------------|---------|
| `high` | >= 0.8 | Multiple relevant chunks with clear match |
| `medium` | >= 0.5 | Some relevant context found |
| `low` | < 0.5 | Weak or ambiguous matches |
| `none` | 0 chunks | No relevant context retrieved |


---

### 3. HealthResponse

**Purpose**: Service health check response.

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `status` | string | Yes | Health status | Always `"healthy"` when running |

**Example**:
```json
{
  "status": "healthy"
}
```

---

### 4. VectorStoreConnection (Internal)

**Purpose**: Configuration for Qdrant vector database connection.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | string | `http://qdrant-db:6333` | Qdrant instance URL (Docker DNS) |
| `collection` | string | `resumes` | Target collection name |
| `embedding_dimension` | int | `1536` | Vector dimension (Constitution I) |

**State Transitions**:
```
[disconnected] ──connect()──▶ [connected] ──close()──▶ [closed]
      │                            │
      └──retry on failure──────────┘
```

---

### 5. ContextChunk (Internal)

**Purpose**: Retrieved document chunk from vector store.

| Field | Type | Description |
|-------|------|-------------|
| `id` | str/uuid | Chunk identifier |
| `score` | float | Similarity score (0.0-1.0) |
| `payload` | dict | Document content and metadata |

**Relationship**: Up to 5 ContextChunks retrieved per query (Constitution II).

---

### 6. InferenceConfig (Internal)

**Purpose**: Configuration for Z.ai API client.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | Required | API authentication key |
| `base_url` | string | `https://api.z.ai/v1` | API endpoint (prevents path doubling) |
| `model` | string | `gpt-4o-mini` | Model identifier |
| `temperature` | float | `0.3` | Response randomness (low for factual) |

---

## Configuration Entity

### Settings

**Purpose**: Application-wide configuration via environment.

| Field | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `QDRANT_URL` | string | `http://qdrant-db:6333` | No | Qdrant connection URL |
| `QDRANT_COLLECTION` | string | `resumes` | No | Vector collection name |
| `ZAI_API_KEY` | string | - | **Yes** | Z.ai API key |
| `ZAI_BASE_URL` | string | `https://api.z.ai/v1` | No | Z.ai API base URL |
| `EMBEDDING_DIMENSION` | int | `1536` | No | Embedding vector dimension |
| `RETRIEVAL_K` | int | `5` | No | Number of chunks to retrieve |
| `MAX_RETRIES` | int | `4` | No | Max retry attempts |
| `RETRY_BASE_DELAY` | float | `1.0` | No | Base delay in seconds |

---

## Relationships

```
AnswerRequest 1:1 ──▶ AnswerResponse
     │
     └──▶ VectorStoreConnection ──▶ ContextChunk[] (0-5)
                                      │
                                      └──▶ InferenceConfig ──▶ LLM Response
```

---

## Data Flow

1. **Request Ingestion**: `AnswerRequest` validated and logged
2. **Embedding**: `label` converted to 1536-dim vector
3. **Retrieval**: Vector store queried with k=5 → `ContextChunk[]`
4. **Context Assembly**: Top chunks formatted as context string
5. **Generation**: LLM generates grounded answer
6. **Response**: `AnswerResponse` assembled with metadata
