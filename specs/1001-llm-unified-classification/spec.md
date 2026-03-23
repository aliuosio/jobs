# Feature Specification: LLM-based Unified Field Classification

**Feature Branch**: `1001-llm-unified-classification`  
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: User description: "Refactor the backend pipeline to use LLM for field classification and value extraction in a single call, instead of the current separate regex-based field_classifier.py. The LLM should receive context chunks + form label and return structured JSON with field_type, value, and confidence."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Form field filling with LLM classification (Priority: P1)

A user fills out a job application form on a website. The Firefox extension sends the field label to the backend API. The backend uses an LLM to both classify the field type semantically and extract or generate the appropriate value from resume data, returning a structured response.

**Why this priority**: This is the core functionality of the entire system. The current approach uses brittle regex patterns that fail on non-English labels, new field types, or ambiguous field names. An LLM can understand semantics and handle edge cases.

**Independent Test**: Can be tested by sending a form label (e.g., "What is your email?", "Vorname", "Contact Number") to the API and verifying it returns correct field_type and value from the resume.

**Acceptance Scenarios**:

1. **Given** resume data exists in Qdrant, **When** API receives label "Email Address", **Then** returns field_type "email" with extracted email value and confidence "high"
2. **Given** resume data exists, **When** API receives label "Vorname" (German for first name), **Then** returns field_type "first_name" with extracted first name
3. **Given** resume data exists, **When** API receives label "Tell us about yourself", **Then** returns field_type "unknown" with LLM-generated answer from context chunks and confidence based on chunk relevance
4. **Given** no resume data in Qdrant, **When** API receives any label, **Then** returns has_data=false with appropriate message

---

### User Story 2 - Multi-language field detection (Priority: P2)

Users apply to jobs in different countries with forms in various languages (German, French, English, etc.). The LLM should classify field types regardless of language.

**Why this priority**: The current regex-based classifier only supports English (and limited German). Users applying to jobs in Europe need multi-language support without adding和维护数百个模式.

**Independent Test**: Can be tested with labels in different languages and verify correct field type detection.

**Acceptance Scenarios**:

1. **Given** resume data exists, **When** API receives German label "Nachname", **Then** returns field_type "last_name"
2. **Given** resume data exists, **When** API receives French label "Numéro de téléphone", **Then** returns field_type "phone"
3. **Given** resume data exists, **When** API receives Spanish label "Ciudad", **Then** returns field_type "city"

---

### User Story 3 - Confidence-based fallback handling (Priority: P3)

The API should clearly indicate confidence level so the extension can make informed decisions about whether to auto-fill or prompt the user.

**Why this priority**: Users trust the system more when they know when it's uncertain. High-confidence extractions can be auto-filled; low-confidence should prompt for review.

**Independent Test**: Can be tested by requesting fields with varying levels of data availability and verifying confidence levels.

**Acceptance Scenarios**:

1. **Given** exact field match in resume (e.g., email), **When** API processes request, **Then** confidence is "high"
2. **Given** partial match in resume (e.g., similar field), **When** API processes request, **Then** confidence is "medium" or "low"
3. **Given** no relevant data in resume, **When** API processes request, **Then** confidence is "none" and has_data=false

---

### Edge Cases

- What happens when LLM returns malformed JSON? → Fall back to plain-text answer generation
- How does system handle extremely long context (> max tokens)?
- What if LLM API is unavailable (rate limit, network error)? → Use regex classifier as fallback for known field types
- How to handle ambiguous field labels that could match multiple types?
- What about fields that should NOT be filled (password reset links, referral codes)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The API MUST accept form field labels and optional signals (autocomplete, html_type) as input
- **FR-002**: The API MUST use a single LLM call to classify field type AND extract/generate value
- **FR-003**: The API MUST return structured JSON with fields: field_type, field_value, confidence, has_data
- **FR-004**: The API MUST handle multi-language field labels without explicit language detection
- **FR-005**: The system MUST update API response schema - extension update required (breaking change)
- **FR-006**: The API MUST provide confidence level (high/medium/low/none) based on data match quality
- **FR-007**: The system MUST handle LLM API failures gracefully with appropriate error messages
- **FR-008**: The API MUST NOT fabricate information not present in retrieved context (anti-hallucination)
- **FR-009**: Response time MUST remain under 5 seconds for typical requests (existing performance requirement)
- **FR-010**: The system SHOULD keep regex-based classifier as fallback when LLM fails
- **FR-011**: For ambiguous field labels, system MUST attempt contextual answer generation (always generate answer, confidence indicates reliability)
- **FR-012**: When LLM returns malformed JSON, system MUST fall back to plain-text answer generation using same context

### Key Entities *(include if feature involves data)*

- **Field Classification Request**: Contains label, optional signals (autocomplete, html_type, input_name)
- **Field Classification Response**: Contains field_type, field_value, confidence, has_data, context_chunks_used
- **Resume Context**: Retrieved text chunks from Qdrant vector store
- **Confidence Score**: Enum (high, medium, low, none) indicating extraction reliability

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully fill forms with 90%+ accuracy for common fields (name, email, phone, address) across all languages
- **SC-002**: Field classification latency remains under 5 seconds (authoritative target from FR-009)
- **SC-003**: 95% of valid field labels return a field_type classification (not "unknown")
- **SC-004**: System handles 100 concurrent form-filling requests without degradation
- **SC-005**: False positive auto-filling is reduced by implementing confidence-based thresholds

---

### Assumptions

- Mistral API (or configured LLM) remains the provider for both embedding and generation
- Qdrant vector store continues to store resume data in current format
- Firefox extension WILL require update to support new response schema (field_type + value instead of answer string)
- Maximum context length: 8K tokens (Mistral small limit)
- Rate limits from LLM provider are handled with retry logic and user feedback
- Breaking change: Extension must be updated to use new field_type + value response format

---

## Clarifications

### Session 2026-03-23

- Q: Latency target (FR-009 5s vs SC-002 3s)? → A: FR-009 (5 seconds) authoritative - more realistic for LLM operations
- Q: Handle ambiguous field labels? → A: Always generate answer (current behavior) - confidence indicates reliability
- Q: Backward compatibility FR-005? → A: Replace response format (breaking change) - requires extension update
- Q: Malformed JSON recovery? → A: Fall back to plain-text answer generation using same context
- Q: Keep regex classifier? → A: Keep as fallback when LLM fails (rate limit, network error)