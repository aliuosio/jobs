## Why

The Cover Letter (CL) generation feature in the Firefox Extension has a validation gap: the Generate button enables when ANY job description exists (`length > 0`), while the Core application (n8n workflow) enforces a 200-character minimum threshold. This creates a poor user experience where users see an enabled button but generation silently fails when the description is too short. Additionally, the extension's state machine has a bug where it checks description length instead of the saved status (`cl_status`).

## What Changes

1. **Add minimum description length constant** - Define `MIN_DESCRIPTION_LENGTH = 200` in extension to match n8n's threshold
2. **Fix enable logic** - Change `canGenerate` to check `cl_status === 'saved'` AND `descriptionLength >= MIN_DESCRIPTION_LENGTH`
3. **Add missing endpoint or remove polling** - Either implement `/job-applications` endpoint in FastAPI or remove the polling logic from extension
4. **Update validation parity** - Ensure extension UI reflects the same constraint that n8n enforces

## Capabilities

### New Capabilities

- **cl-description-validation**: Enforce minimum job description length (200 chars) before enabling Generate button in extension, with parity against Core's n8n workflow constraint

### Modified Capabilities

- (none - this is a bugfix for existing functionality, not a requirement change)

## Impact

- **Extension**: `extension/popup/popup.js` - modify button enable logic
- **Backend**: `src/api/routes.py` - add `/job-applications` endpoint OR remove extension polling dependency
- **Configuration**: Add `MIN_DESCRIPTION_LENGTH` constant in extension