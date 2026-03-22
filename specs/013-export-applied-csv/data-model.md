# Data Model: Export Applied Jobs as CSV

## Overview
This feature extends the existing job offers data model to support CSV export functionality. No changes to the database schema are required.

## Existing Data Model

### Job Offer
| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier |
| title | VARCHAR(255) | Job posting title |
| url | TEXT | URL to job posting |
| created_at | TIMESTAMP | Record creation time |

### Job Offer Process
| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Process record identifier |
| job_offers_id | INTEGER | Foreign key to job_offers.id |
| research | BOOLEAN | Job research completed (default false) |
| research_email | BOOLEAN | Research email sent (default false) |
| applied | BOOLEAN | Application submitted (default false) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Extensions for This Feature

### New Fields (Schema Enhancement)
These fields are expected to exist in the job_offers table based on user clarification:

| Field | Type | Description |
|-------|------|-------------|
| company | TEXT | Company name (may be null/empty) |
| email | TEXT | Contact email (may be null/empty) |
| company_url | TEXT | Company website URL (may be null/empty) |
| posted | TIMESTAMP | Job posting date (may be null/empty) |

### CSV Export Format

**Columns**: `company,email,company_url,title,url,posted`

**Notes**:
- No `applied` column (all exported jobs are applied)
- Fields may be empty/null if not yet populated in database
- UTF-8 encoding with BOM for Excel compatibility

### Data Flow

1. **User clicks "Export Applied" button**
2. **Extension calls `GET /job-offers?format=csv`** (filtered for applied=true)
3. **Backend generates CSV from job_offers table**
4. **Backend returns CSV with Content-Type: text/csv**
5. **Extension triggers browser download with timestamped filename**

## Validation Rules

1. **Format Parameter**: Must be either `json` or `csv` (case-insensitive)
2. **Invalid Format**: Return 400 Bad Request with error message
3. **Missing Format**: Default to `json` for backward compatibility
4. **CSV Escaping**: Fields containing commas, quotes, or newlines must be properly escaped (RFC 4180)

## API Contract Extensions

### GET /job-offers with Format Parameter

**Request**:
```
GET /job-offers?format=csv
```

**Response (CSV)**:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="applied-jobs-2026-03-22T143052.csv"

company,email,company_url,title,url,posted
"Acme Corp","hr@acme.com","https://acme.com","Software Engineer","https://jobs.acme.com/123","2026-03-15"
```

**Response (JSON - default)**:
```
Content-Type: application/json

{
  "job_offers": [...]
}
```

## Security Considerations

- CSV export respects same authorization as other API endpoints
- No PII exposure beyond existing job offer data
- Content-Disposition header prevents XSS in filename
