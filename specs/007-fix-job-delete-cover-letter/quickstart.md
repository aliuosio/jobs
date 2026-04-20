# Quickstart: Fix Job Offer Delete with Cover Letter

## What This Fix Does

The delete_job_offer function now deletes related `job_applications` records BEFORE deleting the job offer, avoiding the foreign key constraint error.

## Files Changed

- `src/services/job_offers.py` - Add DELETE to job_applications in delete_job_offer()

## Quick Test

```bash
# Start services
docker-compose up -d

# Run the specific test
docker compose exec api-backend pytest tests/integration/test_job_offer_delete.py -v
```

## Manual Verification

1. Generate a cover letter for any job offer
2. Try to delete that job offer from the extension
3. Verify delete succeeds without error

## Rollback

```bash
git checkout src/services/job_offers.py
```

Reverts to original behavior (delete will fail with constraint error).