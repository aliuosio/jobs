import { beforeAll, afterAll, vi } from 'vitest';

// Include jest-dom matchers
import '@testing-library/jest-dom/vitest';

// Mock chrome API for extension environment
const createStorageMock = () => {
  const storage: Record<string, unknown> = {};

  return {
    storage: {
      local: {
        get: vi.fn((keys: string | string[], callback: (result: Record<string, unknown>) => void) => {
          const resultObj: Record<string, unknown> = {};
          const keyList = Array.isArray(keys) ? keys : [keys];
          for (const key of keyList) {
            if (storage[key] !== undefined) {
              resultObj[key] = storage[key];
            }
          }
          setTimeout(() => callback(resultObj), 0);
        }),
        set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
          Object.assign(storage, items);
          setTimeout(() => callback?.(), 0);
        }),
        remove: vi.fn((keys: string | string[], callback?: () => void) => {
          const keyList = Array.isArray(keys) ? keys : [keys];
          for (const key of keyList) {
            delete storage[key];
          }
          setTimeout(() => callback?.(), 0);
        }),
        clear: vi.fn((callback?: () => void) => {
          Object.keys(storage).forEach((key) => delete storage[key]);
          setTimeout(() => callback?.(), 0);
        }),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
    },
    runtime: {
      lastError: null,
      id: 'test-extension-id',
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
    },
    tabs: {
      sendMessage: vi.fn(),
      query: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
};

// Set up global chrome mock
vi.stubGlobal('chrome', createStorageMock());

// Global beforeAll
beforeAll(() => {
  // Set up any global test state
});

// Global afterAll
afterAll(() => {
  // Clean up any global test state
});