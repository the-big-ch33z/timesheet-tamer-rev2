
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Set up localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true
});

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

// Clean up after all tests
afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
