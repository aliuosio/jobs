# Implementation Plan: LLM-based Unified Field Classification

## Overview

Replace the two-step pipeline (regex classifier + LLM generator) with a single LLM call that both classifies field type semantically AND extracts/generates the appropriate value, returning structured JSON.

## Phase 1: Backend - Core Implementation

### Task 1.1: Update API Response Schema

**Files to modify:**
- `src/api/schemas.py` - Add new fields to AnswerResponse

**Changes:**
- Add `field_type: str | None`
- Add `field_value: str | None`  
- Add `confidence: ConfidenceLevel` (already exists)
- Keep `answer` for backwards compatibility

**Estimation**: 1 hour

---

### Task 1.2: Create LLM Classification Prompt

**Files to create/modify:**
- `src/services/generator.py` - Add classification prompt method

**Changes:**
- Add system prompt for structured output
- Create `classify_and_extract()` method
- Use `response_format={"type": "json_object"}`

**Estimation**: 2 hours

---

### Task 1.3: Implement Confidence Calculation

**Files to modify:**
- `src/services/retriever.py` or `src/api/routes.py`

**Changes:**
- Calculate confidence from Qdrant scores
- Consider exact match vs partial match vs generated
- Return confidence in response

**Estimation**: 1 hour

---

### Task 1.4: Add Fallback Logic

**Files to modify:**
- `src/api/routes.py` - Update fill_form endpoint

**Changes:**
- Add try-catch for LLM failures
- Use regex classifier as fallback
- Handle malformed JSON responses

**Estimation**: 2 hours

---

### Task 1.5: Test Endpoint

**Verification:**
- Test with curl: label "Email" → returns field_type=email
- Test multilanguage: "Vorname" → field_type=first_name
- Test confidence levels
- Test fallback on LLM failure

**Estimation**: 1 hour

## Phase 2: Extension Update (Post-Backend)

### Task 2.1: Update Extension Response Handling

**Files to modify (extension):**
- `extension/content/api-client.js`
- `extension/content/field-filler.js`

**Changes:**
- Use new `field_type` + `field_value` if available
- Fallback to `answer` for backwards compatibility
- Add confidence-based decision logic

**Estimation**: 2 hours

---

### Task 2.2: Test Extension Integration

**Verification:**
- Fill form on test page
- Verify fields fill correctly
- Check confidence-based behavior

**Estimation**: 1 hour

## Implementation Order

```
Phase 1 (Backend):
├── 1.1 Update Response Schema (1h)
├── 1.2 LLM Classification Prompt (2h) ← CRITICAL PATH
├── 1.3 Confidence Calculation (1h)
├── 1.4 Fallback Logic (2h)
└── 1.5 Test Endpoint (1h)

Phase 2 (Extension):
├── 2.1 Update Extension (2h)
└── 2.2 Test Integration (1h)

Total: 10 hours
```

## Key Decisions from Research

1. **JSON Output**: Use `response_format={"type": "json_object"}`
2. **Confidence**: Based on Qdrant score + exact match detection
3. **Fallback**: Keep regex classifier for LLM failures
4. **Backward Compat**: Keep `answer` field, add new fields

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLM returns invalid JSON | Fallback to text answer generation |
| Rate limit during implementation | Use retry with exponential backoff |
| Response schema breaking change | Extension update planned separately |
| Multi-language accuracy | Test with German, French, Spanish labels |

## Files Modified Summary

### Backend

| File | Changes |
|------|---------|
| `src/api/schemas.py` | Add field_type, field_value fields |
| `src/api/routes.py` | Update fill_form flow |
| `src/services/generator.py` | Add classify method |

### Extension (Phase 2)

| File | Changes |
|------|---------|
| `extension/content/api-client.js` | Handle new response |
| `extension/content/field-filler.js` | Use field_value if available |

## Success Criteria Validation

- [ ] Simple fields (email): returns field_type + value
- [ ] German labels: correctly classified
- [ ] Confidence levels: high/medium/low/none work
- [ ] LLM failure: fallback to regex works
- [ ] Malformed JSON: fallback to text answer