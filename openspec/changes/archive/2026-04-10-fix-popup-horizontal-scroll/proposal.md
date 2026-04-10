## Why

The extension popup requires horizontal scrolling due to a CSS conflict: the popup body is constrained to 320px width, but `.popup-container` has `min-width: 760px`. This was likely left in from debugging or a copy-paste error. Users cannot see the full UI without scrolling horizontally.

## What Changes

- Remove `min-width: 760px` from `.popup-container` in `popup.css`
- Ensure popup content reflows properly within the 320px constraint
- Verify no other layout breaks from the width change

## Capabilities

### New Capabilities
- None (bug fix only, no new features)

### Modified Capabilities
- None (existing capabilities unchanged)

## Impact

**Affected File:**
- `extension/popup/popup.css` (line 83)

**Scope:**
- CSS only - no JavaScript, API, or backend changes
- Affects popup UI only - content script styles unchanged
