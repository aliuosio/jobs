## Why

The n8n AI agents currently have limited access to the RAG pipeline's enhanced search capabilities (BM25, HyDE, reranking). Existing QdrantVectorStore integration provides direct vector search but loses the hybrid retrieval enhancements that significantly improve result quality. A dedicated search API would expose the full retrieval pipeline to n8n AI agents via HTTP Request tool.

## What Changes

- **New API endpoint**: `POST /search` that exposes the full retrieval pipeline
- **Search control parameters**: Toggle HyDE, reranking, and BM25 per request
- **Enhanced response format**: Returns score breakdowns (vector, BM25, rerank) for agent trust
- **n8n AI tool integration**: HTTP Request node configured to call `/search` with natural language queries
- **Optional**: Migrate existing `/fill-form` to use the new search endpoint internally

## Capabilities

### New Capabilities

- `rag-search-api`: HTTP endpoint for semantic resume search with configurable retrieval enhancements (BM25, HyDE, cross-encoder reranking, LLM rubric reranking, MMR diversification)

### Modified Capabilities

- None - existing `/fill-form` behavior is preserved

## Impact

- **New endpoint**: `POST /api/v1/search` in FastAPI backend
- **New response schema**: `SearchResponse` with `results[]` containing `content`, `score`, `scores` breakdown
- **n8n integration**: New HTTP Request tool configuration in AI agent workflows
- **Dependencies**: Uses existing `RetrieverService`, `EmbedderService`, `RerankerService`
