/**
 * Field Filler for Job Forms Helper
 * Handles value injection into form fields with proper event dispatching
 * Supports React/Angular state synchronization via native setter pattern
 */

/**
 * Fill a form field with a value
 * @param {HTMLElement} element - The form element to fill
 * @param {string} value - The value to set
 * @param {Object} options - Additional options
 * @returns {Object} Fill result
 */
function fillField(element, value, options = {}) {
  const {
    hasData = true,
    maxlength = null
  } = options;

  if (!element) {
    return { success: false, error: 'Element not found' };
  }

  // Check if element is fillable
  if (!isElementFillable(element)) {
    return { success: false, error: 'Field is not fillable' };
  }

  try {
    const fieldType = getFieldType(element);
    let actualValue = value;
    let wasTruncated = false;
    let truncatedLength = value.length;

    // Handle maxlength truncation (FR-021)
    if (maxlength && value.length > maxlength) {
      actualValue = value.substring(0, maxlength);
      wasTruncated = true;
      truncatedLength = maxlength;
    }

    // Handle 'no data' case (FR-020)
    if (!hasData) {
      showNoDataIndicator(element);
      return { success: true, hasData: false };
    }

    // Fill based on element type
    switch (fieldType) {
      case 'select':
        fillSelect(element, actualValue);
        break;
      
      case 'contenteditable':
        fillContentEditable(element, actualValue);
        break;
      
      case 'textarea':
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
      case 'number':
      default:
        setFormValue(element, actualValue);
        break;
    }

    // Show truncated warning if applicable (FR-021)
    if (wasTruncated) {
      showTruncationWarning(element, truncatedLength, value.length);
    }

    // Add filled class for visual feedback
    element.classList.remove('jfh-field-detected', 'jfh-field-no-data', 'jfh-field-error');
    element.classList.add('jfh-field-filled');

    return {
      success: true,
      hasData: true,
      truncated: wasTruncated,
      originalLength: value.length,
      filledLength: actualValue.length
    };

  } catch (error) {
    element.classList.remove('jfh-field-filled');
    element.classList.add('jfh-field-error');
    return { success: false, error: error.message };
  }
}

/**
 * Set form value using native setter pattern for React/Angular compatibility
 * Dispatches input and change events with bubbles: true (FR-005)
 * @param {HTMLInputElement|HTMLTextAreaElement} element
 * @param {string} value
 */
function setFormValue(element, value) {
  // Focus the element first
  element.focus();

  // Get the native setter from the prototype
  const nativeSetter = Object.getOwnPropertyDescriptor(
    element.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype,
    'value'
  ).set;

  // Call the native setter
  nativeSetter.call(element, value);

  // Handle React's value tracker to prevent React from reverting the value
  if (element._valueTracker) {
    element._valueTracker.setValue('');
  }

  // Dispatch input event with bubbles: true (Constitution V, FR-005)
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Dispatch change event with bubbles: true (Constitution V, FR-005)
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Dispatch blur event for good measure
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Fill a select dropdown by matching option text (FR-016)
 * Case-insensitive substring match
 * @param {HTMLSelectElement} element
 * @param {string} value
 */
function fillSelect(element, value) {
  const options = Array.from(element.options);
  const searchValue = value.toLowerCase().trim();
  
  // Find matching option (case-insensitive substring match)
  let matchedOption = options.find(option => 
    option.textContent.toLowerCase().includes(searchValue)
  );
  
  // If no match, try exact match
  if (!matchedOption) {
    matchedOption = options.find(option => 
      option.textContent.toLowerCase() === searchValue ||
      option.value.toLowerCase() === searchValue
    );
  }
  
  if (matchedOption) {
    element.value = matchedOption.value;
    
    // Dispatch events for React/Angular
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  } else {
    // No matching option found
    console.warn(`[FieldFiller] No matching option found for: ${value}`);
  }
}

/**
 * Fill a contenteditable element (FR-022)
 * @param {HTMLElement} element
 * @param {string} value
 */
function fillContentEditable(element, value) {
  // Focus the element
  element.focus();
  
  // Set innerText (FR-022)
  element.innerText = value;
  
  // Dispatch input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Show 'no data' indicator on field (FR-020)
 * @param {HTMLElement} element
 */
function showNoDataIndicator(element) {
  // Remove any existing indicator
  const existingBadge = element.parentElement?.querySelector('.jfh-no-data-badge');
  if (existingBadge) existingBadge.remove();
  
  // Add visual class
  element.classList.remove('jfh-field-filled', 'jfh-field-error');
  element.classList.add('jfh-field-no-data');
  
  // Create badge element
  const badge = document.createElement('span');
  badge.className = 'jfh-no-data-badge';
  badge.textContent = 'No data';
  badge.title = 'No matching information found in resume';
  
  // Insert badge after element
  if (element.parentElement && element.nextElementSibling?.tagName !== 'SPAN') {
    element.insertAdjacentElement('afterend', badge);
  }
}

/**
 * Show truncation warning icon (FR-021)
 * @param {HTMLElement} element
 * @param {number} truncatedLength
 * @param {number} originalLength
 */
function showTruncationWarning(element, truncatedLength, originalLength) {
  // Remove any existing warning
  const existingWarning = element.parentElement?.querySelector('.jfh-warning-icon');
  if (existingWarning) existingWarning.remove();
  
  // Create warning icon
  const warning = document.createElement('span');
  warning.className = 'jfh-warning-icon';
  warning.title = `Value truncated from ${originalLength} to ${truncatedLength} characters due to field limit`;
  
  // Insert after element
  if (element.parentElement) {
    element.insertAdjacentElement('afterend', warning);
  }
}

/**
 * Show toast notification (FR-023)
 * @param {string} message
 * @param {string} type - 'error', 'success', 'warning'
 */
function showToast(message, type = 'error') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.jfh-toast');
  existingToasts.forEach(t => t.remove());
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `jfh-toast jfh-toast-${type}`;
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Show progress overlay during batch fill
 * @param {number} current
 * @param {number} total
 * @param {string} fieldName
 */
function showProgressOverlay(current, total, fieldName = '') {
  let overlay = document.querySelector('.jfh-progress-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'jfh-progress-overlay';
    overlay.innerHTML = `
      <div class="jfh-progress-box">
        <div class="jfh-progress-text">Filling form fields...</div>
        <div class="jfh-progress-bar">
          <div class="jfh-progress-fill" style="width: 0%"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  
  const textEl = overlay.querySelector('.jfh-progress-text');
  const fillEl = overlay.querySelector('.jfh-progress-fill');
  
  textEl.textContent = `Filling ${current}/${total}${fieldName ? `: ${fieldName}` : ''}`;
  fillEl.style.width = `${(current / total) * 100}%`;
}

/**
 * Hide progress overlay
 */
function hideProgressOverlay() {
  const overlay = document.querySelector('.jfh-progress-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  }
}

/**
 * Clear all visual indicators from fields
 */
function clearFieldIndicators() {
  // Remove classes
  document.querySelectorAll('.jfh-field-filled, .jfh-field-no-data, .jfh-field-error, .jfh-field-detected, .jfh-field-skipped').forEach(el => {
    el.classList.remove('jfh-field-filled', 'jfh-field-no-data', 'jfh-field-error', 'jfh-field-detected', 'jfh-field-skipped');
  });
  
  // Remove badges and warnings
  document.querySelectorAll('.jfh-no-data-badge, .jfh-warning-icon').forEach(el => el.remove());
  
  // Remove toasts
  document.querySelectorAll('.jfh-toast').forEach(el => el.remove());
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fillField,
    setFormValue,
    fillSelect,
    fillContentEditable,
    showNoDataIndicator,
    showTruncationWarning,
    showToast,
    showProgressOverlay,
    hideProgressOverlay,
    clearFieldIndicators
  };
}
