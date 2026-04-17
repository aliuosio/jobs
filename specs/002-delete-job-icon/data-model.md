# Data Model: Delete Job Icon Feature

## Entities

### JobOffer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | int | Yes | Primary key |
| title | string | Yes | Job title |
| url | string | Yes | Job posting URL |
| description | string | No | Job description |
| company | string | No | Company name |
| created_at | datetime | Yes | Creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Source**: PostgreSQL `job_offers` table

---

### JobOfferProcess

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | int | Yes | Primary key |
| job_offer_id | int | Yes | Foreign key to job_offers |
| research | boolean | No | Research flag |
| research_email | boolean | No | Research email flag |
| applied | boolean | No | Applied flag |
| created_at | datetime | Yes | Creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Source**: PostgreSQL `job_offers_process` table

**Relationship**: 
- Many JobOfferProcess → One JobOffer
- job_offer_id references job_offers.id

---

### DeleteAction

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| job_offer_id | int | Yes | ID of job to delete |
| result | string | Yes | "success" or "error" |
| error_message | string | No | Error details on failure |

**Usage**: Response model for DELETE operation

---

## API Contracts

### DELETE /job-offers/{job_offer_id}

**Request**:
- Method: DELETE
- Path: `/job-offers/{job_offer_id}` where job_offer_id is integer
- No body required

**Success Response (204)**:
- Status: 204 No Content
- Body: None

**Error Response (400/404/500)**:
```json
{
  "detail": "Error message"
}
```

**Error Codes**:
- 400: Invalid job_offer_id (non-positive)
- 404: Job offer not found
- 500: Internal server error
- 503: Database unavailable

---

### Extension Popup Update

**Message Contract** (via SSE):
- When job deleted, SSE broadcasts updated list
- Frontend receives full job list via existing `/api/v1/stream`

---

## UI Contracts

### Delete Button

**Structure**:
```html
<button class="btn-delete" data-job-id="{id}" aria-label="Delete job">
  <svg>...</svg>
</button>
```

**Styling**:
- Position: Right side of job-link-item
- Icon: Trash/delete icon (consistent with extension)
- Size: Small (fits in list item row)
- Hover: Red background for confirmation

---

## Validation Rules

### DELETE Endpoint:
- job_offer_id MUST be positive integer
- If job_offer_id doesn't exist → 404 error
- Database transaction: Delete process first, then offer

### Extension Popup:
- Empty list: Hide delete buttons, show "no links" message
- Error state: Display error message, keep job in list