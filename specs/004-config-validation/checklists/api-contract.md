# API Contract Requirements Quality Checklist

**Purpose**: Lightweight pre-commit sanity check for API contract completeness
**Created**: 2026-03-09
**Focus**: API Contract Completeness (endpoint spec, request/response formats, error handling)
**Actor**: Author (pre-commit)
**Depth**: Lightweight

---

## Endpoint Specification

- [ ] CHK001 Is the HTTP method explicitly specified for the `/validate` endpoint? [Completeness, Spec §FR-001]
- [ ] CHK002 Is the endpoint path explicitly documented with no ambiguity? [Clarity, Contract §Request]
- [ ] CHK003 Are all supported request headers documented (including optional vs required)? [Completeness, Contract §Headers]
- [ ] CHK004 Are query parameters explicitly stated as "None" if not applicable? [Clarity, Contract §Query Parameters]

## Request Specification

- [ ] CHK005 Is the request body specification explicit (or stated as "None" for GET)? [Clarity, Contract §Request Body]
- [ ] CHK006 Are any required authentication/authorization headers specified? [Completeness, Gap]

## Response Specification - Success

- [ ] CHK007 Is the success status code explicitly defined? [Completeness, Contract §Response]
- [ ] CHK008 Are all response headers specified (including Content-Type)? [Completeness, Contract §Headers]
- [ ] CHK009 Is the response body structure fully defined with field types? [Clarity, Contract §Response Body]
- [ ] CHK010 Are all fields in the response body documented with descriptions? [Completeness, Contract §Response Body]
- [ ] CHK011 Is the timestamp format explicitly specified (ISO 8601)? [Clarity, Contract §Response Body]
- [ ] CHK012 Is the `status` field enum explicitly defined with all valid values? [Completeness, Contract §Response Body]

## Check Result Structure

- [ ] CHK013 Are all fields in the `checks[]` array defined with types? [Completeness, Contract §Response Body]
- [ ] CHK014 Is the `name` field enum explicitly defined with all check names? [Completeness, Contract §Response Body]
- [ ] CHK015 Is the `status` field enum explicitly defined with all valid values? [Completeness, Contract §Response Body]
- [ ] CHK016 Is the `duration_ms` field type and range specified? [Clarity, Contract §Response Body]
- [ ] CHK017 Is the `details` field type specified (object or null)? [Clarity, Contract §Response Body]

## Error Handling Requirements

- [ ] CHK018 Are error response scenarios explicitly documented? [Completeness, Contract §Error Responses]
- [ ] CHK019 Is it clear that HTTP 200 is returned even on validation failure? [Clarity, Contract §Error Responses]
- [ ] CHK020 Are HTTP error codes (500, 503) specified for server-side issues? [Completeness, Contract §Error Responses]
- [ ] CHK021 Is the distinction between validation failure (200) and server error (5xx) clear? [Clarity, Contract §Error Responses]

## Timeout Behavior Requirements

- [ ] CHK022 Is the timeout behavior explicitly specified in the contract? [Completeness, Contract §Timeout Example]
- [ ] CHK023 Is the timeout status value explicitly defined? [Clarity, Contract §Response Body]
- [ ] CHK024 Is the timeout duration (10 seconds) documented? [Clarity, Spec §FR-009]
- [ ] CHK025 Are timeout error details specified in the contract? [Completeness, Contract §Timeout Example]

## Check Dependency Requirements

- [ ] CHK026 Is the dependency between checks documented (US4 depends on US1)? [Clarity, Spec §FR-009]
- [ ] CHK027 Is the skipped check behavior explicitly specified? [Completeness, Contract §Failed Validation]
- [ ] CHK028 Is the `skipped` flag in details explicitly defined? [Completeness, Contract §Response Body]
- [ ] CHK029 Is the `reason` field for skipped checks documented? [Completeness, Contract §Response Body]

## Individual Check Details Requirements

- [ ] CHK030 Are error details for `internal_dns` check explicitly defined? [Completeness, Contract §Failed Validation]
- [ ] CHK031 Are error details for `external_endpoint` check explicitly defined? [Gap]
- [ ] CHK032 Are error details for `url_format` check explicitly defined? [Gap]
- [ ] CHK033 Are error details for `embedding_dimensions` check explicitly defined? [Completeness, Contract §Response Body]

## CORS Requirements

- [ ] CHK034 Are CORS requirements explicitly documented in the contract? [Completeness, Contract §CORS]
- [ ] CHK035 Are allowed origins explicitly specified? [Clarity, Contract §CORS]
- [ ] CHK036 Are allowed HTTP methods explicitly specified? [Clarity, Contract §CORS]
- [ ] CHK037 Is credentials behavior specified? [Completeness, Contract §CORS]

## Consistency Checks

- [ ] CHK038 Is the check execution order consistent between spec and contract? [Consistency, Spec §FR-009 vs Contract]
- [ ] CHK039 Are field names consistent between success and error responses? [Consistency, Contract §Example Responses]
- [ ] CHK040 Is the timeout behavior consistent between spec (FR-009) and contract examples? [Consistency, Spec §FR-009 vs Contract]

## Measurability

- [ ] CHK041 Can the 10-second timeout requirement be objectively measured? [Measurability, Spec §FR-009]
- [ ] CHK042 Can the "read-only" constraint (FR-008) be verified from the spec? [Measurability, Spec §FR-008]
- [ ] CHK043 Can the HTTP 200 response requirement be objectively tested? [Measurability, Contract §Response]

## Edge Cases & Gaps

- [ ] CHK044 Is behavior defined when multiple checks fail simultaneously? [Gap]
- [ ] CHK045 Is behavior defined when validation is called concurrently? [Gap]
- [ ] CHK046 Is the response size limit defined for large error details? [Gap]
- [ ] CHK047 Are rate limiting requirements specified for the `/validate` endpoint? [Gap]

---

## Summary

**Total Items**: 47
**Focus Areas**: Endpoint spec, Request/Response format, Error handling, Timeout behavior, Check dependencies, CORS
**Traceability**: 100% (all items reference Spec or Contract sections)

**Quick Wins** (most common gaps):
- CHK031, CHK032: Error details for external_endpoint and url_format checks
- CHK044-047: Concurrent calls, multiple failures, response size, rate limiting
