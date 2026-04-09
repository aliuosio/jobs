# n8n AI Agent Integration Guide

## Overview

The `/api/v1/search` endpoint exposes the full RAG retrieval pipeline to n8n AI agents via HTTP Request tool. This enables AI agents to query resume data with configurable retrieval enhancements.

## HTTP Request Tool Configuration

### Tool Setup

| Parameter | Value |
|-----------|-------|
| **Tool Name** | `resume_search` |
| **Tool Description** | `Search your resume for skills, experience, education, and qualifications. Returns relevant resume sections ranked by relevance with confidence scores.` |
| **URL** | `http://api-backend:8000/api/v1/search` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

### Request Body

```json
{
  "query": "{{ $json.query }}",
  "use_hyde": true,
  "use_reranking": true,
  "top_k": 3,
  "include_scores": true,
  "generate": false
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | **required** | Natural language search query |
| `use_hyde` | boolean | `true` | Enable HyDE (hypothetical document embeddings) |
| `use_reranking` | boolean | `true` | Enable cross-encoder + LLM rubric reranking |
| `top_k` | integer | `5` | Number of results (1-20) |
| `include_scores` | boolean | `true` | Include score breakdown in response |
| `generate` | boolean | `false` | Generate LLM answer (like /api/v1/search with generate=true) |

### Two Modes

**Mode 1: Raw Search (default)**
- `generate: false` - Returns raw chunks with scores
- Fast, suitable for agent to synthesize

**Mode 2: Generated Answer**
- `generate: true` - Returns LLM-generated answer
- Uses full RAG pipeline (retrieval + generation)
- Returns: `generated_answer`, `confidence`, `field_type`

### Example Response (Raw Search)

```json
{
  "results": [
    {
      "content": "5 years Python, Django, FastAPI experience in backend development",
      "score": 0.82,
      "source": "resume",
      "scores": {
        "vector_score": 0.85,
        "bm25_score": 0.72,
        "rerank_score": 0.91
      }
    }
  ],
  "query": "Python experience",
  "total_retrieved": 1,
  "generated_answer": null,
  "confidence": null,
  "field_type": null
}
```

### Example Response (Generated Answer)

```json
{
  "results": [...],
  "query": "Email Address",
  "total_retrieved": 5,
  "generated_answer": "john.doe@example.com",
  "confidence": "high",
  "field_type": "email"
}
```
        "rerank_score": 0.80
      }
    }
  ],
  "query": "Python experience",
  "total_retrieved": 2
}
```

## Prompt Engineering Examples

### Basic Search Prompt

```
You have access to a resume search tool. When the user asks about their skills, 
experience, or qualifications, use the resume_search tool to find relevant information.

Example queries:
- "What is my Python experience?"
- "Tell me about my backend skills"
- "What education do I have?"
```

### Structured Response Prompt

```
When answering questions about the resume, first search using resume_search tool,
then synthesize the results into a clear response.

For each answer, cite the source and confidence:
- High confidence (score > 0.7): "Based on your resume, you have..."
- Medium confidence (0.5-0.7): "Your resume mentions..."
- Low confidence (< 0.5): "I found some related information..."
```

### Skill Matching Prompt

```
You are helping match job requirements to the user's resume. Use resume_search 
to find relevant skills and experience, then compare against job requirements.

For each job requirement:
1. Search the resume for relevant experience
2. Score the match (0-100%)
3. Provide specific examples from the resume
```

## Retrieval Enhancement Options

### Fast Mode (Low Latency)

```json
{
  "query": "Python experience",
  "use_hyde": false,
  "use_reranking": false,
  "top_k": 3,
  "include_scores": false
}
```

**Use case**: Quick keyword lookups, real-time suggestions

### Quality Mode (High Accuracy)

```json
{
  "query": "Python experience",
  "use_hyde": true,
  "use_reranking": true,
  "top_k": 5,
  "include_scores": true
}
```

**Use case**: Detailed analysis, job matching, cover letter generation

### Balanced Mode (Default)

```json
{
  "query": "Python experience",
  "use_hyde": true,
  "use_reranking": true,
  "top_k": 3,
  "include_scores": true
}
```

**Use case**: General-purpose AI agent queries

## Score Interpretation

| Score Range | Interpretation | Action |
|------------|----------------|--------|
| `score >= 0.8` | High relevance | Use directly |
| `0.6 <= score < 0.8` | Medium relevance | Verify with context |
| `0.4 <= score < 0.6` | Low relevance | Use with caution |
| `score < 0.4` | Minimal relevance | Skip or clarify |

## n8n Workflow Example

```
┌─────────────────────────────────────────────────────────┐
│                    Chat Trigger                          │
│              (User asks about skills)                    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              AI Agent (LangChain)                       │
│  System: Answer questions about the user's resume       │
│  Tools: [resume_search]                                 │
└─────────────────────────┬───────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ resume_search    │    │   Continue...     │
    │ query: Python    │    │                   │
    │ use_reranking:  │    │                   │
    └────────┬────────┘    └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Response with    │
    │ relevant resume  │
    │ sections        │
    └──────────────────┘
```

## Error Handling

| HTTP Status | Meaning | Agent Response |
|-------------|---------|----------------|
| 200 | Success | Use results |
| 422 | Validation error | Invalid request format |
| 503 | Service unavailable | "Resume search is temporarily unavailable" |
| 500 | Server error | "An error occurred, please try again" |
