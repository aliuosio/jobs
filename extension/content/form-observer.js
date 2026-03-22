/**
 * Form Observer for Job Forms Helper
 * Uses MutationObserver to detect dynamically loaded forms
 * Debounces mutations and tracks processed forms to prevent duplicates
 */

const MAX_TRACKED_FIELDS = 200;

/**
 * FormObserver class for detecting dynamic form changes
 * Extended to detect individual input/textarea/select elements (FR-001)
 */
class FormObserver {
  /**
   * @param {Object} options
   * @param {number} options.debounceMs - Debounce time in milliseconds (default: 300ms)
   * @param {Function} options.onFormDetected - Callback when new forms are detected
   * @param {Function} options.onFieldDetected - Callback when new fields are detected (FR-001)
   * @param {number} options.maxWaitMs - Maximum wait time for form detection (default: 10000ms)
   * @param {number} options.maxFields - Maximum fields to track (default: 200, Clarification Q4)
   */
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 300
    this.maxWaitMs = options.maxWaitMs || 10000
    this.maxFields = options.maxFields || MAX_TRACKED_FIELDS
    this.onFormDetected = options.onFormDetected || (() => {})
    this.onFieldDetected = options.onFieldDetected || (() => {})
    
    this.observer = null
    this.processedForms = new WeakSet()
    this.processedFields = new WeakSet()
    this.pendingMutations = []
    this.debounceTimer = null
    this.scanStartTime = null
    this.isScanning = false
    this.detectedFieldCount = 0
  }

  start() {
    if (this.isScanning) return
    
    this.isScanning = true
    this.scanStartTime = Date.now()
    
    console.log('[FormObserver] Starting observer...')
    
    this.scanForForms()
    this.scanOrphanInputs()
    
    this.observer = new MutationObserver((mutations) => {
      this.handleMutationsDebounced(mutations)
    })
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    if (this.maxWaitMs > 0) {
      setTimeout(() => {
        this.completeScan()
      }, this.maxWaitMs)
    }
  }

  stop() {
    this.isScanning = false
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    
    console.log('[FormObserver] Stopped')
  }

  handleMutationsDebounced(mutations) {
    this.pendingMutations.push(...mutations)
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processPendingMutations()
    }, this.debounceMs)
  }

  processPendingMutations() {
    const formsToProcess = new Set()
    const fieldsToProcess = new Set()
    
    console.log('[FormObserver] Processing', this.pendingMutations.length, 'mutations')
    
    this.pendingMutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'FORM') {
            formsToProcess.add(node)
          } else if (node.querySelector) {
            const forms = node.querySelectorAll('form')
            forms.forEach(form => formsToProcess.add(form))
          }
          
          const fieldTagNames = ['INPUT', 'TEXTAREA', 'SELECT']
          if (fieldTagNames.includes(node.tagName)) {
            fieldsToProcess.add(node)
          }
          
          if (node.querySelectorAll) {
            const fields = node.querySelectorAll('input, textarea, select')
            fields.forEach(field => fieldsToProcess.add(field))
          }
        }
      })
    })
    
    formsToProcess.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form)
        console.log('[FormObserver] New form detected')
        this.onFormDetected(form)
      }
    })
    
    fieldsToProcess.forEach(field => {
      if (this.processedFields.has(field) || this.processedForms.has(field)) {
        return
      }
      
      if (this.detectedFieldCount >= this.maxFields) {
        console.warn(`[FormObserver] Maximum field limit (${this.maxFields}) reached`)
        return
      }
      
      this.processedFields.add(field)
      this.detectedFieldCount++
      
      const fieldDescriptor = {
        id: `jfh-field-${this.detectedFieldCount}`,
        element: field,
        type: this._getFieldType(field),
        labelText: '',
        selector: this._generateSelector(field),
        isFillable: this._isFieldFillable(field)
      }
      
      console.log('[FormObserver] New field detected:', fieldDescriptor.id, field.tagName, field.type || '')
      this.onFieldDetected(field, fieldDescriptor)
    })
    
    this.pendingMutations = []
    this.debounceTimer = null
  }

  _getFieldType(element) {
    const tagName = element.tagName.toLowerCase()
    
    if (tagName === 'textarea') return 'textarea'
    if (tagName === 'select') return 'select'
    if (tagName === 'input') {
      return element.type?.toLowerCase() || 'text'
    }
    
    return 'unknown'
  }

  _generateSelector(element) {
    if (element.id) return `#${element.id}`
    
    const path = []
    let current = element
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase()
      
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c)
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).join('.')
        }
      }
      
      const siblings = current.parentElement?.children
      if (siblings && siblings.length > 1) {
        const index = Array.from(siblings).indexOf(current) + 1
        selector += `:nth-child(${index})`
      }
      
      path.unshift(selector)
      current = current.parentElement
      
      if (path.length >= 4) break
    }
    
    return path.join(' > ')
  }

  scanForForms() {
    const forms = document.querySelectorAll('form')
    console.log('[FormObserver] scanForForms - found', forms.length, 'forms')
    
    forms.forEach(form => {
      if (!this.processedForms.has(form)) {
        this.processedForms.add(form)
        console.log('[FormObserver] scanForForms - processing form')
        this.onFormDetected(form)
      }
    })
  }

  scanOrphanInputs() {
    const inputs = document.querySelectorAll('input, textarea, select')
    console.log('[FormObserver] scanOrphanInputs - found', inputs.length, 'inputs')
    
    inputs.forEach(input => {
      if (!input.form && !this.processedFields.has(input)) {
        this.processedFields.add(input)
        this.detectedFieldCount++
        
        const fieldDescriptor = {
          id: `jfh-field-${this.detectedFieldCount}`,
          element: input,
          type: this._getFieldType(input),
          labelText: '',
          selector: this._generateSelector(input),
          isFillable: this._isFieldFillable(input)
        }
        
        console.log('[FormObserver] scanOrphanInputs - processing orphan:', fieldDescriptor.id)
        this.onFieldDetected(input, fieldDescriptor)
      }
    })
  }

  completeScan() {
    this.stop()
    
    if (typeof this.onScanComplete === 'function') {
      this.onScanComplete()
    }
  }

  setOnScanComplete(callback) {
    this.onScanComplete = callback
  }

  getProcessedCount() {
    return this.detectedFieldCount
  }

  reset() {
    this.processedForms = new WeakSet()
    this.processedFields = new WeakSet()
    this.pendingMutations = []
    this.detectedFieldCount = 0
  }

  reconcileFields() {
    const currentFields = document.querySelectorAll('input, textarea, select')
    let count = 0
    
    currentFields.forEach(field => {
      if (document.body.contains(field)) {
        count++
      }
    })
    
    this.detectedFieldCount = count
    
    console.log(`[FormObserver] Reconciled: ${count} fields remain`)
  }
}

function createFormObserver(onFormDetected, options = {}) {
  const observer = new FormObserver({
    ...options,
    onFormDetected
  })
  
  return observer
}

