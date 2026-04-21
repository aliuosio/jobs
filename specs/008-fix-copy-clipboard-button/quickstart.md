# Quickstart: Fix Copy to Clipboard Button

## Overview

Fix the copy-to-clipboard button in the Firefox extension popup to provide proper visual feedback and correctly copy cover letter content.

## Issue

The copy button (📋) in the extension popup:
1. Provides insufficient visual feedback when clicked
2. May not correctly copy cover letter content

## Solution

Modify `extension/popup/popup.js` copy handler to:
1. Show success/error states visibly
2. Handle clipboard API errors with user feedback
3. Disable button during copy operation

## Files to Modify

| File | Change |
|------|--------|
| extension/popup/popup.js | Copy button handler (lines 1289-1308) |
| extension/popup/popup.css | Add feedback styles |

## Testing

1. Open Firefox → about:debugging#/runtime/this-firefox
2. Load temporary add-on from extension/ directory
3. Open popup with job that has cover letter generated
4. Click copy button → verify clipboard content

## Verification

- [ ] Click copy → checkmark appears
- [ ] Paste elsewhere → content confirmed
- [ ] Click copy → reverts after ~2s
- [ ] Error case → error message shown