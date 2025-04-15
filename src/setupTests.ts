
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TimeEntry } from './types';

// Set up localStorage mock
const storageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: jest.fn(() => {
      return Object.keys(store).length;
    }),
    // Helper method for tests to directly access store
    _getStore: () => store,
    // Helper method to set entries directly
    _setEntries: (entries: TimeEntry[]) => {
      store['timeEntries'] = JSON.stringify(entries);
    },
    // Helper method to get entries directly
    _getEntries: (): TimeEntry[] => {
      const entriesJson = store['timeEntries'];
      return entriesJson ? JSON.parse(entriesJson) : [];
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: storageMock });

// Mock CustomEvent constructor
class MockCustomEvent extends Event {
  detail: any;
  
  constructor(type: string, options?: CustomEventInit) {
    super(type, options);
    this.detail = options?.detail || {};
  }
}
(global as any).CustomEvent = MockCustomEvent;

// Mock console methods to reduce test noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Override console methods for tests
console.error = (...args) => {
  if (
    // Filter out specific React errors that clutter test output
    /Warning.*not wrapped in act/.test(args[0]) ||
    /Warning.*cannot update a component/.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (
    // Filter out specific React warnings that clutter test output
    /Warning.*cannot update a component/.test(args[0])
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

console.log = (...args) => {
  if (
    // Filter out debug logs during tests
    /\[debug\]/.test(args[0]) ||
    /\[TimeEntryProvider\]/.test(args[0])
  ) {
    return;
  }
  originalConsoleLog(...args);
};

// Add method to mock date in tests globally
const mockDate = (date: Date | string | number) => {
  const originalDate = global.Date;
  const mockDate = new originalDate(new originalDate(date).getTime());
  
  global.Date = class extends originalDate {
    constructor(date?: Date | string | number) {
      if (date) {
        return super(date);
      }
      return mockDate;
    }
    
    static now() {
      return mockDate.getTime();
    }
  } as DateConstructor;
  
  return () => {
    global.Date = originalDate;
  };
};

// Add to global object for easy access in tests
(global as any).mockDate = mockDate;
(global as any).resetMockDate = () => {
  global.Date = Date;
};

// Clean up after all tests
afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  
  // Reset any mocked dates
  (global as any).resetMockDate();
});

// Add test helper methods to global scope
(global as any).testHelpers = {
  localStorage: storageMock,
  
  setupTimeEntries: (entries: TimeEntry[]) => {
    storageMock._setEntries(entries);
  },
  
  getTimeEntries: (): TimeEntry[] => {
    return storageMock._getEntries();
  },
  
  clearStorage: () => {
    storageMock.clear();
  }
};

// Reset localStorage before each test
beforeEach(() => {
  storageMock.clear();
});
