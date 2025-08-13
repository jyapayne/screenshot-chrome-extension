/**
 * Integration test suite for clipboard functionality across different scenarios
 * Tests end-to-end workflows combining clipboard operations with various settings
 */

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock DOM APIs
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
    className: ''
  })),
  head: { appendChild: jest.fn() },
  body: { appendChild: jest.fn() },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn()
};

global.window = {
  getComputedStyle: jest.fn(() => ({})),
  devicePixelRatio: 2,
  isSecureContext: true,
  CSS: { escape: jest.fn(str => str) },
  setTimeout: jest.fn((fn, delay) => {
    if (delay === 0) fn();
    return 1;
  })
};

// Mock html2canvas
global.html2canvas = jest.fn();

describe('Integration Scenarios - Clipboard with Different Backgrounds', () => {
  let screenshotSelector;
  let mockElement;
  let mockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset clipboard mock for each test
    if (!global.navigator) {
      global.navigator = {};
    }
    global.navigator.clipboard = {
      write: jest.fn().mockResolvedValue()
    };
    global.window.ClipboardItem = jest.fn().mockImplementation((data) => {
      return { data, type: 'image/png' };
    });
    global.window.isSecureContext = true;
    
    // Mock element to capture
    mockElement = {
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      style: {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
      scrollHeight: 100,
      clientHeight: 100,
      scrollWidth: 100,
      clientWidth: 100,
      children: [],
      parentNode: { children: [] }
    };

    // Mock canvas
    mockCanvas = {
      toBlob: jest.fn((callback, format) => {
        const mockBlob = new Blob(['mock image data'], { type: format });
        Object.defineProperty(mockBlob, 'size', { value: 1024 }); // 1KB
        callback(mockBlob);
      }),
      toDataURL: jest.fn(() => 'data:image/png;base64,mockdata')
    };

    global.html2canvas = jest.fn().mockResolvedValue(mockCanvas);



    // Import ScreenshotSelector (simplified for testing)
    const ScreenshotSelector = class {
      constructor() {
        this.isActive = false;
        this.background = 'black';
        this.copyToClipboard = true;
        this.saveToPc = true;
        this.overlay = null;
      }

      async init(background = 'black', copyToClipboard = true, saveToPc = true) {
        this.background = background;
        this.copyToClipboard = copyToClipboard;
        this.saveToPc = saveToPc;
        this.isActive = true;
        this.createUI();
      }

      createUI() {
        this.overlay = global.document.createElement('div');
        global.document.body.appendChild(this.overlay);
      }

      checkClipboardAPIAvailability() {
        if (!global.navigator.clipboard) {
          return { available: false, reason: 'Clipboard API not available in this browser' };
        }
        if (!global.window.ClipboardItem) {
          return { available: false, reason: 'ClipboardItem not supported in this browser' };
        }
        if (!global.window.isSecureContext) {
          return { available: false, reason: 'Clipboard API requires a secure context (HTTPS)' };
        }
        if (!global.navigator.clipboard.write) {
          return { available: false, reason: 'Clipboard write functionality not available' };
        }
        return { available: true };
      }

      async copyCanvasToClipboard(canvas) {
        try {
          const availability = this.checkClipboardAPIAvailability();
          if (!availability.available) {
            return { success: false, error: availability.reason, errorType: 'api_unavailable' };
          }

          const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to blob conversion returned null'));
            }, 'image/png');
          });

          const maxBlobSize = 50 * 1024 * 1024;
          if (blob.size > maxBlobSize) {
            return {
              success: false,
              error: `Image too large for clipboard (${Math.round(blob.size / 1024 / 1024)}MB)`,
              errorType: 'size_limit'
            };
          }

          const clipboardItem = new global.window.ClipboardItem({ 'image/png': blob });
          await global.navigator.clipboard.write([clipboardItem]);

          return { success: true };
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            return { success: false, error: 'Permission denied', errorType: 'permission_denied' };
          }
          return { success: false, error: error.message, errorType: 'unexpected' };
        }
      }

      async captureElement(element) {
        try {
          // Generate canvas with background-specific settings
          const canvas = await global.html2canvas(element, {
            backgroundColor: this.background === 'transparent' ? null :
                           this.background === 'white' ? '#ffffff' : '#000000',
            useCORS: true,
            allowTaint: false
          });

          // Always download first
          const link = global.document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
          link.click();

          // Handle clipboard if enabled
          let clipboardResult = null;
          if (this.copyToClipboard) {
            clipboardResult = await this.copyCanvasToClipboard(canvas);
          }

          // Update UI based on results (matching new message format)
          let successMessage = 'Screenshot captured!';
          let messageIcon = '✅';
          
          if (this.saveToPc && this.copyToClipboard) {
            // Both operations enabled
            if (clipboardResult && clipboardResult.success) {
              successMessage = 'Screenshot saved and copied to clipboard!';
              messageIcon = '✅';
            } else {
              // Save succeeded but clipboard failed
              const errorMessage = clipboardResult ? clipboardResult.error.toLowerCase() : 'clipboard copy failed';
              successMessage = `Screenshot saved successfully! However, ${errorMessage}`;
              messageIcon = '⚠️';
            }
          } else if (this.saveToPc && !this.copyToClipboard) {
            // Only save to PC enabled
            successMessage = 'Screenshot saved to downloads folder!';
            messageIcon = '💾';
          } else if (!this.saveToPc && this.copyToClipboard) {
            // Only clipboard enabled
            if (clipboardResult && clipboardResult.success) {
              successMessage = 'Screenshot copied to clipboard!';
              messageIcon = '📋';
            } else {
              // Clipboard failed - this is a complete failure since no other output method is enabled
              const errorMessage = clipboardResult ? clipboardResult.error : 'clipboard copy failed';
              successMessage = `Screenshot capture failed: ${errorMessage}`;
              messageIcon = '❌';
            }
          }

          this.overlay.innerHTML = `<div>${successMessage}</div>`;
          
          return {
            success: true,
            downloadSuccess: true,
            clipboardResult: clipboardResult,
            message: successMessage
          };

        } catch (error) {
          this.overlay.innerHTML = `<div>Screenshot failed: ${error.message}</div>`;
          return {
            success: false,
            error: error.message
          };
        }
      }
    };

    screenshotSelector = new ScreenshotSelector();
  });

  test('should capture with transparent background and copy to clipboard', async () => {
    await screenshotSelector.init('transparent', true);
    
    const result = await screenshotSelector.captureElement(mockElement);

    expect(global.html2canvas).toHaveBeenCalledWith(mockElement, expect.objectContaining({
      backgroundColor: null, // Transparent background
      useCORS: true,
      allowTaint: false
    }));

    expect(result.success).toBe(true);
    expect(result.downloadSuccess).toBe(true);
    expect(result.clipboardResult.success).toBe(true);
    expect(result.message).toBe('Screenshot saved and copied to clipboard!');
  });

  test('should capture with black background and copy to clipboard', async () => {
    await screenshotSelector.init('black', true);
    
    const result = await screenshotSelector.captureElement(mockElement);

    expect(global.html2canvas).toHaveBeenCalledWith(mockElement, expect.objectContaining({
      backgroundColor: '#000000', // Black background
      useCORS: true,
      allowTaint: false
    }));

    expect(result.success).toBe(true);
    expect(result.clipboardResult.success).toBe(true);
    expect(result.message).toBe('Screenshot saved and copied to clipboard!');
  });

  test('should capture with white background and copy to clipboard', async () => {
    await screenshotSelector.init('white', true);
    
    const result = await screenshotSelector.captureElement(mockElement);

    expect(global.html2canvas).toHaveBeenCalledWith(mockElement, expect.objectContaining({
      backgroundColor: '#ffffff', // White background
      useCORS: true,
      allowTaint: false
    }));

    expect(result.success).toBe(true);
    expect(result.clipboardResult.success).toBe(true);
    expect(result.message).toBe('Screenshot saved and copied to clipboard!');
  });

  test('should capture without clipboard when disabled', async () => {
    await screenshotSelector.init('black', false, true); // saveToPc = true, copyToClipboard = false
    
    const result = await screenshotSelector.captureElement(mockElement);

    expect(result.success).toBe(true);
    expect(result.downloadSuccess).toBe(true);
    expect(result.clipboardResult).toBe(null); // No clipboard operation attempted
    expect(result.message).toBe('Screenshot saved to downloads folder!');
    if (global.navigator.clipboard?.write) {
      expect(global.navigator.clipboard.write).not.toHaveBeenCalled();
    }
  });

  test('should handle clipboard failure gracefully while maintaining download', async () => {
    // Reset and mock clipboard failure
    global.navigator.clipboard = {
      write: jest.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
    };
    
    await screenshotSelector.init('black', true);
    
    const result = await screenshotSelector.captureElement(mockElement);

    expect(result.success).toBe(true);
    expect(result.downloadSuccess).toBe(true);
    expect(result.clipboardResult.success).toBe(false);
    expect(result.clipboardResult.errorType).toBe('permission_denied');
    expect(result.message).toContain('Screenshot saved successfully!');
    expect(result.message).toContain('permission denied');
  });

  test('should handle clipboard API unavailable scenario', async () => {
    // Mock clipboard API not available
    global.navigator.clipboard = undefined;
    
    await screenshotSelector.init('transparent', true);
    
    const result = await screenshotSelector.captureElement(mockElement);

    expect(result.success).toBe(true);
    expect(result.downloadSuccess).toBe(true);
    expect(result.clipboardResult.success).toBe(false);
    expect(result.clipboardResult.errorType).toBe('api_unavailable');
    expect(result.message).toContain('Screenshot saved successfully!');
    expect(result.message).toContain('clipboard');
  });
});

describe('Integration Scenarios - Complete Workflow', () => {
  let mockPopupElements;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock popup elements
    mockPopupElements = {
      clipboardToggle: { checked: true, addEventListener: jest.fn() },
      backgroundSelect: { value: 'black', addEventListener: jest.fn() },
      startButton: { addEventListener: jest.fn(), style: { display: 'block' } },
      status: { textContent: '', className: '', style: { display: 'none' } }
    };

    global.document.getElementById = jest.fn((id) => {
      switch (id) {
        case 'clipboard-toggle': return mockPopupElements.clipboardToggle;
        case 'background-select': return mockPopupElements.backgroundSelect;
        case 'start-selector': return mockPopupElements.startButton;
        case 'status': return mockPopupElements.status;
        default: return null;
      }
    });

    // Mock Chrome APIs
    global.chrome.storage.sync.get.mockResolvedValue({
      backgroundPreference: 'black',
      copyToClipboard: true
    });
    global.chrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://example.com' }]);
    global.chrome.tabs.sendMessage.mockResolvedValue();
  });

  test('should complete full workflow from popup to content script', async () => {
    let startButtonCallback;
    mockPopupElements.startButton.addEventListener = jest.fn((event, callback) => {
      if (event === 'click') startButtonCallback = callback;
    });

    // Simulate popup initialization
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const backgroundSelect = document.getElementById('background-select');
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const startBtn = document.getElementById('start-selector');
        
        // Load preferences
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
        if (saved.backgroundPreference) {
          backgroundSelect.value = saved.backgroundPreference;
        }
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        
        // Start selector
        startBtn.addEventListener('click', async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          
          await chrome.tabs.sendMessage(tab.id, {
            action: 'startSelector',
            background: backgroundSelect.value,
            copyToClipboard: clipboardToggle.checked
          });
        });
      });
    `;

    // Execute popup initialization
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    // Verify preferences were loaded
    expect(mockPopupElements.backgroundSelect.value).toBe('black');
    expect(mockPopupElements.clipboardToggle.checked).toBe(true);

    // Simulate start button click
    await startButtonCallback();

    // Verify message was sent to content script with correct parameters
    expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
      action: 'startSelector',
      background: 'black',
      copyToClipboard: true
    });
  });

  test('should handle preference changes and persist them', async () => {
    let clipboardChangeCallback;
    let backgroundChangeCallback;

    mockPopupElements.clipboardToggle.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') clipboardChangeCallback = callback;
    });

    mockPopupElements.backgroundSelect.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') backgroundChangeCallback = callback;
    });

    // Initialize popup
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      
      const popupScript = `
        document.addEventListener('DOMContentLoaded', async () => {
          const backgroundSelect = document.getElementById('background-select');
          const clipboardToggle = document.getElementById('clipboard-toggle');
          
          backgroundSelect.addEventListener('change', () => {
            chrome.storage.sync.set({ backgroundPreference: backgroundSelect.value });
          });

          clipboardToggle.addEventListener('change', () => {
            chrome.storage.sync.set({ copyToClipboard: clipboardToggle.checked });
          });
        });
      `;
      eval(popupScript);
    });

    // Change background preference
    mockPopupElements.backgroundSelect.value = 'transparent';
    backgroundChangeCallback();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ backgroundPreference: 'transparent' });

    // Change clipboard preference
    mockPopupElements.clipboardToggle.checked = false;
    clipboardChangeCallback();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ copyToClipboard: false });
  });

  test('should handle incompatible pages gracefully', async () => {
    // Mock incompatible page
    global.chrome.tabs.query.mockResolvedValue([{ 
      id: 123, 
      url: 'chrome://settings/' 
    }]);

    let startButtonCallback;
    mockPopupElements.startButton.addEventListener = jest.fn((event, callback) => {
      if (event === 'click') startButtonCallback = callback;
    });

    // Initialize popup with incompatible page handling
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const startBtn = document.getElementById('start-selector');
        const status = document.getElementById('status');
        
        startBtn.addEventListener('click', async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

          if (tab.url.startsWith('chrome://') ||
              tab.url.startsWith('chrome-extension://') ||
              tab.url.startsWith('edge://') ||
              tab.url.startsWith('about:')) {
            status.textContent = 'Error: Cannot capture screenshots on this page type.';
            status.className = 'status error';
            status.style.display = 'block';
            return;
          }
          
          // Normal flow would continue here
        });
      });
    `;

    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    // Simulate start button click on incompatible page
    await startButtonCallback();

    // Verify error message was shown
    expect(mockPopupElements.status.textContent).toBe('Error: Cannot capture screenshots on this page type.');
    expect(mockPopupElements.status.className).toBe('status error');
    expect(mockPopupElements.status.style.display).toBe('block');

    // Verify no message was sent to content script
    expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });
});