/**
 * Jest setup file for clipboard functionality tests
 * Provides common mocks and utilities for all test files
 */

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
  global.chrome = {
    storage: {
      sync: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue()
      }
    },
    runtime: {
      sendMessage: jest.fn().mockResolvedValue(),
      onMessage: {
        addListener: jest.fn()
      }
    },
    tabs: {
      query: jest.fn().mockResolvedValue([{ id: 123, url: 'https://example.com' }]),
      sendMessage: jest.fn().mockResolvedValue()
    }
  };
};

// Mock DOM APIs consistently
global.mockDOMAPIs = () => {
  global.document = {
    createElement: jest.fn(() => ({
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
    })),
    head: { appendChild: jest.fn() },
    body: { appendChild: jest.fn() },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    getElementById: jest.fn(() => null)
  };

  global.window = {
    getComputedStyle: jest.fn(() => ({})),
    devicePixelRatio: 2,
    isSecureContext: true,
    CSS: { escape: jest.fn(str => str) },
    setTimeout: jest.fn((fn, delay) => {
      if (delay === 0) fn();
      return 1;
    }),
    clearTimeout: jest.fn(),
    close: jest.fn()
  };
};

// Mock clipboard APIs with different scenarios
global.mockClipboardAPI = (scenario = 'supported') => {
  switch (scenario) {
    case 'supported':
      global.navigator = {
        clipboard: {
          write: jest.fn().mockResolvedValue()
        }
      };
      global.window.ClipboardItem = jest.fn();
      global.window.isSecureContext = true;
      break;
      
    case 'no-clipboard':
      global.navigator = {};
      break;
      
    case 'no-clipboarditem':
      global.navigator = {
        clipboard: { write: jest.fn() }
      };
      global.window.ClipboardItem = undefined;
      break;
      
    case 'insecure-context':
      global.navigator = {
        clipboard: { write: jest.fn() }
      };
      global.window.ClipboardItem = jest.fn();
      global.window.isSecureContext = false;
      break;
      
    case 'permission-denied':
      global.navigator = {
        clipboard: {
          write: jest.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
        }
      };
      global.window.ClipboardItem = jest.fn();
      global.window.isSecureContext = true;
      break;
      
    case 'security-error':
      global.navigator = {
        clipboard: {
          write: jest.fn().mockRejectedValue(new DOMException('Security error', 'SecurityError'))
        }
      };
      global.window.ClipboardItem = jest.fn();
      global.window.isSecureContext = true;
      break;
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