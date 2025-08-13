/**
 * Jest setup file for clipboard functionality tests
 * Provides common mocks and utilities for all test files
 */

// Keep global and window navigator in sync regardless of direct reassignment
(() => {
  try {
    let navigatorStore = (typeof global !== 'undefined' && global.navigator) || (typeof window !== 'undefined' && window.navigator) || {};
    if (typeof global !== 'undefined') {
      Object.defineProperty(global, 'navigator', {
        configurable: true,
        get: () => navigatorStore,
        set: (val) => {
          navigatorStore = val || {};
          if (typeof window !== 'undefined') {
            try { window.navigator = navigatorStore; } catch (_) {}
          }
        }
      });
    }
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'navigator', {
        configurable: true,
        get: () => navigatorStore,
        set: (val) => { navigatorStore = val || {}; }
      });
    }
  } catch (_) {}
})();

// Global test utilities
global.createMockBlob = (data = 'mock data', type = 'image/png', size = 1024) => {
  const blob = new Blob([data], { type });
  Object.defineProperty(blob, 'size', { value: size });
  return blob;
};

global.createMockCanvas = (width = 100, height = 100) => {
  return {
    width,
    height,
    toBlob: jest.fn((callback, format = 'image/png') => {
      const blob = global.createMockBlob('mock canvas data', format);
      callback(blob);
    }),
    toDataURL: jest.fn((format = 'image/png') => `data:${format};base64,mockcanvasdata`),
    getContext: jest.fn(() => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn()
    }))
  };
};

global.createMockElement = (options = {}) => {
  return {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    },
    style: {},
    getBoundingClientRect: () => ({
      left: options.left || 0,
      top: options.top || 0,
      width: options.width || 100,
      height: options.height || 100
    }),
    scrollHeight: options.scrollHeight || 100,
    clientHeight: options.clientHeight || 100,
    scrollWidth: options.scrollWidth || 100,
    clientWidth: options.clientWidth || 100,
    children: options.children || [],
    parentNode: { children: options.siblings || [] },
    tagName: options.tagName || 'DIV',
    id: options.id || '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
};

// Mock Chrome extension APIs consistently
global.mockChromeAPIs = () => {
  const existingChrome = global.chrome || {};
  const existingStorage = (existingChrome.storage && existingChrome.storage.sync) || {};
  const existingRuntime = existingChrome.runtime || {};
  const existingTabs = existingChrome.tabs || {};

  global.chrome = {
    storage: {
      sync: {
        get: existingStorage.get || jest.fn().mockResolvedValue({}),
        set: existingStorage.set || jest.fn().mockResolvedValue()
      }
    },
    runtime: {
      sendMessage: existingRuntime.sendMessage || jest.fn().mockResolvedValue(),
      onMessage: {
        addListener: (existingRuntime.onMessage && existingRuntime.onMessage.addListener) || jest.fn()
      }
    },
    tabs: {
      query: existingTabs.query || jest.fn().mockResolvedValue([{ id: 123, url: 'https://example.com' }]),
      sendMessage: existingTabs.sendMessage || jest.fn().mockResolvedValue()
    }
  };
};

// Mock DOM APIs consistently
global.mockDOMAPIs = () => {
  // Document
  const existingDocument = global.document || {};
  const existingCreateElement = existingDocument.createElement;
  global.document = existingDocument;
  if (!global.document.createElement) {
    global.document.createElement = jest.fn(() => ({
      style: {},
      classList: { add: jest.fn(), remove: jest.fn() },
      appendChild: jest.fn(),
      click: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerHTML: '',
      textContent: '',
      id: '',
      className: '',
      checked: false,
      value: ''
    }));
  }
  if (!global.document.head) global.document.head = { appendChild: jest.fn() };
  if (!global.document.body) global.document.body = { appendChild: jest.fn() };
  if (!global.document.addEventListener) global.document.addEventListener = jest.fn();
  if (!global.document.removeEventListener) global.document.removeEventListener = jest.fn();
  if (!global.document.querySelectorAll) global.document.querySelectorAll = jest.fn(() => []);
  if (!global.document.getElementById) global.document.getElementById = jest.fn(() => null);

  // Window
  const existingWindow = global.window || {};
  global.window = existingWindow;
  // Ensure a shared navigator reference exists early
  if (!global.navigator) global.navigator = (existingWindow && existingWindow.navigator) || {};
  if (!global.window.navigator) global.window.navigator = global.navigator;
  if (!global.window.getComputedStyle) global.window.getComputedStyle = jest.fn(() => ({}));
  if (typeof global.window.devicePixelRatio === 'undefined') global.window.devicePixelRatio = 2;
  if (typeof global.window.isSecureContext === 'undefined') global.window.isSecureContext = true;
  if (!global.window.CSS) global.window.CSS = { escape: jest.fn(str => str) };
  if (!global.window.setTimeout) {
    global.window.setTimeout = jest.fn((fn, delay) => {
      if (delay === 0) fn();
      return 1;
    });
  }
  if (!global.window.clearTimeout) global.window.clearTimeout = jest.fn();
  if (!global.window.close) global.window.close = jest.fn();
};

// Mock clipboard APIs with different scenarios
global.mockClipboardAPI = (scenario = 'supported') => {
  switch (scenario) {
    case 'supported': {
      const existingNavigator = global.navigator || {};
      const existingClipboard = existingNavigator.clipboard || {};
      if (!existingClipboard.write || !jest.isMockFunction?.(existingClipboard.write)) {
        existingClipboard.write = jest.fn().mockResolvedValue();
      }
      const mergedNavigator = { ...existingNavigator, clipboard: existingClipboard };
      global.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      if (!global.window.ClipboardItem) global.window.ClipboardItem = jest.fn();
      if (typeof global.window.isSecureContext === 'undefined') global.window.isSecureContext = true;
      break;
    }
    case 'no-clipboard':
      global.navigator = {};
      if (!global.window) global.window = {};
      global.window.navigator = global.navigator;
      break;
    case 'no-clipboarditem': {
      const existingNavigator = global.navigator || {};
      const clipboard = existingNavigator.clipboard || { write: jest.fn() };
      const mergedNavigator = { ...existingNavigator, clipboard };
      global.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.ClipboardItem = undefined;
      break;
    }
    case 'insecure-context': {
      const existingNavigator = global.navigator || {};
      const clipboard = existingNavigator.clipboard || { write: jest.fn() };
      const mergedNavigator = { ...existingNavigator, clipboard };
      global.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.ClipboardItem = global.window.ClipboardItem || jest.fn();
      global.window.isSecureContext = false;
      break;
    }
    case 'permission-denied': {
      const existingNavigator = global.navigator || {};
      const clipboard = { write: jest.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')) };
      const mergedNavigator = { ...existingNavigator, clipboard };
      global.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.ClipboardItem = global.window.ClipboardItem || jest.fn();
      global.window.isSecureContext = true;
      break;
    }
    case 'security-error': {
      const existingNavigator = global.navigator || {};
      const clipboard = { write: jest.fn().mockRejectedValue(new DOMException('Security error', 'SecurityError')) };
      const mergedNavigator = { ...existingNavigator, clipboard };
      global.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.navigator = mergedNavigator;
      if (!global.window) global.window = {};
      global.window.ClipboardItem = global.window.ClipboardItem || jest.fn();
      global.window.isSecureContext = true;
      break;
    }
  }
};

// Setup default mocks before each test
beforeEach(() => {
  // Clear all mocks first
  jest.clearAllMocks();
  
  global.mockChromeAPIs();
  global.mockDOMAPIs();
  global.mockClipboardAPI('supported');
  
  // Mock html2canvas
  global.html2canvas = jest.fn().mockResolvedValue(global.createMockCanvas());
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Custom matchers for better test assertions
expect.extend({
  toHaveBeenCalledWithClipboardMessage(received, expectedBackground, expectedClipboard) {
    const calls = received.mock.calls;
    const matchingCall = calls.find(call => 
      call[1] && 
      call[1].action === 'startSelector' &&
      call[1].background === expectedBackground &&
      call[1].copyToClipboard === expectedClipboard
    );
    
    if (matchingCall) {
      return {
        message: () => `Expected not to be called with clipboard message`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected to be called with clipboard message (background: ${expectedBackground}, clipboard: ${expectedClipboard})`,
        pass: false
      };
    }
  },
  
  toHaveClipboardResult(received, expectedSuccess, expectedErrorType) {
    if (!received.clipboardResult) {
      return {
        message: () => `Expected clipboard result to exist`,
        pass: false
      };
    }
    
    const success = received.clipboardResult.success === expectedSuccess;
    const errorType = !expectedErrorType || received.clipboardResult.errorType === expectedErrorType;
    
    if (success && errorType) {
      return {
        message: () => `Expected clipboard result not to match`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected clipboard result (success: ${expectedSuccess}, errorType: ${expectedErrorType}), got (success: ${received.clipboardResult.success}, errorType: ${received.clipboardResult.errorType})`,
        pass: false
      };
    }
  }
});