# Feature Specification: Fix Job Offer Delete with Cover Letter

**Feature Branch**: `[007-fix-job-delete-cover-letter]`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "check why the firefoxextension can not delete the job_offer_id 450. i could delete others but this has a cover letter generetad so i think this is the blocker and why the delete is failing"

## Clarifications

### Session 2026-04-20

- Q: What user feedback mechanism do you want when the delete succeeds or fails? → A: Reuse existing feedback function (same as delete without cover letter - there's already error handling, but it fails when cover letter exists)

## Problem Statement

Users cannot delete job offers that have a generated cover letter. The delete operation fails silently with a generic error, preventing users from managing their job applications.

## Root Cause

A database foreign key constraint with `ON DELETE RESTRICT` exists on the `job_applications` table:

```sql
CONSTRAINT fk_job_applications_job_offer FOREIGN KEY (job_offers_id) 
  REFERENCES public.job_offers(id) ON DELETE RESTRICT ON UPDATE CASCADE
```

When a cover letter is generated, a record is created in `job_applications` table referencing the `job_offer`. The `ON DELETE RESTRICT` prevents deleting the parent job offer until the child record is removed.

The backend `delete_job_offer` function only deletes from `job_offers` and `job_offers_process` tables but does NOT delete the related `job_applications` record first.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Job Offer with Cover Letter (Priority: P1)

User has generated a cover letter for a job offer but no longer wants to track that job. User attempts to delete the job offer from the extension.

**Why this priority**: Core functionality is broken - users cannot delete job offers that have cover letters, causing frustration and preventing proper job application management.

**Independent Test**: User opens extension, selects a job offer with a cover letter, clicks delete, and the job is removed from the list without error.

**Acceptance Scenarios**:

1. **Given** a job offer with a generated cover letter exists, **When** user clicks delete, **Then** the job offer is removed successfully and disappears from the list
2. **Given** a job offer without a cover letter exists, **When** user clicks delete, **Then** the job offer is removed successfully (existing behavior preserved)

---

### User Story 2 - Delete Job Offer with Multiple Applications (Priority: P2)

User has generated multiple cover letters for the same job offer (revisited applications).

**Why this priority**: Edge case handling - ensures the fix works for all related records, not just one.

**Independent Test**: User generates multiple cover letters for the same job, then deletes the job offer.

**Acceptance Scenarios**:

1. **Given** a job offer has multiple job_applications records, **When** user deletes the job offer, **Then** all related application records are removed

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to delete job offers that have a generated cover letter
- **FR-002**: System MUST delete all related application records when a job offer is deleted (cascading delete)
- **FR-003**: Reuse existing feedback mechanism - same error handling as delete without cover letter (show error message when delete fails)

### Key Entities *(include if feature involves data)*

- **JobOffer**: The job posting being tracked by users
- **JobApplication**: Contains the generated cover letter and related metadata for a specific job offer

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can delete any job offer regardless of whether it has a cover letter (100% success rate)
- **SC-002**: Delete operation completes in under 2 seconds (user-perceived performance)
- **SC-003**: No database constraint errors occur during delete operations

## Assumptions

- Users have PostgreSQL database with the existing schema
- TheFirefox extension continues to use the same DELETE API endpoint
- The fix is backward compatible - existing deletes without cover letters continue to work