import type { JobLink, FormField, UserProfile } from '../types/index';

// ============================================
// Message Types
// ============================================
type MessageType = 'GET_JOBS' | 'DETECT_FIELDS' | 'FILL_FIELDS' | 'GET_PROFILE';

interface Message {
  type: MessageType;
  payload?: unknown;
}

interface Response {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// Message Handlers
// ============================================
async function handleGetJobs(): Promise<Response> {
  try {
    const jobs = await new Promise<JobLink[]>((resolve) => {
      chrome.storage.local.get('jobs', (result) => {
        resolve((result.jobs as JobLink[]) || []);
      });
    });
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function handleDetectFields(tabId: number): Promise<Response> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'DETECT_FIELDS' });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function handleFillFields(tabId: number, fields: FormField[]): Promise<Response> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'FILL_FIELDS',
      payload: fields,
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function handleGetProfile(): Promise<Response> {
  try {
    const profile = await new Promise<UserProfile | null>((resolve) => {
      chrome.storage.local.get('userProfile', (result) => {
        resolve((result.userProfile as UserProfile) || null);
      });
    });
    return { success: true, data: profile };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Message Router
// ============================================
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<Response> {
  const { type, payload } = message;

  switch (type) {
    case 'GET_JOBS':
      return handleGetJobs();

    case 'GET_PROFILE':
      return handleGetProfile();

    case 'DETECT_FIELDS': {
      const tabId = sender.tab?.id;
      if (!tabId) {
        return { success: false, error: 'No active tab' };
      }
      return handleDetectFields(tabId);
    }

    case 'FILL_FIELDS': {
      const tabId = sender.tab?.id;
      if (!tabId) {
        return { success: false, error: 'No active tab' };
      }
      const fields = payload as FormField[];
      return handleFillFields(tabId, fields);
    }

    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}

// ============================================
// Runtime Setup
// ============================================
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: Response) => void
  ) => {
    handleMessage(message, sender).then(sendResponse);
    return true;
  }
);

// ============================================
// Background Script Ready
// ============================================
console.log('[Background] Script loaded');