# Research: Delete Job Icon Feature

## Decisions & Rationale

### 1. Extension Popup Width Increase

**Decision**: Change popup width from 480px to 576px (20% increase)

**Rationale**: 
- Current width: 480px (popup.css line 17, `body { width: 480px; }`)
- Target width: 576px (480 * 1.20 = 576)
- Implementation: Single CSS change in popup.css

**Alternative**: Could use responsive width with `max-width` but fixed pixel value matches spec requirement for "approximately 576px"

---

### 2. DELETE Endpoint Location

**Decision**: Create DELETE at `/job-offers/{job_offer_id}` in `src/api/routes.py`

**Rationale**:
- Existing routes follow pattern: `/job-offers` (GET list), `/job-offers/{id}` (PATCH)
- Adding DELETE follows RESTful conventions
- Will use same service: `job_offers_service`

**No Clarification Needed**: The spec states endpoint already exists but doesn't - this is being created now as part of this feature.

---

### 3. Delete Order (Foreign Key Constraints)

**Decision**: Delete job_offers_process first, then job_offers

**Rationale**: Based on spec clarification Q2:
- `job_offers_process.job_offer_id` references `job_offers.id` as foreign key
- Must delete child first, then parent
- Implementation in `job_offers_service.delete_job_offer()`

---

### 4. UI Integration - Delete Icon Placement

**Decision**: Add delete button to each job link item in `.job-link-item`

**Rationale**:
- Existing job list styling in `popup.css`: `.job-link-item` (lines 347-387)
- Each item has room for action buttons (existing `.cl-actions` pattern for CL generation)
- Will add button with trash/delete icon consistent with extension design

---

### 5. TDD Approach Confirmation

**Decision**: Use TDD for code implementation

**Rationale**:
- Constitution IV mandates TDD for all code implementations
- Python: Write failing test first, then implement DELETE endpoint
- JavaScript: Write failing test for delete button functionality

---

## Technical Implementation Notes

### Files to Modify:

1. **Backend**:
   - `src/api/routes.py` - Add DELETE /job-offers/{id} endpoint
   - `src/services/job_offers.py` - Add delete method to service

2. **Extension**:
   - `extension/popup/popup.css` - Update width (line 17)
   - `extension/popup/popup.js` - Add delete button to job list items

### No Research Needed:
- Icon generation: Use inline SVG or existing icon system
- Error handling: Follow existing patterns in routes.py
- Refresh: Existing SSE mechanism already handles real-time updates