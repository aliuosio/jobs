# Data Model: LLM-based Unified Field Classification

## Entities

### FieldClassificationRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| label | string | Yes | Form field label text (e.g., "Email Address", "Vorname") |
| signals | object | No | Optional signals from form field |
| signals.autocomplete | string | No | HTML autocomplete attribute value |
| signals.html_type | string | No | HTML input type (email, tel, text) |
| signals.input_name | string | No | Input name attribute |

---

### FieldClassificationResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| has_data | boolean | Yes | Whether relevant data was found |
| confidence | enum | Yes | Extraction reliability: high, medium, low, none |
| field_type | string/null | Yes | Classified semantic type (e.g., "email", "first_name") |
| field_value | string/null | Yes | Directly extracted value (if known field type) |
| answer | string | Yes | LLM-generated answer text (backwards compatible) |
| context_chunks | integer | Yes | Number of chunks used for context |

**Confidence Levels:**
- `high`: Exact field match (e.g., email found in profile)
- `medium`: Partial match or reconstructed value
- `low`: LLM-generated from similar context
- `none`: No relevant data found

---

### ResumeContext

| Field | Type | Description |
|-------|------|-------------|
| chunks | array | Retrieved text chunks from Qdrant |
| chunk.score | float | Cosine similarity (0-1) |
| chunk.payload | object | Resume data: profile, text, etc. |

---

## Validation Rules

### Request Validation
- `label`: Required, non-empty string, max 500 chars
- `signals`: Optional object
- `signals.autocomplete`: If present, must be valid autocomplete value
- `signals.html_type`: If present, must be valid HTML input type

### Response Validation
- `has_data`: boolean (true/false)
- `confidence`: Must be one of: high, medium, low, none
- `field_type`: If `has_data=true`, should not be null
- `field_value`: Can be null for unknown field types
- `answer`: Required, non-empty string
- `context_chunks`: >= 0

---

## State Transitions

### Field Classification Flow

```
Request Received
      │
      ▼
┌─────────────────┐
│ Embed Label     │
│ (Mistral)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retrieve Context│
│ (Qdrant)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM Classify    │
│ + Extract       │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Success │
    └────┬────┘
         │
         ▼
    Response
```

### Fallback Flow (LLM Failure)

```
LLM Call Fails
      │
      ├─→ Rate Limit → Use Regex Classifier
      ├─→ Network Error → Use Regex Classifier  
      └─→ Parse Error → Fallback to text answer
         │
         ▼
    Regex Classification (if signals present)
         │
         ▼
    Direct Payload Extraction
         │
         ▼
    Response (confidence=medium)
```

---

## Relationships

- **FieldClassificationRequest** → **FieldClassificationResponse** (1:1)
- **FieldClassificationResponse** → **ResumeContext** (1:N chunks)
- **FieldClassificationResponse** → **ConfidenceLevel** (enum)

---

## API Endpoint

### POST /fill-form

**Request:**
```json
{
  "label": "Email Address",
  "signals": {
    "autocomplete": "email",
    "html_type": "email"
  }
}
```

**Response:**
```json
{
  "has_data": true,
  "confidence": "high",
  "field_type": "email",
  "field_value": "john@example.com",
  "answer": "john@example.com",
  "context_chunks": 1
}
```