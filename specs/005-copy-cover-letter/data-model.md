# Data Model: Copy Cover Letter to Clipboard

## Status

**Reusing existing data model** - No new entities needed.

## Existing Entities (from spec)

### Job Offer
- `id`: number
- `title`: string
- `url`: string
- `description`: string (min 200 chars for generation)
- `cl_status`: 'none' | 'saving' | 'generating' | 'saved' | 'ready' | 'error'

### Cover Letter
- Stored in `job_applications` table
- Retrieved via API `/job-applications?job_offer_id={id}`

## State Transitions

```
none → saving → saved → generating → ready
                              ↓
                            error
```

No new states or transitions added.