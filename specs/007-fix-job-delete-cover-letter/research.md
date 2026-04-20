# Research: Fix Job Offer Delete with Cover Letter

## Technical Context

### The Problem

The backend `delete_job_offer` function (lines 417-443 in `src/services/job_offers.py`) only deletes from:
1. `job_offers_process` table
2. `job_offers` table

It does NOT delete from `job_applications` table, which has a foreign key constraint with `ON DELETE RESTRICT` that blocks deletion of the parent job offer.

### Root Cause Analysis

From the database schema:
```sql
CONSTRAINT fk_job_applications_job_offer FOREIGN KEY (job_offers_id) 
  REFERENCES public.job_offers(id) ON DELETE RESTRICT ON UPDATE CASCADE
```

When a cover letter is generated, a record is created in `job_applications` referencing the `job_offer`. The `ON DELETE RESTRICT` prevents deleting the parent until the child is removed.

### Solution Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A - Add DELETE to job_applications | Add SQL to delete from job_applications before job_offers | Simple, minimal change | Requires modifying one function |
| B - Change FK to CASCADE | Alter FK constraint to ON DELETE CASCADE | Automatic cleanup | Schema change, more complex |
| C - Use trigger | Create BEFORE DELETE trigger on job_offers | encapsulated | More code to maintain |

### Selected Approach

**Option A** - Add DELETE to job_applications in the same transaction.

**Rationale**: 
- Minimal change - just adding one more DELETE statement
- Already in a transaction - maintains atomicity
- No schema changes required
- Same pattern already used for job_offers_process

**Alternatives Rejected**:
- Option B: Requires schema migration, more risky
- Option C: Adds complexity with no benefit for this simple case

## Implementation Details

The fix requires adding this DELETE statement before the existing ones:

```python
await conn.execute(
    "DELETE FROM job_applications WHERE job_offers_id = $1",
    job_offer_id,
)
```

This must run inside the existing transaction, before deleting from `job_offers`.

## Code Location

File: `src/services/job_offers.py`
Function: `delete_job_offer` (lines 417-443)