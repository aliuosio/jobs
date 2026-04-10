## Why

The recent CL validation changes introduced a character count display (e.g., "50/200") that clutters the job links list UI. Additionally, the Generate button should enable based on description length alone (not requiring saved status), and should indicate when a cover letter already exists for a job offer.

## What Changes

1. **Remove character count display** - Remove the validation message showing "X/200" from the job links list
2. **Simplify Generate button enable logic** - Button enabled when `descriptionLength >= MIN_DESCRIPTION_LENGTH` (regardless of saved status)
3. **Add "letter available" tooltip** - When a cover letter already exists (`cl_status === 'ready'`), tooltip shows "Letter available" instead of other messages

## Capabilities

### New Capabilities

- (none - this is UI refinement of existing functionality)

### Modified Capabilities

- `cl-description-validation`: Modified to remove character count display and add "letter available" tooltip state

## Impact

- **Extension**: `extension/popup/popup.js` - modify render logic and tooltip
- **Extension**: `extension/popup/popup.css` - may need to remove validation message styling