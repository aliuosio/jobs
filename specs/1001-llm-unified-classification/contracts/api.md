# Contracts: LLM-based Unified Field Classification

## API Contract: /fill-form

### Request Schema

```typescript
interface FillFormRequest {
  label: string;                    // Form field label text
  signals?: {
    autocomplete?: string;          // HTML autocomplete attribute
    html_type?: string;             // HTML input type
    input_name?: string;            // Input name attribute
  };
}
```

### Response Schema

```typescript
interface FillFormResponse {
  has_data: boolean;                // Whether data was found
  confidence: "high" | "medium" | "low" | "none";  // Extraction reliability
  field_type: string | null;        // Semantic field type (e.g., "email")
  field_value: string | null;       // Extracted value (if known type)
  answer: string;                   // LLM-generated answer (backwards compatible)
  context_chunks: number;           // Number of chunks used
}
```

### HTTP Contract

| Aspect | Value |
|--------|-------|
| Method | POST |
| Path | /fill-form |
| Content-Type | application/json |
| Auth Required | No |
| Rate Limit | Per LLM provider limits |

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request (missing label) |
| 413 | Payload exceeds 10KB |
| 500 | Internal server error |
| 503 | Service unavailable (LLM/API failure) |

### Error Response Schema

```typescript
interface ErrorResponse {
  detail: string;                   // Error message
}
```

## Field Type Enumeration

| Field Type | Description | Example |
|------------|-------------|---------|
| first_name | First/given name | "John" |
| last_name | Last/family name | "Doe" |
| full_name | Full name | "John Doe" |
| email | Email address | "john@example.com" |
| phone | Phone number | "+49 123 456789" |
| birthdate | Date of birth | "1990-01-15" |
| city | City | "Hamburg" |
| street | Street address | "Main St 123" |
| zip / postcode | Postal code | "22399" |
| country | Country | "Germany" |
| github | GitHub URL/username | "github.com/john" |
| linkedin | LinkedIn URL | "linkedin.com/in/john" |
| url | Generic URL | "https://..." |
| unknown | Unknown field type | (LLM generates answer) |

## Confidence Calculation

```typescript
function calculateConfidence(
  avgScore: number,      // Qdrant similarity score (0-1)
  hasExactMatch: boolean, // Exact field in payload
  hasPartialMatch: boolean // Partial/reconstructed match
): ConfidenceLevel {
  if (avgScore >= 0.8 && hasExactMatch) return "high";
  if (avgScore >= 0.5) return "medium";
  if (avgScore >= 0.3 || hasPartialMatch) return "low";
  return "none";
}
```

## Backwards Compatibility

The new response maintains the existing `answer` field for backwards compatibility. Extension can use either:
- New: `field_type` + `field_value` for structured extraction
- Legacy: `answer` string for display/filling