# Data Model: Cover Letter Generation Issues

## Entities

### JobOffer
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| title | str | Job title |
| url | str | Job posting URL |
| description | str | Job description |
| created_at | datetime | Creation timestamp |

### JobApplication
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| job_offer_id | UUID | FK to JobOffer |
| content | str | Cover letter content |
| created_at | datetime | Creation timestamp |

### LetterStatus
| Field | Type | Notes |
|-------|------|-------|
| job_offer_id | UUID | Reference to job |
| generated | bool | Whether letter exists |
| updated_at | datetime | Last update |

## State Transitions

```
Not Generated → Generating → Generated
                     ↓
                   Error
```

## WebhookConfig (Configuration)

| Field | Type | Notes |
|-------|------|-------|
| host_url | str | n8n webhook URL from host |
| container_url | str | n8n webhook URL from container |
| selected_url | str | Active URL based on environment |