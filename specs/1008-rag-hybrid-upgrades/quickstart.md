# Quickstart: RAG System Hybrid Retrieval Enhancements

**Feature**: 1008-rag-hybrid-upgrades

---

## Overview

This guide helps you quickly enable and test the hybrid retrieval enhancements in the existing RAG system.

---

## Prerequisites

- Docker and Docker Compose running
- Backend API accessible at `http://localhost:8000`
- Qdrant running at `http://localhost:6333`

---

## Enabling Enhancements

### 1. Environment Variables

Add these to your `.env` file:

```bash
# HyDE Settings
HYDE_ENABLED=true
HYDE_CACHE_TTL=3600

# Embedding Reranker Settings
EMBEDDING_RERANK_ENABLED=true
EMBEDDING_RERANK_TOP_K=50

# LLM Reranker Settings
LLM_RERANK_ENABLED=true
LLM_RERANK_TOP_K=10

# MMR Settings
MMR_ENABLED=true
MMR_LAMBDA=0.5

# Weights (optional - defaults work well)
VECTOR_WEIGHT=0.5
BM25_WEIGHT=0.3
RERANK_WEIGHT=0.2
```

### 2. Restart Services

```bash
docker-compose restart api-backend
```

---

## Testing the Enhancements

### Test 1: HyDE Search

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "Tell me about your Python experience"}'
```

**Expected**: Response includes HyDE-generated context in logs

### Test 2: Verify Reranking

Check response metadata for reranking info:
```json
{
  "answer": "...",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 3,
  "reranking_applied": true,
  "rerank_stages": ["embedding", "llm"]
}
```

### Test 3: Performance Check

```bash
time curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "What is your work experience?"}'
```

**Target**: Response time < 3 seconds

### Test 4: Graceful Degradation

1. Disable reranking: `EMBEDDING_RERANK_ENABLED=false`
2. Make a request - should still work with baseline retrieval
3. Re-enable: `EMBEDDING_RERANK_ENABLED=true`

---

## Configuration Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `HYBRID_ENABLED` | true | Enable hybrid search |
| `HYDE_ENABLED` | false | Enable HyDE |
| `HYDE_MODEL` | mistral-small-latest | LLM model for HyDE generation |
| `HYDE_MAX_TOKENS` | 200 | Max tokens in HyDE draft |
| `HYDE_TEMPERATURE` | 0.7 | Temperature for HyDE generation |
| `EMBEDDING_RERANK_ENABLED` | false | Enable cross-encoder reranking |
| `EMBEDDING_RERANK_TOP_K` | 50 | Number of candidates to rerank |
| `CROSS_ENCODER_MODEL` | ms-marco-MiniLM-L-6-v2 | Cross-encoder model name |
| `LLM_RERANK_ENABLED` | false | Enable LLM rubric reranking |
| `LLM_RERANK_TOP_K` | 10 | Number of candidates for LLM rerank |
| `MMR_ENABLED` | false | Enable MMR diversification |
| `MMR_K` | 10 | Number of results for MMR |
| `MMR_LAMBDA` | 0.5 | MMR balance (0= relevance, 1= diversity) |
| `RETRIEVAL_VECTOR_WEIGHT` | 0.5 | Weight for vector similarity |
| `RETRIEVAL_BM25_WEIGHT` | 0.3 | Weight for BM25 scores |
| `RETRIEVAL_RERANK_WEIGHT` | 0.2 | Weight for reranking scores |

---

## Troubleshooting

### Issue: HyDE generates empty response

**Solution**: Check logs - should fall back to original query embedding

### Issue: Reranking slows down responses

**Solution**: Reduce `EMBEDDING_RERANK_TOP_K` from 50 to 30

### Issue: LLM reranking costs too much

**Solution**: Set `LLM_RERANK_ENABLED=false` for production

---

## Monitoring

Check logs for:
- `HyDE generated: ...` - HyDE generation active
- `Embedding rerank applied` - Cross-encoder active
- `LLM rerank applied` - LLM rubric active
- `MMR applied` - MMR diversification active