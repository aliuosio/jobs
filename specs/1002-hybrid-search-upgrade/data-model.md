# Data Model: Hybrid Search Upgrade

## Current State

```python
# retriever.py - current pure vector search
class RetrieverService:
    async def search(self, query: str, limit: int = 5) -> List[SearchResult]:
        dense_vector = await self.embedder.embed(query)
        results = await self.qdrant.search(
            collection_name="resume",
            query_vector=dense_vector,
            limit=limit
        )
        return results
```

## Target State

### SparseVector Entity

```python
from pydantic import BaseModel
from typing import List

class SparseVector(BaseModel):
    """Qdrant sparse vector for BM25-style matching"""
    indices: List[int]   # Token IDs from vocabulary
    values: List[float]  # BM25-weighted values
    
    class Config:
        json_schema_extra = {
            "example": {
                "indices": [1234, 5678, 9012],
                "values": [0.85, 0.72, 0.45]
            }
        }
```

### HybridSearchResult Entity

```python
class HybridSearchResult(BaseModel):
    """Search result with hybrid scoring breakdown"""
    id: str
    text: str
    payload: dict
    vector_score: float      # Dense vector similarity (0-1)
    bm25_score: float        # Sparse/BM25 score (0-1 normalized)
    combined_score: float    # Weighted combination
    phrase_bonus: float = 0.0  # Bonus for phrase matches
```

### HybridWeights Configuration

```python
class HybridWeights(BaseModel):
    """Configurable weights for hybrid search fusion"""
    vector_weight: float = 0.7
    bm25_weight: float = 0.3
    phrase_bonus_weight: float = 0.1
    
    def validate_weights(self):
        total = self.vector_weight + self.bm25_weight
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")
```

### Qdrant Collection Schema Update

```json
{
  "collection_name": "resume",
  "vectors": {
    "size": 1024,
    "distance": "Cosine"
  },
  "sparse_vectors": {
    "text": {
      "modifier": "idf"
    }
  }
}
```

### Point Structure (After Migration)

```json
{
  "id": "uuid",
  "vector": {
    "": [0.1, 0.2, ...],           // Dense vector (1024 dims)
    "text": {                       // Sparse vector
      "indices": [123, 456, 789],
      "values": [0.85, 0.72, 0.45]
    }
  },
  "payload": {
    "text": "Role: Senior Developer. Domain: FinTech...",
    "metadata": {
      "type": "experience",
      "domain": "FinTech",
      "role": "Senior Developer",
      "tech": ["Python", "FastAPI", "Qdrant"]
    }
  }
}
```

## Environment Variables

```bash
# Hybrid Search Configuration
HYBRID_VECTOR_WEIGHT=0.7
HYBRID_BM25_WEIGHT=0.3
HYBRID_PHRASE_BONUS=0.1
HYBRID_ENABLED=true
```

## API Contract (Unchanged)

```python
# Request (unchanged)
class SearchRequest(BaseModel):
    query: str
    limit: int = 5

# Response (unchanged externally)
class SearchResponse(BaseModel):
    results: List[SearchResult]
    has_data: bool
    
# Internal enhancement (not exposed)
class InternalSearchResult(SearchResult):
    vector_score: float
    bm25_score: float
    combined_score: float