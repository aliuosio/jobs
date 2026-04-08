# Data Model: Review JORM Filler and RAG System

## Entities Under Review

The code review examines these existing entities:

### FormField (API Input)

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| label | str | Required, max 10KB | Form field label text |
| signals | dict | Optional | {autocomplete, label_text, input_name, html_type} |

### AnswerResponse (API Output)

| Field | Type | Notes |
|-------|------|-------|
| answer | str | Generated answer |
| has_data | bool | Whether data was found |
| confidence | ConfidenceLevel | HIGH/MEDIUM/LOW/NONE |
| context_chunks | int | Number of chunks retrieved |
| field_value | str \| null | Direct field extraction |
| field_type | str \| null | Classified field type |

### ConfidenceLevel (Enum)

| Value | Meaning |
|-------|---------|
| HIGH | Strong retrieval match |
| MEDIUM | Moderate match |
| LOW | Weak match |
| NONE | No match found |

### RetrievedChunk (Internal)

| Field | Type | Notes |
|-------|------|-------|
| id | str | Qdrant point ID |
| score | float | Combined (hybrid) score |
| payload | dict | Profile/resume data |

## Relationships

```
AnswerRequest → embedder → RetrieverService → Qdrant → GeneratorService → AnswerResponse
                              ↓
                        ProfileChunk
                              ↓
                     FieldClassifier → field_value (if known type)
```

## Data Flow (Under Review)

1. **Input**: label + optional signals
2. **Embedding**: Mistral embed → 1024-dim vector
3. **Retrieval**: Qdrant hybrid_search → chunks with scores
4. **Profile**: get_profile_chunk from Qdrant
5. **Direct extraction**: FieldClassifier.extract_field_value_from_payload
6. **Generation**: LLM grounded in context

No modifications to data model - existing entities under review.