# Research: LLM-based Unified Field Classification

## Research Questions

### RQ1: How to get structured JSON output from Mistral API?

**Decision**: Use Mistral's `chat.parse()` with Pydantic model OR `response_format={"type": "json_object"}`

**Rationale**: 
- Mistral supports structured outputs via `response_format` parameter
- The openai-compatible client (used in project) supports `response_format={"type": "json_object"}`
- For strict schema enforcement, can use Pydantic models with the native Mistral client
- Current project uses OpenAI client → `response_format={"type": "json_object"}` is simplest

**Alternatives considered**:
- Function calling: More complex, requires tool definitions
- Pydantic with native client: Requires switching from OpenAI client (breaking change)
- Manual JSON parsing: Less reliable, needs retry logic

---

### RQ2: How to compute confidence level from Qdrant scores?

**Decision**: Use average cosine similarity score + chunk count heuristic

**Rationale**:
- Qdrant returns `score` (cosine similarity 0-1) for each retrieved chunk
- High confidence: score >= 0.8 AND exact field match in payload
- Medium confidence: score >= 0.5 OR partial match
- Low confidence: score >= 0.3 OR LLM-generated answer
- None: no chunks retrieved OR score < 0.3

**Implementation**:
```
avg_score = sum(chunks[i].score for i in chunks) / len(chunks)
if avg_score >= 0.8 and exact_match:
    confidence = HIGH
elif avg_score >= 0.5:
    confidence = MEDIUM  
elif avg_score >= 0.3:
    confidence = LOW
else:
    confidence = NONE
```

---

### RQ3: Schema for new API response

**Decision**: 
```json
{
  "has_data": boolean,
  "confidence": "high" | "medium" | "low" | "none",
  "field_type": string | null,
  "field_value": string | null,
  "answer": string,  // Backwards compatible - LLM generated text
  "context_chunks": number
}
```

**Rationale**:
- Maintains backwards compatibility with `answer` field
- Adds new structured fields: `field_type`, `field_value`, `confidence`
- Confidence enum matches spec requirements

---

### RQ4: LLM prompt structure for classification + extraction

**Decision**: Single prompt with JSON output instructions

**Prompt structure**:
```
System: You are a resume field classifier. Analyze the form field label 
and resume context. Return JSON with field_type, field_value, and confidence.

Context from resume:
{context_chunks}

Form field label: {label}
HTML signals: {signals}

Return JSON:
{
  "field_type": "email" | "first_name" | "last_name" | "phone" | "...",
  "field_value": "extracted value or null",
  "confidence": "high" | "medium" | "low" | "none",
  "answer": "generated answer text"
}
```

**Rationale**:
- Single LLM call does both classification and extraction
- Combine context with label for semantic understanding
- JSON output mode ensures valid JSON response

---

### RQ5: Fallback strategy when LLM fails

**Decision**: Keep regex-based field_classifier.py as fallback

**Rationale**:
- Already implemented and tested
- Works for known field types (email, phone, name patterns)
- Provides degraded service during LLM outages
- Minimal overhead (only runs on LLM failure)

**Flow**:
```
1. Try LLM classification + extraction
2. If LLM fails (rate limit, network error):
   - Use regex classifier for known autocomplete signals
   - Extract direct field values from payload
   - Return with confidence=medium (less reliable)
```

---

## Conclusion

All research questions resolved. Key decisions:
1. Use `response_format={"type": "json_object"}` for JSON output
2. Confidence based on Qdrant scores + field match type
3. Response schema maintains backwards compatibility
4. Single prompt for classification + extraction
5. Regex fallback preserved for LLM failures