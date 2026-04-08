# Quickstart: Review JORM Filler and RAG System

## What This Is

A code review task to verify:
1. All fill-form answers come from Qdrant (no fallbacks)
2. RAG pipeline components are properly implemented
3. No hidden fallback patterns exist

## Files Under Review

| File | Purpose |
|------|---------|
| `src/api/routes.py` | `/fill-form` endpoint |
| `src/services/retriever.py` | Qdrant hybrid retrieval |
| `src/services/embedder.py` | Mistral embeddings |
| `src/services/generator.py` | LLM answer generation |
| `src/services/field_classifier.py` | Direct field extraction |
| `src/services/fill_form.py` | Confidence scoring |
| `src/config.py` | Settings |

## Review Checklist

### FR-001: Qdrant-only data source
- [ ] Verify ALL retrieval goes through Qdrant
- [ ] No alternative data sources in code paths

### FR-002: No fallbacks
- [ ] Check for hardcoded responses
- [ ] Check for default values used as fallback
- [ ] Check for LLM-only generation (no context)

### FR-003: No results handling
- [ ] Verify "no data available" when Qdrant returns empty
- [ ] Verify NONE confidence assigned correctly

### FR-004: Source attribution
- [ ] Verify chunks include source IDs
- [ ] Verify confidence scoring from retrieval quality

### Identified Fallback Pattern
- [ ] Review `retriever.py:137-138` - hybrid → vector fallback
- [ ] Determine if this is acceptable or should be removed

## How to Verify

```bash
# Start services
docker-compose up -d

# Test fill-form
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{"label": "What is your first name?"}'

# Check response has source attribution
# - answer contains data from Qdrant
# - has_data = true/false correctly
# - confidence reflects retrieval quality

# Check fallback on error (optional)
# - Force hybrid failure and observe behavior
```

## Expected Results

**Successful retrieval**:
- `answer`: Grounded in Qdrant data
- `has_data`: true
- `confidence`: HIGH/MEDIUM/LOW (based on retrieval quality)

**Empty/No results**:
- `answer`: "I don't have information about that in the resume."
- `has_data`: false
- `confidence`: NONE

## Findings Template

For each file under review, document:
1. **Code path**: Line numbers and function
2. **Verification**: Pass/Fail
3. **Issue**: Description if fail
4. **Recommendation**: Fix or document