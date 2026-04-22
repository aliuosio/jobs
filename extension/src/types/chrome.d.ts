/// <reference types="chrome" />

// ============================================
// Chrome Storage API
// ============================================
interface ChromeStorageArea {
  get(
    keys: string | string[] | Record<string, unknown>,
    callback: (result: Record<string, unknown>) => void
  ): void;
  set(
    items: Record<string, unknown>,
    callback?: () => void
  ): void;
}

interface ChromeStorage {
  local: ChromeStorageArea;
}

// ============================================
// Chrome Runtime API
// ============================================
interface Message {
  type: string;
  payload?: unknown;
}

interface MessageSender {
  tab?: {
    id?: number;
    url?: string;
  };
}

interface Runtime {
  onMessage: {
    addListener(
      listener: (
        message: Message,
        sender: MessageSender,
        sendResponse: (response: unknown) => void
      ) => void
    ): void;
  };
}

interface TabsSendMessageOptions {
  tabId: number;
  message: Message;
}

// ============================================
// Chrome Tabs API
// ============================================
interface Tabs {
  sendMessage(tabId: number, message: Message): Promise<unknown>;
}

interface Chrome {
  storage: ChromeStorage;
  runtime: Runtime;
  tabs: Tabs;
}

declare const chrome: Chrome;