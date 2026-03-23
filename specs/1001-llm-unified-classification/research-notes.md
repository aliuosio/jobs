# Research Notes: LLM-based Unified Field Classification

**Feature**: 1001-llm-unified-classification  
**Date**: 2026-03-23  
**Status**: Implementation Complete

---

## Executive Summary

This feature replaces the regex-based `field_classifier.py` with a single LLM call that classifies field types AND extracts values in one step, reducing pipeline redundancy and improving multi-language support.

---

## Key Decisions

### 1. JSON Output Strategy
**Decision**: `response_format={"type": "json_object"}` via OpenAI-compatible client

**Rationale**:
- Simplest implementation (no breaking changes)
- Mistral supports this natively
- No function calling complexity
- Single prompt for classification + extraction

**Implementation**: `src/services/generator.py` - `classify_and_extract()` method

---

### 2. Confidence Calculation
**Formula**: Combined score = Qdrant retrieval score × LLM confidence

**Thresholds**:
| Level | Condition |
|-------|-----------|
| HIGH | avg_score >= 0.8 AND exact field match |
| MEDIUM | avg_score >= 0.5 |
| LOW | avg_score >= 0.3 OR partial match |
| NONE | No chunks OR score < 0.3 |

**Implementation**: `src/api/routes.py` - `_combine_confidence()` function

---

### 3. Response Schema (Backwards Compatible)

```python
{
    "has_data": bool,
    "confidence": "high" | "medium" | "low" | "none",
    "field_type": str | None,
    "field_value": str | None,
    "answer": str,  # LLM text (backwards compat)
    "context_chunks": int
}
```

**Extension Compatibility**: `background.js` uses `field_value || answer` pattern

---

### 4. Multi-language Support
**Approach**: LLM handles natively

**Supported Labels**:
- German: "Nachname", "Vorname", "Telefon", "Geburtsdatum"
- French: "Numéro de téléphone", "Nom de famille"
- Spanish: "Ciudad", "Nombre"
- English: Standard field labels

**Verification**: German "Nachname" → `field_type="last_name"` ✓

---

### 5. Fallback Strategy
**When**: LLM rate limit (503), network error, malformed JSON

**Fallback**: Regex classifier from `field_classifier.py`

**Flow**:
1. Try LLM classification + extraction
2. On failure → use regex-based `classify_field_type()`
3. Extract via `extract_field_value_from_payload()`
4. Return with `confidence="medium"` (degraded)

---

## Field Type Enumeration

| Type | Patterns | Autocomplete |
|------|----------|--------------|
| full_name | name, full name | name |
| first_name | first name, given name | given-name |
| last_name | last name, surname | family-name |
| email | email, e-mail | email |
| phone | phone, tel, telefon | tel |
| birthdate | birthdate, dob, geburtsdatum | bday |
| city | city, town | address-level2 |
| street | street, address | street-address |
| zip | zip, postal | postal-code |
| country | country | country |
| github | github | url |
| linkedin | linkedin | url |

---

## Performance Requirements

| Metric | Target | Implementation |
|--------|--------|----------------|
| Response time | < 5s (FR-009) | Latency logged per request |
| Concurrent requests | 100 parallel | Deferred (T044) |
| Fallback activation | On LLM failure | Graceful degradation |

---

## References

- Original research: [research.md](./research.md)
- API contract: [contracts/api.md](./contracts/api.md)
- Implementation: `src/services/generator.py`, `src/api/routes.py`
- Fallback classifier: `src/services/field_classifier.py`
