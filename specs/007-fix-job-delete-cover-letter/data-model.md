# Data Model: Fix Job Offer Delete with Cover Letter

## Entities

### JobOffer
| Field | Type | Notes |
|-------|------|-------|
| id | SERIAL (PK) | Primary key |
| title | VARCHAR | Job title |
| url | TEXT | Job posting URL |
| description | TEXT | Job description |
| company | VARCHAR | Company name |
| email | VARCHAR | Contact email |
| company_url | TEXT | Company website |
| created_at | TIMESTAMP | Record creation time |

### JobApplication
| Field | Type | Notes |
|-------|------|-------|
| id | SERIAL (PK) | Primary key |
| job_offers_id | INTEGER (FK) | References job_offers(id) |
| content | TEXT | Generated cover letter |
| created_at | TIMESTAMP | Record creation time |

### JobOfferProcess
| Field | Type | Notes |
|-------|------|-------|
| id | SERIAL (PK) | Primary key |
| job_offers_id | INTEGER (FK) | References job_offers(id) |
| research | BOOLEAN | Research completed |
| research_email | BOOLEAN | Email sent |
| applied | BOOLEAN | Application submitted |

## Relationships

```
job_offers (1) ──┬── (N) job_applications  [ON DELETE RESTRICT]
                  └── (N) job_offers_process  [ON DELETE CASCADE]
```

## Delete Flow

When deleting a job offer, the order must be:

1. DELETE FROM job_applications WHERE job_offers_id = $1
2. DELETE FROM job_offers_process WHERE job_offers_id = $1  
3. DELETE FROM job_offers WHERE id = $1

All three in a single transaction for atomicity.

## Validation

- Job offer must exist before delete
- All related records deleted in same transaction
- No partial state on failure (transaction rolls back)