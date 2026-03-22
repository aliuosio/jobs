/**
 * Form Scanner for Job Forms Helper
 * Detects form fields and extracts label associations
 * Supports multiple detection strategies: for-id, wrapper, aria, proximity, name/id fallback
 */

/**
 * Confidence levels for label detection
 */
const Confidence = {
  HIGH: 'high',    // for-id, wrapper, aria-labelledby
  MEDIUM: 'medium', // proximity, name/id fallback
  LOW: 'low'
};

/**
 * Supported input field types (FR-002)
 */
const SUPPORTED_INPUT_TYPES = ['text', 'email', 'tel', 'url', 'number', 'date'];

/**
 * Maximum distance for proximity-based label detection (FR-017)
 */
const PROXIMITY_MAX_DISTANCE = 50; // pixels

/**
 * Generate a unique ID for a form field
 */
let fieldIdCounter = 0;
function generateFieldId() {
  return `jfh-field-${++fieldIdCounter}`;
}

/**
 * Check if an element is fillable (not readonly, disabled, hidden, or password)
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isElementFillable(element) {
  if (!element) return false;
  
  // Skip password fields (FR-008)
  if (element.type === 'password') return false;
  
  // Skip readonly fields
  if (element.readOnly) return false;
  
  // Skip disabled fields
  if (element.disabled) return false;
  
  // Skip hidden fields
  if (element.type === 'hidden') return false;
  
  // Skip elements not visible in the DOM
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  return true;
}

/**
 * Check if element is a supported input type
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isSupportedInputType(element) {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'textarea') return true;
  if (tagName === 'select') return true;
  if (tagName === 'input') {
    const type = element.type?.toLowerCase() || 'text';
    return SUPPORTED_INPUT_TYPES.includes(type);
  }
  
  // Check for contenteditable
  if (element.isContentEditable || element.contentEditable === 'true') return true;
  
  return false;
}

/**
 * Get field type from element
 * @param {HTMLElement} element
 * @returns {string}
 */
function getFieldType(element) {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';
  if (element.isContentEditable || element.contentEditable === 'true') return 'contenteditable';
  
  if (tagName === 'input') {
    return element.type?.toLowerCase() || 'text';
  }
  
  return 'unknown';
}

/**
 * Generate a CSS selector for an element
 * @param {HTMLElement} element
 * @returns {string}
 */
function generateSelector(element) {
  if (element.id) return `#${element.id}`;
  
  const path = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).join('.');
      }
    }
    
    const siblings = current.parentElement?.children;
    if (siblings && siblings.length > 1) {
      const index = Array.from(siblings).indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
    
    if (path.length >= 4) break;
  }
  
  return path.join(' > ');
}

// ============================================================================
// DETECTION METHODS
// ============================================================================

/**
 * Strategy 1: Detect labels using explicit for/id association (HIGH confidence)
 * @param {HTMLFormElement|Document} container
 * @returns {Array<LabelInputPair>}
 */
function detectForIdLabels(container = document) {
  const pairs = [];
  const labels = container.querySelectorAll('label[for]');
  
  labels.forEach(label => {
    const forId = label.getAttribute('for');
    if (!forId) return;
    
    const input = document.getElementById(forId);
    if (!input || !isSupportedInputType(input)) return;
    
    pairs.push({
      labelElement: label,
      labelText: label.textContent.trim(),
      labelFor: forId,
      inputElement: input,
      inputType: getFieldType(input),
      inputName: input.name || null,
      detectionMethod: 'for-id',
      confidence: Confidence.HIGH
    });
  });
  
  return pairs;
}

/**
 * Strategy 2: Detect labels wrapping inputs (HIGH confidence)
 * @param {HTMLFormElement|Document} container
 * @returns {Array<LabelInputPair>}
 */
function detectWrapperLabels(container = document) {
  const pairs = [];
  const labels = container.querySelectorAll('label');
  
  labels.forEach(label => {
    // Skip labels that use for/id (already handled)
    if (label.getAttribute('for')) return;
    
    // Find input inside label
    const input = label.querySelector('input, textarea, select');
    if (!input || !isSupportedInputType(input)) return;
    
    // Get label text, excluding the input element's content
    const labelText = Array.from(label.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE || 
                     (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'INPUT' && 
                      node.tagName !== 'TEXTAREA' && node.tagName !== 'SELECT'))
      .map(node => node.textContent)
      .join('')
      .trim();
    
    if (!labelText) return;
    
    pairs.push({
      labelElement: label,
      labelText: labelText,
      labelFor: null,
      inputElement: input,
      inputType: getFieldType(input),
      inputName: input.name || null,
      detectionMethod: 'wrapper',
      confidence: Confidence.HIGH
    });
  });
  
  return pairs;
}

/**
 * Strategy 3: Detect labels using aria-labelledby (HIGH confidence)
 * @param {HTMLFormElement|Document} container
 * @returns {Array<LabelInputPair>}
 */
function detectAriaLabels(container = document) {
  const pairs = [];
  const inputs = container.querySelectorAll('input, textarea, select, [contenteditable="true"]');
  
  inputs.forEach(input => {
    if (!isSupportedInputType(input)) return;
    
    const labelledBy = input.getAttribute('aria-labelledby');
    if (!labelledBy) return;
    
    const labelElement = document.getElementById(labelledBy);
    if (!labelElement) return;
    
    const labelText = labelElement.textContent.trim();
    if (!labelText) return;
    
    pairs.push({
      labelElement: labelElement,
      labelText: labelText,
      labelFor: labelledBy,
      inputElement: input,
      inputType: getFieldType(input),
      inputName: input.name || null,
      detectionMethod: 'aria-labelledby',
      confidence: Confidence.HIGH
    });
  });
  
  return pairs;
}

/**
 * Strategy 4: Detect labels using proximity heuristic (MEDIUM confidence)
 * Uses 50px maximum distance (FR-017)
 * @param {HTMLFormElement|Document} container
 * @param {Set<HTMLElement>} alreadyPairedInputs
 * @returns {Array<LabelInputPair>}
 */
function detectProximityLabels(container = document, alreadyPairedInputs = new Set()) {
  const pairs = [];
  const inputs = container.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    // Skip already paired inputs
    if (alreadyPairedInputs.has(input)) return;
    if (!isSupportedInputType(input)) return;
    
    // Find nearest label-like element
    const container = input.closest('div, p, section, fieldset, li, td, th');
    if (!container) return;
    
    // Look for label elements or elements with label-like classes
    const labelCandidates = container.querySelectorAll('label, .label, [class*="label"], .field-label, .form-label');
    
    let bestLabel = null;
    let bestDistance = PROXIMITY_MAX_DISTANCE;
    
    labelCandidates.forEach(label => {
      // Skip if label is inside the input or vice versa
      if (label.contains(input) || input.contains(label)) return;
      
      const distance = getElementDistance(label, input);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestLabel = label;
      }
    });
    
    if (bestLabel) {
      const labelText = bestLabel.textContent.trim();
      if (labelText) {
        pairs.push({
          labelElement: bestLabel,
          labelText: labelText,
          labelFor: null,
          inputElement: input,
          inputType: getFieldType(input),
          inputName: input.name || null,
          detectionMethod: 'proximity',
          confidence: Confidence.MEDIUM
        });
      }
    }
  });
  
  return pairs;
}

/**
 * Strategy 5: Use name or id attribute as fallback label text (MEDIUM confidence)
 * For fields with no label element (FR-024)
 * @param {HTMLFormElement|Document} container
 * @param {Set<HTMLElement>} alreadyPairedInputs
 * @returns {Array<LabelInputPair>}
 */
function getNameIdFallback(container = document, alreadyPairedInputs = new Set()) {
  const pairs = [];
  const inputs = container.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    // Skip already paired inputs
    if (alreadyPairedInputs.has(input)) return;
    if (!isSupportedInputType(input)) return;
    
    // Try name attribute first, then id
    let labelText = input.name || input.id || null;
    if (!labelText) return;
    
    // Clean up the label text
    labelText = labelText
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
    
    if (labelText.length < 2) return;
    
    pairs.push({
      labelElement: null,
      labelText: labelText,
      labelFor: null,
      inputElement: input,
      inputType: getFieldType(input),
      inputName: input.name || null,
      detectionMethod: 'name-id-fallback',
      confidence: Confidence.MEDIUM
    });
  });
  
  return pairs;
}

/**
 * Calculate distance between two elements
 * @param {HTMLElement} el1
 * @param {HTMLElement} el2
 * @returns {number} Distance in pixels
 */
function getElementDistance(el1, el2) {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();
  
  // Calculate center points
  const center1 = {
    x: rect1.left + rect1.width / 2,
    y: rect1.top + rect1.height / 2
  };
  
  const center2 = {
    x: rect2.left + rect2.width / 2,
    y: rect2.top + rect2.height / 2
  };
  
  // Euclidean distance
  return Math.sqrt(
    Math.pow(center2.x - center1.x, 2) + 
    Math.pow(center2.y - center1.y, 2)
  );
}

// ============================================================================
// MAIN SCAN FUNCTIONS
// ============================================================================

/**
 * Scan a form for all fillable fields
 * @param {HTMLFormElement|Document} formOrContainer
 * @returns {Array<FormField>}
 */
function scanForm(formOrContainer = document) {
  const fields = [];
  const pairedInputs = new Set();
  
  // Run detection strategies in priority order
  const forIdPairs = detectForIdLabels(formOrContainer);
  forIdPairs.forEach(pair => {
    pairedInputs.add(pair.inputElement);
    fields.push(createFormField(pair));
  });
  
  const wrapperPairs = detectWrapperLabels(formOrContainer);
  wrapperPairs.forEach(pair => {
    if (!pairedInputs.has(pair.inputElement)) {
      pairedInputs.add(pair.inputElement);
      fields.push(createFormField(pair));
    }
  });
  
  const ariaPairs = detectAriaLabels(formOrContainer);
  ariaPairs.forEach(pair => {
    if (!pairedInputs.has(pair.inputElement)) {
      pairedInputs.add(pair.inputElement);
      fields.push(createFormField(pair));
    }
  });
  
  const proximityPairs = detectProximityLabels(formOrContainer, pairedInputs);
  proximityPairs.forEach(pair => {
    if (!pairedInputs.has(pair.inputElement)) {
      pairedInputs.add(pair.inputElement);
      fields.push(createFormField(pair));
    }
  });
  
  const fallbackPairs = getNameIdFallback(formOrContainer, pairedInputs);
  fallbackPairs.forEach(pair => {
    if (!pairedInputs.has(pair.inputElement)) {
      pairedInputs.add(pair.inputElement);
      fields.push(createFormField(pair));
    }
  });
  
  // Filter out non-fillable fields
  return fields.filter(field => field.isFillable);
}

/**
 * Create a FormField object from a LabelInputPair
 * @param {LabelInputPair} pair
 * @returns {FormField}
 */
function createFormField(pair) {
  const fillable = isElementFillable(pair.inputElement);
  const cleanedLabel = typeof cleanLabelText === 'function' ? cleanLabelText(pair.labelText) : pair.labelText;
  const signals = buildFieldSignals(pair.inputElement, {
    text: cleanedLabel,
    confidence: pair.confidence,
    source: pair.detectionMethod,
    element: pair.labelElement
  });
  
  return {
    id: generateFieldId(),
    element: pair.inputElement,
    type: pair.inputType,
    name: pair.inputName,
    elementId: pair.inputElement.id || null,
    labelText: cleanedLabel,
    labelConfidence: pair.confidence,
    detectionMethod: pair.detectionMethod,
    isFillable: fillable,
    currentValue: pair.inputElement.value || pair.inputElement.textContent || null,
    filledValue: null,
    selector: generateSelector(pair.inputElement),
    formId: pair.inputElement.form?.id || null,
    signals: signals
  };
}

/**
 * Scan the entire page for forms and fields
 * @returns {Array<FormField>}
 */
function scanPage() {
  return scanForm(document);
}

/**
 * Get field by ID from scanned fields
 * @param {string} fieldId
 * @param {Array<FormField>} fields
 * @returns {FormField|null}
 */
function getFieldById(fieldId, fields) {
  return fields.find(f => f.id === fieldId) || null;
}

/**
 * Sort fields by DOM order (for batch fill)
 * @param {Array<FormField>} fields
 * @returns {Array<FormField>}
 */
function sortByDomOrder(fields) {
  return [...fields].sort((a, b) => {
    const position = a.element.compareDocumentPosition(b.element);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    scanForm,
    scanPage,
    getFieldById,
    sortByDomOrder,
    isElementFillable,
    isSupportedInputType,
    detectForIdLabels,
    detectWrapperLabels,
    detectAriaLabels,
    detectProximityLabels,
    getNameIdFallback,
    Confidence,
    PROXIMITY_MAX_DISTANCE,
    signalExtractor: typeof buildFieldSignals !== 'undefined' ? {
      buildFieldSignals,
      signalsToPayload,
      extractAutocomplete,
      extractAriaLabel,
      extractPlaceholder,
      extractHintText
    } : null
  };
}

if (typeof window !== 'undefined') {
  window.scanPage = scanPage;
  window.scanForm = scanForm;
  window.isElementFillable = isElementFillable;
}
