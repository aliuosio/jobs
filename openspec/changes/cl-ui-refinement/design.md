## Context

Following the CL description validation fix, the UI now displays a character count "50/200" which users find cluttered. Additionally, the current enable logic requires the description to be saved first, but users want to generate as long as they have a long enough description locally.

### Current State
- Character count display: `${descriptionLength}/${MIN_DESCRIPTION_LENGTH}` shown when `hasDescription && !hasLongDescription`
- Enable logic: `canGenerate = isSaved && descriptionLength >= MIN_DESCRIPTION_LENGTH` (requires saved status)
- Tooltip logic: Shows reason for disabled state, no special case for existing letters

### Desired Behavior
1. No character count displayed
2. Generate button enabled when `descriptionLength >= MIN_DESCRIPTION_LENGTH` (no saved status required)
3. When `cl_status === 'ready'`, tooltip shows "Letter available"

## Goals / Non-Goals

**Goals:**
- Remove character count display from job links list
- Simplify Generate button to enable based on description length only
- Show "Letter available" tooltip when letter already generated

**Non-Goals:**
- Modify backend or n8n workflow
- Change character threshold (keep 200)
- Add new features beyond UI refinement

## Decisions

### Decision 1: Enable Logic Change
**Chosen**: `canGenerate = descriptionLength >= MIN_DESCRIPTION_LENGTH` (no cl_status check)

**Rationale**: Users may have description in clipboard or local state but not saved to API. As long as description meets length threshold, should allow generation.

### Decision 2: Tooltip for Existing Letters
**Chosen**: When `cl_status === 'ready'`, always show "Letter available" in tooltip

**Rationale**: Clear indicator that generation already done, helps users understand current state.

### Decision 3: Character Count Removal
**Chosen**: Remove entirely from render logic

**Rationale**: Clutters UI, users can gauge length themselves.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| User generates without saving | Description may be lost if browser closes | Acceptable - users should save but not enforced |
| "Letter available" not clear | Users might regenerate | Acceptable - regenerating is fine |

## Migration Plan

1. Remove validation message from popup.js render logic
2. Simplify canGenerate logic (remove isSaved check)
3. Add special tooltip case for cl_status === 'ready'
4. Remove unused .cl-validation-msg CSS (optional cleanup)

No backend changes needed. Deploy extension update only.