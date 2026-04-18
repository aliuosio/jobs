# Quickstart: Generated Button Feedback

## What This Does

Adds visual feedback to the cover letter generation workflow:
- Shows "Generated" (passive) button when letter is ready
- Shows timer during generation that updates every second

## Files Modified

| File | Changes |
|------|---------|
| extension/popup/popup.js | Button label + timer logic |
| extension/tests/cover-letter.test.js | Add tests for new states |

## Testing

```bash
# Load extension in Firefox
# Open popup -> Jobs List

# Test 1: Button shows "Generate" initially
# - Add a job with description >= 200 chars
# - Button shows "Generate"

# Test 2: Start generation
# - Click Generate button
# - Badge shows timer counting up (MM:SS)

# Test 3: Complete generation
# - Wait for n8n webhook to complete
# - Button shows "Generated" (disabled)
# - Badge shows "Saved" or "Generated"
```

## Verification

1. Load extension in Firefox: `about:debugging#/runtime/this-firefox`
2. Open popup with jobs list
3. Check button states match the table in data-model.md
4. Timer updates every second during generation