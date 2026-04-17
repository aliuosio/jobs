# Quickstart: Delete Job Icon Feature

## Prerequisites

- Docker and Docker Compose running
- Firefox browser for extension testing
- PostgreSQL populated with job offers

## Backend Changes

### 1. Add DELETE Endpoint

```python
# src/api/routes.py - Add this endpoint
@router.delete(
    "/job-offers/{job_offer_id}",
    status_code=204,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    tags=["job-offers"],
)
async def delete_job_offer(job_offer_id: int) -> None:
    from src.services.job_offers import job_offers_service
    # Implementation deletes process first, then offer
```

### 2. Add Service Method

```python
# src/services/job_offers.py - Add delete method
async def delete_job_offer(self, job_offer_id: int) -> bool:
    # Delete job_offers_process first, then job_offers
```

## Extension Changes

### 1. Increase Popup Width

```css
/* extension/popup/popup.css line 17 */
body {
  width: 576px;  /* Changed from 480px (20% increase) */
}
```

### 2. Add Delete Button

```javascript
// extension/popup/popup.js - In job list rendering
// Add delete button to each job-link-item
```

## Testing

### Backend Test

```bash
# Test DELETE endpoint
curl -X DELETE http://localhost:8000/job-offers/1
# Should return 204 No Content
```

### Extension Test

1. Load extension in Firefox
2. Open popup
3. Verify width is larger (~576px)
4. Click delete icon next to any job
5. Verify job is removed from list

## Verification

- **SC-001**: Click delete → job removed (single click, no confirmation)
- **SC-002**: Delete completes within 2 seconds
- **SC-003**: Popup width ~576px (measuring)
- **SC-004**: Error rate <5%