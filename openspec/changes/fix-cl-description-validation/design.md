## Context

### Background
The Cover Letter (CL) generation feature spans three layers:
1. **Firefox Extension** - UI for saving job descriptions and triggering generation
2. **FastAPI Backend** - Stores job descriptions via REST API
3. **n8n Workflow** - Actually generates the cover letter (enforces 200-char minimum)

### Current State
- **Extension enable logic** (popup.js:728): `canGenerate = hasDescription` where `hasDescription = descriptionLength > 0`
- **n8n validation** (6.Job Application Writer.json): `LENGTH(description) >= 200`
- **Backend endpoint**: `/job-applications` does NOT exist but extension polls it

### Problem
Users see the Generate button enabled even when their description is too short. When they click Generate:
- Extension sends webhook to n8n
- n8n silently skips generation (description < 200 chars)
- No feedback to user about why generation didn't happen

### Constraints
- n8n workflow enforces 200-character minimum (cannot change without workflow modification)
- Must maintain parity between Extension UI and n8n constraint
- Need to decide on `/job-applications` endpoint approach

## Goals / Non-Goals

**Goals:**
1. Add minimum description length validation (200 chars) to Extension
2. Fix state machine bug: check `cl_status === 'saved'` not just description exists
3. Resolve the missing `/job-applications` endpoint issue
4. Provide user feedback when description is too short

**Non-Goals:**
- Modify n8n workflow (200-char threshold is intentional)
- Add validation to FastAPI backend (n8n handles validation)
- Implement full cover letter generation (existing feature works)

## Decisions

### Decision 1: Enable Button Validation Logic
**Chosen approach**: Check BOTH `cl_status === 'saved'` AND `descriptionLength >= 200`

```javascript
// NEW logic in popup.js
const MIN_DESCRIPTION_LENGTH = 200;
const canGenerate = (cl_status === 'saved' || cl_status === 'ready') && 
                    descriptionLength >= MIN_DESCRIPTION_LENGTH;
```

**Rationale**: 
- `cl_status` check ensures description was actually saved to backend
- `descriptionLength` check aligns with n8n's 200-char threshold
- Provides clear user feedback on button state

**Alternative considered**: Only check `descriptionLength >= 200` (no cl_status)
- Rejected because user might have description in local storage but not saved to API

### Decision 2: /job-applications Endpoint Approach
**Chosen approach**: Remove extension polling dependency and use simpler completion detection

**Rationale**:
- The `/job-applications` endpoint doesn't exist and would require significant backend work
- The extension already tracks completion via SSE updates to `jobOffers` with `process` data
- Current polling is fragile (returns 404, but feature somehow works via fallback)

**Alternative considered**: Add `/job-applications` endpoint to FastAPI
- Rejected: Requires new database table, new API routes, more complexity than needed
- The SSE stream already provides real-time updates to job offers including process status

### Decision 3: User Feedback for Short Descriptions
**Chosen approach**: Disable button with clear tooltip, optionally show validation message

```javascript
const validationMessage = descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION_LENGTH
  ? `Description too short (${descriptionLength}/${MIN_DESCRIPTION_LENGTH} chars)`
  : '';
```

**Rationale**:
- Disabled button with tooltip is standard pattern
- Additional validation message provides explicit guidance
- Avoids surprise when button is disabled

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| n8n workflow changes 200-char threshold | UI validation becomes misaligned | Document threshold constant, require sync on workflow changes |
| User pastes description but doesn't save | Button still disabled | Show "Save description first" in tooltip |
| SSE fails to update completion status | User sees "generating" forever | Add timeout fallback, show error after 3 min |
| Extension polls non-existent endpoint | Causes unnecessary 404 errors | Remove polling, rely on SSE updates |

## Migration Plan

1. **Phase 1**: Add constant and fix enable logic in extension popup.js
2. **Phase 2**: Remove `/job-applications` polling code from extension
3. **Phase 3**: Test end-to-end with various description lengths
4. **Phase 4**: Deploy extension update (no backend changes needed)

**Rollback**: If issues arise, revert extension changes - backend unchanged, n8n unchanged.

## Open Questions

1. **Should we also add validation to the Save action?** - Currently users can save any length description, but generation will silently fail. Should we warn on save?
2. **How does completion detection actually work currently?** - The extension polls but gets 404, yet feature seems to work. Need to verify exact flow.