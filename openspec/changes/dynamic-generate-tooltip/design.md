## Context

Currently the Generate button tooltip uses local `cl_status` state which is updated via SSE but may not reflect the actual database state. The user wants real-time feedback from the database on whether a letter has been generated, visible on button hover.

### Current State
- Button tooltip (popup.js line 730): Uses `cl_status === 'ready'` to show "Letter available"
- This is based on local state, not actual database query
- The test file mentions `job_application` table but endpoint doesn't exist

### Data Model Confirmed
- Table: `public.job_applications` (exists in database)
- Fields: `id`, `job_offers_id`, `content`
- Letter exists when: `content IS NOT NULL AND content <> ''`

## Goals / Non-Goals

**Goals:**
- Add hover event handler to Generate button
- Query database for letter existence
- Show "Letter Generated" or "Letter Not Generated" tooltip

**Non-Goals:**
- Modify button click behavior
- Change generation logic
- Add new database tables (use existing structure if possible)

## Decisions

### Decision 1: Endpoint Approach
**Chosen**: Add lightweight endpoint `/job-offers/{id}/letter-status` returning boolean

**Rationale**: 
- Simple API, no need for new table
- Can check existing process data or add simple check
- Minimal backend changes

### Decision 2: Fallback to Local State
**Chosen**: If API fails, fall back to current `cl_status` logic

**Rationale**:
- Network failures shouldn't break tooltip
- User still gets some feedback

### Decision 3: Debounce Hover
**Chosen**: Cache result for session, only fetch once per job offer

**Rationale**:
- Avoid repeated API calls on hover
- State persists during popup session

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| No job_application table exists | May need new table or use alternative | Use job_offers_process or create table |
| Network latency on hover | Tooltip slow to appear | Show cached state immediately |
| Button click breaks | Core functionality affected | Keep click handler separate from hover |

## Migration Plan

1. Add endpoint to check letter status (backend)
2. Add hover handler with fetch in extension popup.js
3. Test tooltip displays correctly
4. Deploy extension + backend

No database migration if using existing tables.

## Open Questions

(Resolved) - Table `public.job_applications` exists with fields: id, job_offers_id, content