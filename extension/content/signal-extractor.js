/**
 * Signal Extractor for Job Forms Helper
 * Extracts semantic signals from form fields for API-based field type classification
 * 
 * Signals extracted:
 * - autocomplete attribute (HTML5 standardized hint)
 * - aria-label attribute
 * - placeholder attribute
 * - hint text (aria-describedby, sibling hints)
 * - name and id attributes
 */

/**
 * Default maximum length for signal text values
 * @type {number}
 */
const DEFAULT_MAX_LENGTH = 500;

/**
 * Common CSS class names for hint/help text elements
 * @type {string[]}
 */
const HINT_CLASS_NAMES = [
  'hint',
  'help-text',
  'field-help',
  'description',
  'helper-text',
  'form-text',
  'field-description',
  'assistive-text'
];

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Clean and truncate signal text values
 * @param {string|null|undefined} text - The text to sanitize
 * @param {number} maxLength - Maximum allowed length (default 500)
 * @returns {string|null} Sanitized text or null if invalid
 */
function sanitizeSignalText(text, maxLength = DEFAULT_MAX_LENGTH) {
  if (!text || typeof text !== 'string') return null;
  
  const sanitized = text
    .trim()
    .replace(/\s+/g, ' ');
  
  if (!sanitized) return null;
  
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength) 
    : sanitized;
}

// ============================================================================
// ATTRIBUTE EXTRACTION
// ============================================================================

/**
 * Extract autocomplete attribute from input element
 * High priority signal - standardized HTML5 attribute
 * @param {HTMLElement} element - The input element
 * @returns {string|null} The autocomplete value or null
 */
function extractAutocomplete(element) {
  if (!element) return null;
  return element.getAttribute('autocomplete') || null;
}

/**
 * Extract aria-label attribute from input element
 * High priority signal - explicit accessibility description
 * @param {HTMLElement} element - The input element
 * @returns {string|null} The aria-label value or null
 */
function extractAriaLabel(element) {
  if (!element) return null;
  const ariaLabel = element.getAttribute('aria-label');
  return ariaLabel ? sanitizeSignalText(ariaLabel) : null;
}

/**
 * Extract placeholder attribute from input element
 * Medium priority signal - may contain hints or examples
 * @param {HTMLElement} element - The input element
 * @returns {string|null} The placeholder value or null
 */
function extractPlaceholder(element) {
  if (!element) return null;
  const placeholder = element.getAttribute('placeholder');
  return placeholder ? sanitizeSignalText(placeholder) : null;
}

// ============================================================================
// HINT TEXT EXTRACTION
// ============================================================================

/**
 * Extract hint/description text from aria-describedby or sibling elements
 * @param {HTMLElement} element - The input element
 * @returns {Object|null} Hint object with text and source, or null
 */
function extractHintText(element) {
  if (!element) return null;
  
  // 1. Check aria-describedby (most reliable)
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const hint = resolveAriaDescribedBy(describedBy);
    if (hint) {
      return { text: hint, source: 'aria-describedby' };
    }
  }
  
  // 2. Check sibling hint elements
  const siblingHint = findSiblingHint(element);
  if (siblingHint) {
    return { text: siblingHint.text, source: siblingHint.source };
  }
  
  // 3. Check parent container description
  const parentDesc = findParentDescription(element);
  if (parentDesc) {
    return { text: parentDesc, source: 'parent-description' };
  }
  
  return null;
}

/**
 * Resolve aria-describedby references to text content
 * @param {string} describedBy - Space-separated list of element IDs
 * @returns {string|null} Combined text content or null
 */
function resolveAriaDescribedBy(describedBy) {
  if (!describedBy) return null;
  
  const ids = describedBy.split(' ').filter(id => id.trim());
  const texts = ids
    .map(id => {
      const el = document.getElementById(id);
      return el ? el.textContent : null;
    })
    .filter(Boolean)
    .join(' ');
  
  return texts ? sanitizeSignalText(texts, 1000) : null;
}

/**
 * Find hint text in sibling elements with hint classes
 * @param {HTMLElement} element - The input element
 * @returns {Object|null} Object with text and source, or null
 */
function findSiblingHint(element) {
  if (!element || !element.parentElement) return null;
  
  const parent = element.parentElement;
  
  // Check for hint elements with common class names
  for (const className of HINT_CLASS_NAMES) {
    const hintEl = parent.querySelector(`.${className}`);
    if (hintEl && !hintEl.contains(element) && !element.contains(hintEl)) {
      const text = sanitizeSignalText(hintEl.textContent, 1000);
      if (text) {
        return { text, source: 'sibling-hint' };
      }
    }
  }
  
  // Check for elements with data-hint attribute
  const dataHint = parent.querySelector('[data-hint]');
  if (dataHint && !dataHint.contains(element)) {
    const text = sanitizeSignalText(dataHint.textContent || dataHint.getAttribute('data-hint'), 1000);
    if (text) {
      return { text, source: 'sibling-hint' };
    }
  }
  
  // Check for small/description elements near the input
  const smallEl = parent.querySelector('small:not(:has(input))');
  if (smallEl && !smallEl.contains(element)) {
    const text = sanitizeSignalText(smallEl.textContent, 1000);
    if (text && text.length > 1) {
      return { text, source: 'sibling-hint' };
    }
  }
  
  return null;
}

/**
 * Find description text in parent container
 * @param {HTMLElement} element - The input element
 * @returns {string|null} Description text or null
 */
function findParentDescription(element) {
  if (!element) return null;
  
  // Look for parent container with description-related classes
  const parentDesc = element.closest('[class*="description"], [class*="help"], [class*="field-group"]');
  if (parentDesc && !parentDesc.contains(element) === false) {
    // Extract text that's not from the input itself
    const clone = parentDesc.cloneNode(true);
    const inputs = clone.querySelectorAll('input, textarea, select, label');
    inputs.forEach(input => input.remove());
    
    const text = sanitizeSignalText(clone.textContent, 1000);
    if (text && text.length > 1) {
      return text;
    }
  }
  
  return null;
}

// ============================================================================
// FIELD TYPE HELPERS
// ============================================================================

/**
 * Get the HTML field type from element
 * @param {HTMLElement} element - The input element
 * @returns {string} The field type
 */
function getFieldType(element) {
  if (!element) return 'unknown';
  
  const tagName = element.tagName?.toLowerCase();
  
  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';
  if (element.isContentEditable || element.contentEditable === 'true') return 'contenteditable';
  
  if (tagName === 'input') {
    return element.type?.toLowerCase() || 'text';
  }
  
  return 'unknown';
}

// ============================================================================
// MAIN SIGNAL BUILDER
// ============================================================================

/**
 * Build complete FieldSignals object from element and label data
 * Aggregates all extraction functions into single structured object
 * @param {HTMLElement} element - The input element
 * @param {Object} labelData - Label data from form scanner
 * @param {string} labelData.text - Label text content
 * @param {string} labelData.confidence - Detection confidence (high/medium/low)
 * @param {string} labelData.source - Detection method (for-id, wrapper, etc.)
 * @param {HTMLElement} labelData.element - The label element (optional)
 * @returns {Object} Complete FieldSignals object
 */
function buildFieldSignals(element, labelData) {
  if (!element) {
    return {
      label: null,
      autocomplete: null,
      ariaLabel: null,
      placeholder: null,
      name: null,
      id: null,
      hint: null,
      htmlType: 'unknown'
    };
  }
  
  // Build label signal
  const label = labelData ? {
    text: sanitizeSignalText(labelData.text),
    title: labelData.element?.title || null,
    confidence: labelData.confidence || 'low',
    source: labelData.source || 'none'
  } : null;
  
  return {
    label,
    autocomplete: extractAutocomplete(element),
    ariaLabel: extractAriaLabel(element),
    placeholder: extractPlaceholder(element),
    name: element.name || null,
    id: element.id || null,
    hint: extractHintText(element),
    htmlType: getFieldType(element)
  };
}

/**
 * Count the number of non-null signals in a FieldSignals object
 * Useful for debugging and metrics
 * @param {Object} signals - FieldSignals object
 * @returns {number} Count of non-null signals
 */
function countSignals(signals) {
  if (!signals) return 0;
  
  let count = 0;
  if (signals.label?.text) count++;
  if (signals.autocomplete) count++;
  if (signals.ariaLabel) count++;
  if (signals.placeholder) count++;
  if (signals.name) count++;
  if (signals.id) count++;
  if (signals.hint?.text) count++;
  
  return count;
}

/**
 * Convert FieldSignals to API-compatible payload format
 * @param {Object} signals - FieldSignals object
 * @returns {Object} API-compatible signals payload
 */
function signalsToPayload(signals) {
  if (!signals) return null;
  
  return {
    label_text: signals.label?.text || null,
    label_title: signals.label?.title || null,
    label_confidence: signals.label?.confidence || null,
    label_source: signals.label?.source || null,
    autocomplete: signals.autocomplete || null,
    aria_label: signals.ariaLabel || null,
    placeholder: signals.placeholder || null,
    input_name: signals.name || null,
    input_id: signals.id || null,
    hint_text: signals.hint?.text || null,
    hint_source: signals.hint?.source || null,
    html_type: signals.htmlType || 'unknown'
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Main functions
    buildFieldSignals,
    signalsToPayload,
    countSignals,
    
    // Individual extraction functions
    extractAutocomplete,
    extractAriaLabel,
    extractPlaceholder,
    extractHintText,
    
    // Helper functions
    sanitizeSignalText,
    resolveAriaDescribedBy,
    findSiblingHint,
    findParentDescription,
    getFieldType,
    
    // Constants
    DEFAULT_MAX_LENGTH,
    HINT_CLASS_NAMES
  };
}
