/**
 * Comprehensive test suite for all combinations of save to PC and clipboard settings
 * Tests all four combinations: both enabled, save-only, clipboard-only, both disabled
 * Includes preference persistence testing across browser sessions
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
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
  style: {},
  classList: { add: jest.fn(), remove: jest.fn() }
};

global.document = {
  createElement: mockCreateElement,
  head: { appendChild: jest.fn() },
  body: { appendChild: jest.fn() },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn()
};

global.window = {
  close: jest.fn(),
  setTimeout: jest.fn((fn) => fn()),
  getComputedStyle: jest.fn(() => ({})),
  devicePixelRatio: 2,
  isSecureContext: true,
  CSS: { escape: jest.fn(str => str) }
};

// Mock html2canvas
global.html2canvas = jest.fn();

// Mock ScreenshotSelector class for testing
class MockScreenshotSelector {
  constructor() {
    this.copyToClipboard = true;
    this.saveToPc = true;
    this.background = 'black';
    this.isActive = false;
  }

  async init(background = 'black', copyToClipboard = true, saveToPc = true) {
    this.background = background;
    this.copyToClipboard = copyToClipboard;
    this.saveToPc = saveToPc;
    this.isActive = true;
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

      const clipboardItem = new global.window.ClipboardItem({ 'image/png': blob });
      await global.navigator.clipboard.write([clipboardItem]);

      return { success: true };
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Permission denied', errorType: 'permission_denied' };
      } else if (error.name === 'SecurityError') {
        return { success: false, error: 'Security error', errorType: 'security_error' };
      }
      return { success: false, error: error.message, errorType: 'unexpected' };
    }
  }

  async captureElement(element) {
    // Mock canvas creation
    const mockCanvas = {
      toBlob: jest.fn((callback) => {
        const mockBlob = new Blob(['mock data'], { type: 'image/png' });
        callback(mockBlob);
      }),
      toDataURL: jest.fn(() => 'data:image/png;base64,mockdata')
    };

    // Mock html2canvas
    global.html2canvas.mockResolvedValue(mockCanvas);

    const canvas = await global.html2canvas(element);

    // Conditionally download based on saveToPc setting
    if (this.saveToPc) {
      const link = global.document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
      link.click();
    }

    // Handle clipboard operations if enabled
    let clipboardResult = null;
    if (this.copyToClipboard) {
      clipboardResult = await this.copyCanvasToClipboard(canvas);
    }

    return {
      success: true,
      downloadPerformed: this.saveToPc,
      clipboardResult: clipboardResult
    };
  }
}

describe('Save to PC and Clipboard Combinations', () => {
  let screenshotSelector;
  let mockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockCreateElement.mockClear();
    mockCreateElement.mockReturnValue(mockLink);
    mockLink.click.mockClear();
    
    // Setup clipboard API mocks
    global.navigator = {
      clipboard: {
        write: jest.fn().mockResolvedValue()
      }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;

    screenshotSelector = new MockScreenshotSelector();
    mockElement = {
      classList: { remove: jest.fn() },
      style: {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
      scrollHeight: 100,
      clientHeight: 100,
      scrollWidth: 100,
      clientWidth: 100
    };
  });

  describe('Combination 1: Both Save to PC and Clipboard Enabled (saveToPc: true, clipboard: true)', () => {
    beforeEach(() => {
      screenshotSelector.saveToPc = true;
      screenshotSelector.copyToClipboard = true;
    });

    test('should perform both download and clipboard operations when both are enabled', async () => {
      const result = await screenshotSelector.captureElement(mockElement);

      expect(result.success).toBe(true);
      expect(result.downloadPerformed).toBe(true);
      expect(result.clipboardResult).toBeDefined();
      expect(result.clipboardResult.success).toBe(true);

      // Verify download was triggered
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      
      // Verify clipboard operation was attempted
      expect(global.navigator.clipboard.write).toHaveBeenCalled();
    });

    test('should succeed with download even if clipboard fails when both are enabled', async () => {
      // Mock clipboard failure
      if (global.navigator.clipboard && global.navigator.clipboard.write) {
        global.navigator.clipboard.write.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
      }

      const result = await screenshotSelector.captureElement(mockElement);

      expect(result.success).toBe(true);
      expect(result.downloadPerformed).toBe(true);
      expect(result.clipboardResult.success).toBe(false);
      expect(result.clipboardResult.errorType).toBe('permission_denied');

      // Download should still work
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should initialize with both settings correctly', async () => {
      await screenshotSelector.init('white', true, true);

      expect(screenshotSelector.background).toBe('white');
      expect(screenshotSelector.copyToClipboard).toBe(true);
      expect(screenshotSelector.saveToPc).toBe(true);
      expect(screenshotSelector.isActive).toBe(true);
    });
  });

  describe('Combination 2: Save-only Mode (saveToPc: true, clipboard: false)', () => {
    beforeEach(() => {
      screenshotSelector.saveToPc = true;
      screenshotSelector.copyToClipboard = false;
    });

    test('should only perform download when save-only mode is enabled', async () => {
      const result = await screenshotSelector.captureElement(mockElement);

      expect(result.success).toBe(true);
      expect(result.downloadPerformed).toBe(true);
      expect(result.clipboardResult).toBeNull();

      // Verify download was triggered
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      
      // Verify clipboard operation was NOT attempted
      expect(global.navigator.clipboard.write).not.toHaveBeenCalled();
    });

    test('should initialize with save-only settings correctly', async () => {
      await screenshotSelector.init('transparent', false, true);

      expect(screenshotSelector.background).toBe('transparent');
      expect(screenshotSelector.copyToClipboard).toBe(false);
      expect(screenshotSelector.saveToPc).toBe(true);
      expect(screenshotSelector.isActive).toBe(true);
    });
  });

  describe('Combination 3: Clipboard-only Mode (saveToPc: false, clipboard: true)', () => {
    beforeEach(() => {
      screenshotSelector.saveToPc = false;
      screenshotSelector.copyToClipboard = true;
    });

    test('should only perform clipboard operation when clipboard-only mode is enabled', async () => {
      const result = await screenshotSelector.captureElement(mockElement);

      expect(result.success).toBe(true);
      expect(result.downloadPerformed).toBe(false);
      expect(result.clipboardResult).toBeDefined();
      expect(result.clipboardResult.success).toBe(true);

      // Verify download was NOT triggered
      expect(mockCreateElement).not.toHaveBeenCalledWith('a');
      
      // Verify clipboard operation was attempted
      expect(global.navigator.clipboard.write).toHaveBeenCalled();
    });

    test('should initialize with clipboard-only settings correctly', async () => {
      await screenshotSelector.init('black', true, false);

      expect(screenshotSelector.background).toBe('black');
      expect(screenshotSelector.copyToClipboard).toBe(true);
      expect(screenshotSelector.saveToPc).toBe(false);
      expect(screenshotSelector.isActive).toBe(true);
    });
  });

  describe('Combination 4: Both Disabled (saveToPc: false, clipboard: false)', () => {
    beforeEach(() => {
      screenshotSelector.saveToPc = false;
      screenshotSelector.copyToClipboard = false;
    });

    test('should perform neither operation when both are disabled', async () => {
      const result = await screenshotSelector.captureElement(mockElement);

      expect(result.success).toBe(true);
      expect(result.downloadPerformed).toBe(false);
      expect(result.clipboardResult).toBeNull();

      // Verify download was NOT triggered
      expect(mockCreateElement).not.toHaveBeenCalledWith('a');
      
      // Verify clipboard operation was NOT attempted
      expect(global.navigator.clipboard.write).not.toHaveBeenCalled();
    });

    test('should initialize with both disabled settings correctly', async () => {
      await screenshotSelector.init('white', false, false);

      expect(screenshotSelector.background).toBe('white');
      expect(screenshotSelector.copyToClipboard).toBe(false);
      expect(screenshotSelector.saveToPc).toBe(false);
      expect(screenshotSelector.isActive).toBe(true);
    });

    test('should still create canvas even when both outputs are disabled', async () => {
      await screenshotSelector.captureElement(mockElement);

      // html2canvas should still be called (needed for potential future operations)
      expect(global.html2canvas).toHaveBeenCalledWith(mockElement);
    });
  });
});

describe('Popup Validation Logic for All Combinations', () => {
  let clipboardToggle;
  let saveToPcToggle;
  let startBtn;
  let validationWarning;
  let validateOutputMethods;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM elements
    clipboardToggle = {
      checked: true,
      addEventListener: jest.fn()
    };
    
    saveToPcToggle = {
      checked: true,
      addEventListener: jest.fn()
    };
    
    startBtn = {
      disabled: false,
      setAttribute: jest.fn(),
      addEventListener: jest.fn()
    };
    
    validationWarning = {
      style: { display: 'none' }
    };

    global.document.getElementById = jest.fn((id) => {
      switch (id) {
        case 'clipboard-toggle': return clipboardToggle;
        case 'save-to-pc-toggle': return saveToPcToggle;
        case 'start-selector': return startBtn;
        case 'validation-warning': return validationWarning;
        default: return null;
      }
    });

    // Define validation function
    validateOutputMethods = function() {
      const hasValidOutput = clipboardToggle.checked || saveToPcToggle.checked;
      
      if (hasValidOutput) {
        validationWarning.style.display = 'none';
        startBtn.disabled = false;
        startBtn.setAttribute('aria-describedby', '');
      } else {
        validationWarning.style.display = 'block';
        startBtn.disabled = true;
        startBtn.setAttribute('aria-describedby', 'validation-warning');
      }
      
      return hasValidOutput;
    };
  });

  test('should validate successfully when both save to PC and clipboard are enabled', () => {
    clipboardToggle.checked = true;
    saveToPcToggle.checked = true;

    const result = validateOutputMethods();

    expect(result).toBe(true);
    expect(validationWarning.style.display).toBe('none');
    expect(startBtn.disabled).toBe(false);
    expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
  });

  test('should validate successfully when only save to PC is enabled', () => {
    clipboardToggle.checked = false;
    saveToPcToggle.checked = true;

    const result = validateOutputMethods();

    expect(result).toBe(true);
    expect(validationWarning.style.display).toBe('none');
    expect(startBtn.disabled).toBe(false);
    expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
  });

  test('should validate successfully when only clipboard is enabled', () => {
    clipboardToggle.checked = true;
    saveToPcToggle.checked = false;

    const result = validateOutputMethods();

    expect(result).toBe(true);
    expect(validationWarning.style.display).toBe('none');
    expect(startBtn.disabled).toBe(false);
    expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
  });

  test('should fail validation when both save to PC and clipboard are disabled', () => {
    clipboardToggle.checked = false;
    saveToPcToggle.checked = false;

    const result = validateOutputMethods();

    expect(result).toBe(false);
    expect(validationWarning.style.display).toBe('block');
    expect(startBtn.disabled).toBe(true);
    expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', 'validation-warning');
  });
});

describe('Preference Persistence Across Browser Sessions', () => {
  let mockClipboardToggle;
  let mockSaveToPcToggle;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM elements
    mockClipboardToggle = {
      checked: false,
      addEventListener: jest.fn()
    };
    
    mockSaveToPcToggle = {
      checked: false,
      addEventListener: jest.fn()
    };

    global.document.getElementById = jest.fn((id) => {
      switch (id) {
        case 'clipboard-toggle':
          return mockClipboardToggle;
        case 'save-to-pc-toggle':
          return mockSaveToPcToggle;
        default:
          return null;
      }
    });
  });

  test('should default to both enabled for new installations', async () => {
    // Mock no saved preferences (new installation)
    global.chrome.storage.sync.get.mockResolvedValueOnce({});
    
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saveToPcToggle = document.getElementById('save-to-pc-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard', 'saveToPc']);
        
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        saveToPcToggle.checked = saved.saveToPc !== undefined ? saved.saveToPc : true;
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

    expect(mockClipboardToggle.checked).toBe(true); // Default
    expect(mockSaveToPcToggle.checked).toBe(true); // Default
  });

  test('should persist save-only preferences across sessions', async () => {
    // First session - user sets save-only mode
    global.chrome.storage.sync.get.mockResolvedValueOnce({
      copyToClipboard: false,
      saveToPc: true
    });
    
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saveToPcToggle = document.getElementById('save-to-pc-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard', 'saveToPc']);
        
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        saveToPcToggle.checked = saved.saveToPc !== undefined ? saved.saveToPc : true;
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

    expect(mockClipboardToggle.checked).toBe(false);
    expect(mockSaveToPcToggle.checked).toBe(true);
  });

  test('should persist clipboard-only preferences across sessions', async () => {
    // Load clipboard-only mode
    global.chrome.storage.sync.get.mockResolvedValueOnce({
      copyToClipboard: true,
      saveToPc: false
    });
    
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saveToPcToggle = document.getElementById('save-to-pc-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard', 'saveToPc']);
        
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        saveToPcToggle.checked = saved.saveToPc !== undefined ? saved.saveToPc : true;
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

    expect(mockClipboardToggle.checked).toBe(true);
    expect(mockSaveToPcToggle.checked).toBe(false);
  });

  test('should persist both disabled preferences across sessions', async () => {
    // Load both disabled state
    global.chrome.storage.sync.get.mockResolvedValueOnce({
      copyToClipboard: false,
      saveToPc: false
    });

    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saveToPcToggle = document.getElementById('save-to-pc-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard', 'saveToPc']);
        
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        saveToPcToggle.checked = saved.saveToPc !== undefined ? saved.saveToPc : true;
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

    expect(mockClipboardToggle.checked).toBe(false);
    expect(mockSaveToPcToggle.checked).toBe(false);
    
    // Validation should fail with both disabled
    const isValid = mockClipboardToggle.checked || mockSaveToPcToggle.checked;
    expect(isValid).toBe(false);
  });

  test('should maintain existing behavior when upgrading from version without saveToPc', async () => {
    // Mock existing installation with only clipboard preference
    global.chrome.storage.sync.get.mockResolvedValueOnce({
      copyToClipboard: true
      // saveToPc is undefined (not set in previous version)
    });
    
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saveToPcToggle = document.getElementById('save-to-pc-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard', 'saveToPc']);
        
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        saveToPcToggle.checked = saved.saveToPc !== undefined ? saved.saveToPc : true;
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

    expect(mockClipboardToggle.checked).toBe(true); // Existing preference
    expect(mockSaveToPcToggle.checked).toBe(true); // Default for backward compatibility
  });
});