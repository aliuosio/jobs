# Research Summary: Export Applied Jobs as CSV

## Technical Context Analysis
Based on the feature specification and codebase review:

- **Backend**: Python 3.11+ with FastAPI, asyncpg, Pydantic
- **Frontend**: Firefox extension with JavaScript ES6+
- **Storage**: PostgreSQL with existing `job_offers` and `job_offers_process` tables
- **CSV Export**: UTF-8 with BOM, comma delimiter, proper escaping for Excel/Google Sheets compatibility

## Key Findings from Codebase

### 1. Existing API Patterns
- REST endpoints in `src/api/routes.py` follow async pattern
- Pydantic schemas in `src/api/schemas.py` for request/response validation
- Service layer in `src/services/job_offers.py` handles database operations
- Existing `GET /job-offers` returns JSON list of job offers

### 2. Extension UI Patterns
- Popup HTML/CSS in `extension/popup/`
- JavaScript event handlers in `popup.js`
- Existing button styling with `.btn`, `.btn-small` classes
- Refresh section already contains checkbox + Refresh Jobs button

### 3. CSV Generation Options
- **Backend generation**: API returns CSV directly with proper headers
- **Frontend generation**: API returns JSON, frontend converts to CSV client-side
- **Decision**: Backend generation (per spec requirements)

## Decisions Made

### CSV Format
**Decision**: UTF-8 with BOM for Excel compatibility, comma delimiter, RFC 4180 compliant escaping
**Rationale**:
- Excel compatibility is critical for job seekers sharing data
- BOM ensures correct encoding in Windows Excel
- RFC 4180 is the standard for CSV files
**Alternatives Considered**:
- UTF-8 without BOM: Excel may misinterpret character encoding
- Tab delimiter: Less universally supported than CSV

### API Format Parameter
**Decision**: Query parameter `?format=json|csv` on existing `/job-offers` endpoint
**Rationale**:
- Maintains single endpoint for both use cases
- Default to JSON for backward compatibility
- Simple implementation with query parameter validation
**Alternatives Considered**:
- Separate `/job-offers/export` endpoint: Duplicates code path
- Request header `Accept: text/csv`: More complex for extension to implement

### CSV Columns
**Decision**: `company,email,company_url,title,url,posted`
**Rationale**:
- These are the fields in the `job_offers` table (plus extensions)
- Excludes `applied` column since all exported jobs are applied (per clarification)
- Simple flat structure suitable for spreadsheet analysis
**Alternatives Considered**:
- Include `applied` column: Redundant since all exports are applied jobs

### Filter for Export
**Decision**: Export only jobs where `applied: true`, regardless of UI filter state
**Rationale**:
- "Export Applied" button implies exporting applied jobs
- Users can use "Show Applied" checkbox to see which jobs will be exported
- Simplifies button behavior and user expectations

### Filename Format
**Decision**: `applied-jobs-{YYYY-MM-DD}T{HHMMSS}.csv`
**Rationale**:
- ISO 8601 format for universal readability
- No spaces or special characters for cross-platform compatibility
- Timestamp helps users identify export date
**Alternatives Considered**:
- Date only: Loses time information
- UUID suffix: Less human-readable

### Button State During Loading
**Decision**: Button disabled during API call to prevent double-clicks
**Rationale**:
- Prevents accidental multiple downloads
- Clear visual feedback that action is in progress
- Matches existing patterns for async operations in extension

## References
- FastAPI Response Media Types: https://fastapi.tiangolo.com/advanced/response-change-status-code/
- RFC 4180 CSV Standard: https://tools.ietf.org/html/rfc4180
- Firefox Extension Download API: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads/download
- Existing patterns in `src/api/routes.py`
- Existing patterns in `extension/popup/popup.js`
