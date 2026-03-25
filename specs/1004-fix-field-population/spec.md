# Feature Specification: Fix Hybrid Search Field Population Bug

**Feature Branch**: `1004-fix-field-population`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Fix hybrid search field population bug - form fields showing 'unknown' and '[Pasted ~1 lines]' instead of actual profile data"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Form field population with profile data (Priority: P1)

A user fills out a job application form using the browser extension. When they click "Fill All Fields", the system correctly populates each form field with the corresponding value from their stored profile data (first name, last name, email, city, postcode, street).

**Why this priority**: This is the core functionality of the Job Forms Helper - users expect their profile data to be automatically populated into form fields.

**Independent Test**: Can be tested by calling the `/fill-form` endpoint with various field labels and verifying the response contains the correct field_value from the profile data.

**Acceptance Scenarios**:

1. **Given** user has profile data stored in Qdrant with firstname="Osiozekha", lastname="Aliu", email="aliu@dev-hh.de", **When** API receives label="First Name", **Then** response contains field_value="Osiozekha"
2. **Given** user has profile data stored in Qdrant, **When** API receives label="Email" with signals={"autocomplete": "email"}, **Then** response contains field_value="aliu@dev-hh.de"
3. **Given** user has profile data stored in Qdrant with city="Hamburg", postcode="22399", **When** API receives label="City" and "Postcode", **Then** responses contain correct city and postcode values

---

### User Story 2 - Hybrid search compatibility (Priority: P1)

While preserving the hybrid search functionality (vector + BM25), the system must correctly identify and include the profile chunk in the context sent to the LLM for field extraction.

**Why this priority**: The hybrid search feature was added to improve search quality for domain-specific terms. The fix must not disable or degrade this functionality.

**Independent Test**: Can be tested by verifying hybrid search returns relevant chunks AND profile chunk is included for direct field extraction.

**Acceptance Scenarios**:

1. **Given** hybrid search is enabled (HYBRID_ENABLED=true), **When** API receives query for generic field label like "Email", **Then** system fetches profile chunk separately and includes it for field extraction
2. **Given** hybrid search returns text chunks about domain-specific terms, **When** field type is known (from signals), **Then** direct field extraction from profile data takes precedence over LLM answer
3. **Given** HYBRID_VECTOR_WEIGHT=1.0 (pure vector mode), **When** API processes form field request, **Then** field population still works correctly

---

### User Story 3 - Graceful handling of missing profile data (Priority: P2)

When no profile data exists in Qdrant, the system should handle this gracefully by returning appropriate fallback behavior instead of incorrect placeholder values.

**Why this priority**: Users without profile data should receive clear feedback, not confusing placeholder values like "unknown".

**Independent Test**: Can be tested by clearing profile data from Qdrant and verifying the API returns appropriate has_data=false response.

**Acceptance Scenarios**:

1. **Given** no profile chunk exists in Qdrant, **When** API receives any form field request, **Then** response has has_data=false
2. **Given** profile chunk exists but missing specific field (e.g., no street address), **When** API requests that field, **Then** response contains null field_value but has_data=true (based on other fields)

---

### Edge Cases

- What happens when profile chunk exists but has empty/null values for some fields (e.g., no street address)?
- How does the system handle when Qdrant is unavailable during profile chunk fetch?
- What if signals contain conflicting information (e.g., autocomplete="email" but label says "Phone")?
- How does the system behave when hybrid search returns empty results but profile chunk exists?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `/fill-form` endpoint MUST include the profile chunk in search results for direct field extraction (regardless of hybrid search being enabled or disabled)
- **FR-002**: The system MUST call `retriever.get_profile_chunk()` and insert the profile chunk at the beginning of the chunks list before LLM classification
- **FR-003**: For known field types (detected via signals autocomplete attributes), the system MUST attempt direct field extraction using `_extract_direct_field_value()` before falling back to LLM classification
- **FR-004**: The system MUST return the extracted field_value in the response when direct extraction succeeds, with confidence=HIGH
- **FR-005**: The hybrid search functionality (BM25 + vector combination with phrase bonus) MUST remain fully functional after this fix
- **FR-006**: The system MUST maintain backward compatibility with existing API response schema
- **FR-007**: Response time for field population MUST remain under 800ms (including profile chunk fetch)
- **FR-008**: If profile chunk fetch fails (Qdrant unavailable), the system MUST return an error response
- **FR-009**: The system MUST include profile data in LLM context (beyond direct extraction) to improve answer quality
- **FR-010**: The system MUST NOT return "unknown" as a field_value for known field types when profile data exists

### Key Entities *(include if feature involves data)*

- **Profile Chunk**: Qdrant point containing user's personal data (firstname, lastname, email, phone, address). Type identifier: "p" or has "profile" key in payload.
- **Search Results**: List of chunks returned by hybrid search, used for both LLM context and direct field extraction
- **Classification Result**: LLM response containing field_type, field_value, confidence, and answer
- **Field Signals**: Form field metadata (autocomplete, label_text, html_type) used for field type classification

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six core fields (firstname, lastname, email, city, postcode, street) return correct field_value from profile data with 100% accuracy
- **SC-002**: Field population works correctly with HYBRID_ENABLED=true and HYBRID_ENABLED=false (backward compatibility)
- **SC-003**: No "unknown" placeholder values appear in form fields when profile data exists
- **SC-004**: API response time remains under 800ms (including profile chunk fetch overhead)
- **SC-005**: All existing tests pass with the fix applied

---

### Assumptions

- Qdrant contains a profile chunk with type "p" or containing "profile" key in payload
- Profile chunk follows the schema defined in .prompts/resume-import.md
- Extension sends signals with autocomplete attribute when available
- LLM-based classification continues to work for non-profile fields
- The existing `_extract_direct_field_value()` function in routes.py works correctly

---

## Clarifications

### Session 2026-03-25

- Q: How should the profile chunk be identified in Qdrant? → A: Filter by type='p' (use type filter in scroll query)
- Q: What response time target should apply? → A: Extend to 800ms (to account for profile fetch overhead)
- Q: If the profile chunk fetch fails (Qdrant unavailable), what should happen? → A: Return error response
- Q: Should the fix include logging or metrics to track extraction method? → A: Skip observability (no additional logging/metrics)
- Q: Should the fix also include profile data in LLM context? → A: Include LLM improvement (profile data in context beyond direct extraction)

### Session 2026-03-25 (Root Cause Analysis)

- **Root Cause**: The `/fill-form` endpoint no longer fetches the profile chunk after hybrid search implementation. The `_extract_direct_field_value()` function exists in routes.py but is never called. This was a regression from the LLM-based unified field classification refactoring.

- **Why "unknown" appears**: The LLM generates "unknown" as the answer when it cannot find the field value in the provided context (which lacks the profile data). This is NOT hardcoded in Python.

- **Why "[Pasted ~1 lines]" appears**: Not found in codebase - likely generated by LLM as placeholder text when context lacks proper data. Will be resolved by the same fix.

- **Fix approach**: Restore profile chunk inclusion that was removed during LLM-based classification refactoring. This is NOT a hybrid search bug - it's a data retrieval regression.

---

## Root Cause Analysis (Technical Details)

### Problem Location
- **File**: `src/api/routes.py`
- **Function**: `fill_form()` (lines 108-203)
- **Issue**: Profile chunk fetch removed during commit CDC9CB6

### Data Flow Before (Working)
```
fill_form()
  → search()
  → _extract_direct_field_value(chunks)
  → if null: get_profile_chunk()
  → chunks.insert(0, profile_chunk)
  → field_value = extract(profile_chunk)
  → return field_value
```

### Data Flow After (Broken)
```
fill_form()
  → hybrid_search()
  → _assemble_context(chunks)  ← Only text chunks, no profile
  → classify_and_extract()     ← LLM sees no profile data
  → returns field_value=null, answer="unknown"
```

### Evidence
- Profile chunk exists in Qdrant (ID: 0fe5cc49-b749-4ca5-92f9-0f12ba6973dc)
- Search for "email" returns text chunks, NOT profile chunk
- Search for "Osiozekha Aliu email" returns profile chunk (score 0.764)
- `_extract_direct_field_value()` exists but is never called

---

## Suggested Fix

### Code Changes Required

In `src/api/routes.py`, after the chunks retrieval (around line 136), add:

```python
# CRITICAL: Include profile chunk for direct field extraction
profile_chunk = await retriever.get_profile_chunk()
if profile_chunk:
    chunks.insert(0, profile_chunk)
    chunk_count = len(chunks)  # Update count

# For known field types, try direct extraction first
field_type = classify_field_type(signals) if signals else None
if field_type:
    field_value = _extract_direct_field_value(chunks, field_type)
    if field_value:
        # Direct extraction succeeded - use it
        # ... return early with field_value populated
```

This preserves hybrid search functionality while ensuring profile data is available for field extraction.