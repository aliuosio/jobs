# Quickstart: Label-Based Field Type Detection

**Feature**: 005-label-field-type-detection | **Date**: 2026-03-18

## Quick Reference

### What This Feature Does

Enhances the form field scanner to extract **all available signals** from form fields, enabling the API to accurately classify semantic field types (e.g., `first_name`, `email`, `phone`) instead of just using HTML input types.

### Signals Extracted

| Signal | Source | Example |
|--------|--------|---------|
| Label text | `<label>`, aria-labelledby, proximity | "Your Email Address" |
| Autocomplete | `autocomplete="email"` | "email" |
| ARIA label | `aria-label="Email for contact"` | "Email for contact" |
| Placeholder | `placeholder="john@example.com"` | "john@example.com" |
| Input name | `name="user_email"` | "user_email" |
| Input ID | `id="email-field"` | "email-field" |
| Hint text | aria-describedby, sibling hints | "We'll never share your email" |

---

## For Developers

### Adding the Feature

1. **Create signal extractor module:**
   ```javascript
   // extension/content/signal-extractor.js
   function buildFieldSignals(element, labelData) {
     return {
       label: labelData,
       autocomplete: element.getAttribute('autocomplete'),
       ariaLabel: element.getAttribute('aria-label'),
       placeholder: element.getAttribute('placeholder'),
       name: element.name,
       id: element.id,
       hint: extractHintText(element),
       htmlType: getFieldType(element)
     };
   }
   ```

2. **Integrate with form scanner:**
   ```javascript
   // In form-scanner.js createFormField()
   const signals = buildFieldSignals(pair.inputElement, {
     text: pair.labelText,
     confidence: pair.confidence,
     source: pair.detectionMethod
   });
   
   return {
     // ... existing fields
     signals: signals
   };
   ```

3. **Update API request:**
   ```javascript
   // In background.js handleFillForm()
   body: JSON.stringify({
     label: data.label,
     signals: data.signals  // NEW
   })
   ```

### Testing Signal Extraction

```javascript
// Quick test in browser console on a job application page
const input = document.querySelector('input[type="email"]');
const signals = buildFieldSignals(input, { text: 'Email', confidence: 'high', source: 'for-id' });
console.log(signals);
```

---

## For API Integration

### Expected Payload Structure

```json
POST /fill-form
{
  "label": "Your Email Address",
  "signals": {
    "label_text": "Your Email Address",
    "label_confidence": "high",
    "label_source": "for-id",
    "autocomplete": "email",
    "placeholder": "Enter your email",
    "input_name": "user_email",
    "input_id": "email-field",
    "hint_text": "We'll contact you at this address",
    "hint_source": "sibling-hint",
    "html_type": "email"
  }
}
```

### API Classification Logic (Suggested)

```python
def classify_field_type(signals):
    # Priority 1: autocomplete attribute (most reliable)
    if signals.get('autocomplete'):
        return map_autocomplete_to_type(signals['autocomplete'])
    
    # Priority 2: Label text pattern matching
    if signals.get('label_text'):
        type_match = match_label_patterns(signals['label_text'])
        if type_match:
            return type_match
    
    # Priority 3: ARIA label
    if signals.get('aria_label'):
        type_match = match_label_patterns(signals['aria_label'])
        if type_match:
            return type_match
    
    # Priority 4: Placeholder patterns
    if signals.get('placeholder'):
        type_match = match_placeholder_patterns(signals['placeholder'])
        if type_match:
            return type_match
    
    # Priority 5: Input name patterns
    if signals.get('input_name'):
        type_match = match_name_patterns(signals['input_name'])
        if type_match:
            return type_match
    
    # Fallback: Use HTML type or unknown
    return signals.get('html_type', 'unknown')
```

---

## Common Field Type Patterns

### Email Fields

```regex
# Label patterns
/email\s*address|e-?mail|contact\s*email|work\s*email/i

# Autocomplete values
email

# Name patterns
email|e_mail|emailaddress|user_email|contact_email
```

### Phone Fields

```regex
# Label patterns
/phone|mobile|cell|tel|contact\s*number|telephone/i

# Autocomplete values
tel, tel-national, tel-international

# Name patterns
phone|mobile|cell|tel|contact_number|phone_number
```

### Name Fields

```regex
# First name
/first\s*name|given\s*name|forename|fname/i

# Last name
/last\s*name|family\s*name|surname|lname/i

# Full name
/^name$|full\s*name|your\s*name|candidate\s*name/i

# Autocomplete values
given-name, family-name, name
```

---

## Troubleshooting

### Issue: Signals not being extracted

**Check:**
1. Is `signal-extractor.js` loaded before `form-scanner.js`?
2. Check browser console for JavaScript errors
3. Verify element has the expected attributes

### Issue: API not receiving signals

**Check:**
1. Verify background.js is passing `signals` in message
2. Check network tab for request payload
3. Ensure API endpoint expects `signals` object

### Issue: Wrong field type classification

**Check:**
1. Review extracted signals in console
2. Check which signal has highest priority
3. Verify API classification logic handles edge cases

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Signal extraction per field | <5ms | `performance.now()` before/after |
| Total scan impact (50 fields) | <50ms increase | Compare scan time before/after |
| Memory increase | <5% | Browser memory profiler |
