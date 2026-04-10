## Context

The extension popup is constrained by Firefox to ~320px width (the browser's default toolbar popup width). The popup body correctly sets `width: 320px`, but `.popup-container` has an errant `min-width: 760px` that forces the content to overflow.

Current problematic CSS (popup.css line 81-84):
```css
.popup-container {
  padding: 16px;
  min-width: 760px;  /* ← Causes horizontal overflow */
}
```

## Goals / Non-Goals

**Goals:**
- Remove horizontal scrolling requirement in extension popup
- Ensure all popup content displays within 320px width
- Maintain existing visual appearance and functionality

**Non-Goals:**
- Redesign the popup UI (just fix the overflow)
- Change any JavaScript behavior
- Modify content script styling

## Decisions

### Decision 1: Remove `min-width: 760px` entirely

**Chosen approach:** Delete the `min-width` property from `.popup-container`

**Rationale:**
- No legitimate reason for 760px minimum in a popup context
- The popup is designed to be compact (320px)
- Existing protective patterns in the CSS (flex-wrap, overflow: hidden) will handle content containment

**Alternatives considered:**
| Option | Pros | Cons |
|--------|------|------|
| Change to `max-width` | Still limits width | Popup should expand naturally |
| Change to `width: 100%` | Explicit | Redundant with parent constraint |
| Increase body width | — | Breaks Firefox popup expectations |

### Decision 2: Verify content reflow

**After removing `min-width`, verify:**
- Job link items (`.job-link-item`) wrap properly with `flex-wrap: wrap` (already set)
- Long job titles truncate with ellipsis via existing `.job-link-title` rules
- Modal content (`.modal-content`) uses `max-width: 400px` so it handles itself

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Content overflow in vertical direction | Low | Existing `max-height` and `overflow-y: auto` handle scrolling vertically |
| Job link items break layout | Low | `flex-wrap: wrap` and `text-overflow: ellipsis` already in place |

## Open Questions

None - the fix is straightforward CSS removal.
