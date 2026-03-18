# Research: Label-Based Field Type Detection

**Feature**: 005-label-field-type-detection | **Date**: 2026-03-18

## Summary

Research on extracting semantic signals from form fields to enable accurate field type classification by the backend API.

---

## 1. HTML5 Autocomplete Attribute

### Standard Values

The `autocomplete` attribute provides standardized hints about field purpose. This is the most reliable signal for semantic classification.

**Personal Information:**
- `name` - Full name
- `given-name` - First name
- `family-name` - Last name
- `additional-name` - Middle name
- `email` - Email address
- `tel` - Phone number
- `tel-national` / `tel-international` - Phone format variants
- `bday` - Birthday

**Location:**
- `street-address` - Full street address
- `address-line1` / `address-line2` - Address lines
- `city` - City
- `country` / `country-name` - Country
- `postal-code` - ZIP/Postal code

**Professional:**
- `organization` - Company name
- `organization-title` - Job title
- `url` - Website URL

### Usage on Job Boards

| Platform | Autocomplete Usage | Notes |
|----------|-------------------|-------|
| LinkedIn | Partial | Some fields have autocomplete, others don't |
| Indeed | Limited | Mostly relies on label text |
| Greenhouse | Moderate | Newer forms include autocomplete |
| Lever | Limited | Label-focused |
| Workday | Variable | Enterprise configurations vary |

### Recommendation

Extract `autocomplete` as **high-priority signal**. When present, it's the most reliable indicator of semantic field type.

---

## 2. ARIA Attributes

### aria-label

Direct text description of element purpose. Often more descriptive than associated labels.

```html
<input type="text" aria-label="Your primary email address for job notifications">
```

**Extraction:** `element.getAttribute('aria-label')`

### aria-labelledby

Reference to element(s) that label the input. Can reference multiple elements.

```html
<span id="email-label">Email Address</span>
<span id="email-hint">for job updates</span>
<input aria-labelledby="email-label email-hint">
```

**Extraction:** Resolve ID references and concatenate text.

### aria-describedby

Reference to element(s) that describe the input (hints, instructions).

```html
<input aria-describedby="email-help">
<span id="email-help">We'll only use this for application updates</span>
```

**Extraction:** Resolve ID reference and extract text content.

### Recommendation

Extract `aria-label` and `aria-describedby` as **high-priority signals**. They provide explicit semantic information.

---

## 3. Placeholder Text Patterns

### Common Patterns

Placeholder text often contains:
- Example values: `john@example.com`, `+49 123 456789`
- Format hints: `MM/DD/YYYY`, `https://...`
- Instructions: `Enter your email`, `Start typing...`

### Pattern Matching Examples

| Field Type | Placeholder Patterns |
|------------|---------------------|
| Email | `*@*.*`, `email`, `@` |
| Phone | `+`, `(xxx)`, `xxx-xxxx`, `phone` |
| URL | `http`, `www.`, `.com`, `linkedin` |
| Date | `MM/DD`, `YYYY`, `date` |
| Name | `first`, `last`, `your name` |

### Caution

Placeholder text can be:
- Example data (not always helpful for classification)
- Localized in non-English
- Missing entirely

### Recommendation

Extract `placeholder` as **medium-priority signal**. Useful for pattern matching but less reliable than autocomplete.

---

## 4. Input Name Attribute Patterns

### Common Naming Conventions

Developers often use semantic naming:
- `user_email`, `email_address`, `emailAddress`
- `first_name`, `firstName`, `fname`
- `phone_number`, `phoneNumber`, `mobile`
- `linkedin_url`, `github`, `portfolio`

### Pattern Extraction

```javascript
function extractSemanticParts(name) {
  // Split camelCase, snake_case, kebab-case
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .split(' ');
}
```

### Limitations

- Auto-generated names: `field_123`, `input_456`
- Framework-generated: `react-select-2-input`, `ng-untouched-3`
- Non-semantic: `data1`, `info`, `value`

### Recommendation

Extract `name` as **medium-priority signal**. Parse into semantic parts for matching.

---

## 5. Hint Text Detection

### aria-describedby (Preferred)

Most reliable method when present.

```javascript
function getAriaDescribedBy(element) {
  const describedBy = element.getAttribute('aria-describedby');
  if (!describedBy) return null;
  
  // May reference multiple IDs
  const ids = describedBy.split(' ');
  return ids
    .map(id => document.getElementById(id)?.textContent)
    .filter(Boolean)
    .join(' ');
}
```

### Sibling Hint Elements

Common hint element patterns:

```html
<!-- After input -->
<input type="email">
<small class="hint">We'll never share your email</small>

<!-- Before input -->
<span class="field-help">Enter a valid email address</span>
<input type="email">

<!-- In wrapper -->
<div class="form-group">
  <input type="email">
  <p class="description">Used for application updates</p>
</div>
```

**Common hint class names:**
- `.hint`, `.help-text`, `.help`, `.field-help`
- `.description`, `.field-description`, `.form-text`
- `.helper-text`, `.assistive-text`
- `[data-hint]`

### Recommendation

Extract hint text as **medium-priority signal**. Check aria-describedby first, then look for sibling elements with hint classes.

---

## 6. Label Text Processing

### Text Cleaning

```javascript
function cleanLabelText(text) {
  return text
    // Remove asterisks (required markers)
    .replace(/\s*\*\s*/g, ' ')
    // Remove colons
    .replace(/\s*:\s*$/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
```

### Pattern Matching for Classification

```javascript
const FIELD_PATTERNS = {
  email: [
    /e-?mail/i,
    /email\s*address/i,
    /contact\s*email/i
  ],
  phone: [
    /phone/i,
    /mobile/i,
    /cell\s*(number)?/i,
    /tel(ephone)?/i,
    /contact\s*number/i
  ],
  first_name: [
    /^first\s*name$/i,
    /given\s*name/i,
    /forename/i,
    /\bfname\b/i
  ],
  last_name: [
    /^last\s*name$/i,
    /family\s*name/i,
    /surname/i,
    /\blname\b/i
  ],
  // ... more patterns
};
```

### Recommendation

Client-side does NOT perform classification. Send raw label text to API for processing.

---

## 7. Performance Considerations

### DOM Access Costs

| Operation | Relative Cost | Notes |
|-----------|---------------|-------|
| `getAttribute()` | Very Low | Direct property access |
| `getElementById()` | Low | Hash lookup |
| `querySelector()` | Medium | Selector parsing |
| `querySelectorAll()` | Medium-High | Full DOM scan |
| `getComputedStyle()` | High | Causes reflow |

### Optimization Strategies

1. **Batch DOM queries**: Extract all signals in single pass
2. **Avoid reflows**: Don't access computed styles
3. **Cache results**: Store extracted signals with field data
4. **Limit hint search**: Only search immediate siblings (2-3 elements)

### Target Budget

- Per-field extraction: **<5ms**
- 50-field form: **<250ms total** (including existing scan time)

---

## 8. Signal Priority Algorithm

### Recommended Priority Order

```
1. autocomplete  (Very High) - Standardized, explicit
2. aria-label    (High)      - Explicit description
3. label.text    (High)      - Primary semantic signal
4. placeholder   (Medium)    - Pattern hints
5. input.name    (Medium)    - Developer semantic
6. hint text     (Medium)    - Contextual help
7. input.id      (Low)       - Often auto-generated
```

### Conflict Resolution

When signals conflict:
1. Trust `autocomplete` over all others (most explicit)
2. Trust `aria-label` over `label.text`
3. Use `placeholder` patterns as tiebreaker
4. Let API resolve remaining conflicts

---

## 9. API Contract Considerations

### Backward Compatibility

```typescript
// v1 Request (existing)
{
  "label": "Email Address",
  "field_type": "email"  // HTML type, not semantic
}

// v2 Request (enhanced)
{
  "label": "Email Address",
  "signals": {           // NEW: structured signals
    "autocomplete": "email",
    "placeholder": "you@example.com",
    // ...
  }
}
```

### Migration Path

1. **Phase 1**: Extension sends both `field_type` (deprecated) and `signals`
2. **Phase 2**: API uses `signals` when present, falls back to `field_type`
3. **Phase 3**: Remove `field_type`, `signals` is required

---

## 10. References

### Specifications

- [HTML5 autocomplete attribute](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
- [WAI-ARIA 1.2: aria-label](https://www.w3.org/TR/wai-aria-1.2/#aria-label)
- [WAI-ARIA 1.2: aria-labelledby](https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby)
- [WAI-ARIA 1.2: aria-describedby](https://www.w3.org/TR/wai-aria-1.2/#aria-describedby)

### Best Practices

- [MDN: HTML autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
- [Chrome autofill field names](https://developers.google.com/web/fundamentals/design-and-ux/input/forms#use_metadata_to_enable_auto-complete)
- [Accessible Forms - W3C](https://www.w3.org/WAI/tutorials/forms/)

### Research Sources

- Browser autofill implementations
- Job board HTML structure analysis
- Form automation tools patterns
