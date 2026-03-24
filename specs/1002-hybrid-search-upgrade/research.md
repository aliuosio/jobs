# Research: Hybrid Search Upgrade

## Problem Statement

Pure vector search fails on domain-specific terms (abbreviations, internal names, project codes) because these terms lack semantic meaning in general embedding models.

Example from article: "BV-KI" finds nothing because the embedding model doesn't understand this internal abbreviation.

## Solution: Hybrid Search (70% Vector + 30% BM25)

### Why 70/30 Split?

From the article:
> "70% Vector + 30% BM25 with Phrase-Bonus. Zwei Zeilen Code. Der Qualitätssprung war massiv."

- Vector search: Captures semantic meaning, handles synonyms, paraphrasing
- BM25: Exact term matching, handles abbreviations, domain-specific terms
- Phrase bonus: Boosts multi-word phrases appearing together

## Qdrant Sparse Vector Support

### Version Requirements

Qdrant v1.10+ supports native sparse vectors with BM25-style scoring.

Current docker-compose uses `qdrant/qdrant:latest` - should support sparse vectors.

### Qdrant Hybrid Query API

```python
from qdrant_client import QdrantClient
from qdrant_client.models import SparseVector

client = QdrantClient(url="http://localhost:6333")

# Hybrid query
results = client.query_points(
    collection_name="resume",
    query=dense_vector,                    # 1024-dim from Mistral
    sparse_query=SparseVector(
        indices=[123, 456, 789],           # Token IDs
        values=[0.85, 0.72, 0.45]          # BM25 weights
    ),
    limit=5,
    with_payload=True
)
```

### Collection Setup for Sparse Vectors

```python
from qdrant_client.models import VectorParams, SparseVectorParams

client.create_collection(
    collection_name="resume",
    vectors_config=VectorParams(
        size=1024,
        distance="Cosine"
    ),
    sparse_vectors_config={
        "text": SparseVectorParams(
            modifier="idf"  # BM25-style IDF weighting
        )
    }
)
```

## Sparse Vector Generation Options

### Option 1: Qdrant Built-in Sparse Embedding

Qdrant can generate sparse vectors automatically using built-in tokenization.

**Pros:** No external dependencies, simple integration
**Cons:** Less control over tokenization

### Option 2: SPLADE (Sparse Lexical and Expansion)

Neural sparse encoder that expands queries with related terms.

**Pros:** Better semantic expansion
**Cons:** Requires ML model, more complex

### Option 3: Simple BM25 Tokenization

Implement basic tokenization with stopword removal and stemming.

**Pros:** Simple, fast, no external dependencies
**Cons:** No semantic expansion

### Recommendation

Start with **Option 3 (Simple BM25)** for initial implementation. Can upgrade to SPLADE later if needed.

## Phrase Bonus Implementation

### Concept

Boost scores when query words appear consecutively in the document.

### Implementation Approach

```python
def calculate_phrase_bonus(query: str, text: str, base_bonus: float = 0.1) -> float:
    """Calculate phrase bonus for contiguous word matches."""
    query_words = query.lower().split()
    text_lower = text.lower()
    
    # Check for exact phrase match
    if query.lower() in text_lower:
        return base_bonus * 2  # Double bonus for exact match
    
    # Check for partial phrase matches
    bonus = 0.0
    for i in range(len(query_words) - 1):
        phrase = f"{query_words[i]} {query_words[i+1]}"
        if phrase in text_lower:
            bonus += base_bonus * 0.5
    
    return min(bonus, base_bonus)  # Cap at base_bonus
```

## Migration Strategy

### Current Collection State

- Collection: `resume`
- Vectors: Dense only (1024-dim Mistral embeddings)
- Points: Resume chunks with metadata

### Migration Steps

1. Create new collection with sparse vector config
2. Re-run n8n import workflow with sparse vector generation
3. Verify data integrity
4. Switch API to use new collection
5. Delete old collection

### Rollback Plan

Keep old collection until migration verified. Fallback to pure vector search if sparse vectors unavailable.

## References

- [Qdrant Sparse Vectors Documentation](https://qdrant.tech/documentation/concepts/indexing/#sparse-vectors)
- [Qdrant Hybrid Search](https://qdrant.tech/articles/hybrid-search/)
- [BM25 Algorithm](https://en.wikipedia.org/wiki/Okapi_BM25)