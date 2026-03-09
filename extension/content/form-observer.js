/**
 * Form Observer for Job Forms Helper
 * Uses MutationObserver to detect dynamically loaded forms
 * Debounces mutations and tracks processed forms to prevent duplicates
 */

/**
 * FormObserver class for detecting dynamic form changes
 */
class FormObserver {
  /**
   * @param {Object} options
   * @param {number} options.debounceMs - Debounce time in milliseconds (default: 300ms)
   * @param {Function} options.onFormDetected - Callback when new forms are detected
   * @param {number} options.maxWaitMs - Maximum wait time for form detection (default: 10000ms)
   */
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 300;
    this.maxWaitMs = options.maxWaitMs || 10000; // FR-019
    this.onFormDetected = options.onFormDetected || (() => {});
    
    this.observer = null;
    this.processedForms = new WeakSet();
    this.pendingMutations = [];
    this.debounceTimer = null;
    this.scanStartTime = null;
    this.isScanning = false;
  }

  /**
   * Start observing DOM for form changes
   */
  start() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.scanStartTime = Date.now();
    
    // Initial scan of existing forms
    this.scanForForms();
    
    // Set up MutationObserver
    this.observer = new MutationObserver((mutations) => {
      this.handleMutationsDebounced(mutations);
    });
    
    // Observe entire document body for added nodes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Set maximum wait timer (FR-019)
    if (this.maxWaitMs > 0) {
      setTimeout(() => {
        this.completeScan();
      }, this.maxWaitMs);
    }
  }

  /**
   * Stop observing
   */
  stop() {
    this.isScanning = false;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Handle mutations with debouncing (300ms)
   * @param {MutationRecord[]} mutations
   */
  handleMutationsDebounced(mutations) {
    // Accumulate mutations
    this.pendingMutations.push(...mutations);
    
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.processPendingMutations();
    }, this.debounceMs);
  }

  /**
   * Process accumulated mutations after debounce
   */
  processPendingMutations() {
    const formsToProcess = new Set();
    
    // Find all new forms in pending mutations
    this.pendingMutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is a form
          if (node.tagName === 'FORM') {
            formsToProcess.add(node);
          } else if (node.querySelector) {
            // Check for forms within the added node
            const forms = node.querySelectorAll('form');
            forms.forEach(form => formsToProcess.add(form));
          }
        }
      });
    });
    
    // Process new forms that haven't been processed yet
    formsToProcess.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form);
        this.onFormDetected(form);
      }
    });
    
    // Clear pending mutations
    this.pendingMutations = [];
    this.debounceTimer = null;
  }

  /**
   * Initial scan for existing forms
   */
  scanForForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form);
        this.onFormDetected(form);
      }
    });
    
    // Also scan for input fields outside forms
    this.scanOrphanInputs();
  }

  /**
   * Scan for inputs not inside forms
   */
  scanOrphanInputs() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      if (!input.form && !this.processedForms.has(input)) {
        // Create a pseudo-form container reference
        const container = input.closest('div, section, article') || input.parentElement;
        if (container && !this.processedForms.has(container)) {
          this.processedForms.add(container);
          this.onFormDetected(container);
        }
      }
    });
  }

  /**
   * Complete scan and notify completion
   */
  completeScan() {
    this.stop();
    
    // Notify that scan is complete
    if (typeof this.onScanComplete === 'function') {
      this.onScanComplete();
    }
  }

  /**
   * Set callback for scan completion
   * @param {Function} callback
   */
  setOnScanComplete(callback) {
    this.onScanComplete = callback;
  }

  /**
   * Get count of processed forms
   * @returns {number}
   */
  getProcessedCount() {
    // WeakSet doesn't have a size property, so we track separately
    return this._processedCount || 0;
  }

  /**
   * Reset processed forms tracking
   */
  reset() {
    this.processedForms = new WeakSet();
    this.pendingMutations = [];
    this._processedCount = 0;
  }
}

/**
 * Create and initialize a form observer
 * @param {Function} onFormDetected - Callback for detected forms
 * @param {Object} options - Additional options
 * @returns {FormObserver}
 */
function createFormObserver(onFormDetected, options = {}) {
  const observer = new FormObserver({
    ...options,
    onFormDetected
  });
  
  return observer;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormObserver,
    createFormObserver
  };
}
