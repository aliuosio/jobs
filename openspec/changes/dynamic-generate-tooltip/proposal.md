## Why

The current tooltip uses local `cl_status` state which may be stale. Users need real-time feedback from the database on whether a cover letter has actually been generated, visible on button hover.

## What Changes

1. **Add dynamic tooltip** - On mouseover, query backend to check if letter exists in `job_application` table
2. **Add API endpoint** - Create endpoint to check letter existence for a job offer
3. **Update button behavior** - Add hover event listener to fetch and display tooltip
4. **Keep existing functionality** - Button click and generation trigger remain unchanged

## Capabilities

### New Capabilities

- `generate-button-tooltip`: Dynamic database-backed tooltip showing letter generation status on hover

### Modified Capabilities

- (none - new capability)

## Impact

- **Extension**: `extension/popup/popup.js` - add hover handler and tooltip fetch
- **Backend**: `src/api/routes.py` - add endpoint to check letter existence in `public.job_applications` table
- **Database**: Query `public.job_applications` table where `content IS NOT NULL`