import type { FormField, DetectionResult, FillResult } from '../types/index';

// ============================================
// Message Types
// ============================================
type MessageType = 'DETECT_FIELDS' | 'FILL_FIELDS';

interface Message {
  type: MessageType;
  payload?: unknown;
}

interface DetectionResponse {
  success: boolean;
  data?: DetectionResult;
  error?: string;
}

interface FillResponse {
  success: boolean;
  data?: FillResult;
  error?: string;
}

// ============================================
// Form Detection
// ============================================
const FIELD_SELECTORS = [
  'input[type="text"]',
  'input[type="email"]',
  'input[type="tel"]',
  'input[type="password"]',
  'textarea',
  'select',
  'input[type="checkbox"]',
];

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectFieldType(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): FormField['type'] {
  if (input instanceof HTMLInputElement) {
    if (input.type === 'email') return 'email';
    if (input.type === 'tel') return 'tel';
    if (input.type === 'checkbox') return 'checkbox';
    return 'text';
  }
  if (input instanceof HTMLTextAreaElement) return 'textarea';
  if (input instanceof HTMLSelectElement) return 'select';
  return 'text';
}

function getFieldLabel(input: HTMLElement): string {
  const labelId = input.getAttribute('id');
  if (labelId) {
    const label = document.querySelector(`label[for="${labelId}"]`);
    if (label) return label.textContent?.trim() || '';
  }

  const parent = input.parentElement;
  if (parent) {
    const label = parent.querySelector('label');
    if (label) return label.textContent?.trim() || '';
  }

  const ariaLabel = input.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const placeholder = input.getAttribute('placeholder');
  if (placeholder) return placeholder;

  const name = input.getAttribute('name');
  if (name) return name;

  return 'Unknown field';
}

function detectFieldsOnPage(): FormField[] {
  const fields: FormField[] = [];
  const seenLabels = new Set<string>();

  for (const selector of FIELD_SELECTORS) {
    const elements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);

    elements.forEach((element) => {
      if (element.hidden || element.disabled) return;

      const label = getFieldLabel(element);
      if (!label || seenLabels.has(label)) return;
      seenLabels.add(label);

      fields.push({
        id: generateFieldId(),
        label,
        type: detectFieldType(element),
        value: element.value || '',
        filled: !!element.value,
        detectedAt: new Date().toISOString(),
      });
    });
  }

  return fields;
}

// ============================================
// Form Filling
// ============================================
function fillFields(fields: FormField[]): FillResult {
  const errors: string[] = [];
  let filledCount = 0;

  for (const field of fields) {
    try {
      const elements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        FIELD_SELECTORS.join(', ')
      );

      for (const element of elements) {
        const label = getFieldLabel(element);
        if (label === field.label) {
          if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            element.checked = true;
          } else if (element instanceof HTMLSelectElement) {
            const option = Array.from(element.options).find(
              (opt) => opt.textContent?.toLowerCase().includes((field.value || '').toLowerCase())
            );
            if (option) {
              element.value = option.value;
            }
          } else {
            element.value = field.value || '';
          }

          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
          break;
        }
      }
    } catch (err) {
      errors.push(`Failed to fill field "${field.label}": ${err}`);
    }
  }

  return {
    success: errors.length === 0,
    filledCount,
    errors,
  };
}

// ============================================
// React App Injection (Shadow DOM)
// ============================================
let reactRoot: HTMLElement | null = null;

function injectReactApp(): void {
  if (reactRoot) return;

  const shadowHost = document.createElement('div');
  shadowHost.id = 'job-forms-helper-root';
  shadowHost.style.cssText = 'position: absolute; top: 0; right: 0; z-index: 999999;';

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  const container = document.createElement('div');
  shadow.appendChild(container);

  document.body.appendChild(shadowHost);
  reactRoot = container;
}

// ============================================
// Message Handler
// ============================================
function handleMessage(message: Message): DetectionResponse | FillResponse {
  const { type, payload } = message;

  switch (type) {
    case 'DETECT_FIELDS': {
      const fields = detectFieldsOnPage();
      const result: DetectionResult = {
        url: window.location.href,
        fields,
      };
      return { success: true, data: result };
    }

    case 'FILL_FIELDS': {
      const fields = payload as FormField[];
      const result = fillFields(fields);
      return { success: true, data: result };
    }

    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}

// ============================================
// Content Script Setup
// ============================================
function init(): void {
  console.log('[Content Script] Initialized on:', window.location.href);

  chrome.runtime.onMessage.addListener(
    (
      message: Message,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: DetectionResponse | FillResponse) => void
    ) => {
      const response = handleMessage(message);
      sendResponse(response);
      return true;
    }
  );

  injectReactApp();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}