# Data Model: Extension Modernization

## Entities

### JobLink

Represents a job posting URL tracked by the extension.

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| id | string | UUID | Primary key |
| url | string | Valid URL, required | Job posting URL |
| title | string | Max 500 chars | Job title |
| company | string | Max 200 chars | Company name |
| status | enum | 'applied'/'in_progress'/'not_applied' | Application status |
| appliedAt | Date | ISO 8601 | When marked applied |
| createdAt | Date | ISO 8601 | When added |
| updatedAt | Date | ISO 8601 | Last modification |

**State Transitions**:
- `not_applied` → `in_progress` (user starts application)
- `in_progress` → `applied` (user marks as applied)
- Any → `not_applied` (user resets)

---

### FormField

Represents a detected form field on a web page.

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| id | string | UUID | Primary key |
| label | string | Required | Field label text |
| type | enum | Input field type | 'text'/'email'/'tel'/'textarea'/'select'/'checkbox' |
| value | string | Optional | Filled value |
| filled | boolean | Default: false | Whether field is filled |
| detectedAt | Date | ISO 8601 | When detected |

---

### UserProfile

User's resume data for form filling.

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| name | string | Full name | From resume |
| email | string | Valid email | Contact email |
| phone | string | Valid phone | Contact phone |
| address | string | Full address | Location |
| experience | Experience[] | Array | Work history |
| education | Education[] | Array | Education history |
| skills | string[] | Array | Skills list |

---

### APIResponse<T>

Standard API response wrapper.

| Field | Type | Notes |
|-------|------|-------|
| data | T | Response payload |
| error | string | Error message if any |
| success | boolean | Success status |

---

## Key Relationships

```
JobLink 1--* FormField
UserProfile 1--* Experience
UserProfile 1--* Education
```

---

## Validation Rules

1. JobLink URL must be valid URL format
2. JobLink status transitions must follow allowed paths
3. FormField value must match field type
4. UserProfile email must be valid email format

---

## Caching Strategy (TanStack Query)

| Query Key | Cache Time | Notes |
|----------|-----------|-------|
| ['jobs'] | 5 min | Job links list |
| ['job', id] | 10 min | Single job |
| ['profile'] | 30 min | User profile |
| ['fields', url] | 1 min | Detected fields |