# Research: Dynamic Form Field Detection

## Research Findings

### Problem: FormObserver Only Detects `<form>` Elements

**Location**: `extension/content/form-observer.js`, lines 100-130

**Current behavior**: The `processPendingMutations()` method only detects `<form>` elements being added to the DOM. Individual `<input>`, `<textarea>`, and `<select>` elements are ignored.

**Impact**: On SPA-style pages like Proxify, form fields are loaded dynamically after initial page load. The current implementation misses these fields entirely.

### Root Cause Analysis

```javascript
// form-observer.js:100-130
processPendingMutations() {
  const formsToProcess = new Set();
  
  this.pendingMutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Only checks for FORM elements
        if (node.tagName === 'FORM') {
          formsToProcess.add(node);
        } else if (node.querySelector) {
          // Only looks for forms INSIDE containers
          const forms = node.querySelectorAll('form');
          forms.forEach(form => formsToProcess.add(form));
        }
      }
    });
  });
  // ...
}
```

### Solution Options

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A: Extend existing observer** | Add field detection alongside form detection | Single observer, shares infrastructure | Slightly more complex mutation processing |
| **B: Separate observer for fields** | Create new MutationObserver specifically for fields | Clear separation of concerns | Two observers, potential race conditions |
| **C: Periodic re-scan** | Use setInterval to re-scan page | Simple implementation | Performance hit on complex pages |
| **D: Container-level detection** | Only detect when field containers added | Less granular | Misses fields added to existing containers |

### Decision: Option A - Extend Existing Observer

**Rationale**:
1. Maintains single observer pattern (performance)
2. Shares debounce mechanism (consistency)
3. Allows unified callback structure (simplicity)
4. WeakSet already handles deduplication (efficiency)

**Alternatives Rejected**:
- Option B: Two observers adds complexity and potential sync issues
- Option C: Periodic re-scan wastes resources and may miss fields between scans
- Option D: Too coarse-grained for SPA forms where fields load incrementally

### Implementation Details

**Field Selector**: `'input, textarea, select'`

**Detection Strategy**:
1. Check if direct node is a supported field element
2. QuerySelectorAll descendants for field elements
3. Filter out already-processed fields via WeakSet
4. Call `onFieldDetected` for each new field

**Performance Considerations**:
- WeakSet provides O(1) lookup for deduplication
- Debounce batches rapid mutations (300ms)
- No querySelectorAll on entire document (scoped to mutations only)

## Testing Strategy

### Unit Tests (Node.js with mock DOM)

1. **Direct field addition**: Mock `<input>` added to page
2. **Nested field addition**: Mock `<div>` with `<input>` inside added
3. **Deduplication**: Same field triggers detection twice
4. **Multiple fields**: Batch of fields added simultaneously
5. **Mixed content**: Forms and fields added together

### Manual Testing

1. Load Proxify URL with extension installed
2. Navigate through multi-step form
3. Verify fields appear in popup as they load

## References

- MDN: [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- MDN: [WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- Extension Manifest v3 docs (Firefox-specific)
