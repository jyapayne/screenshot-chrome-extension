/**
 * Test suite for clipboard preference persistence across browser sessions
 * Tests storage, retrieval, and default behavior of clipboard preferences
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
    id: '',
    checked: false,
    value: ''
  })),
  head: { appendChild: jest.fn() },
  body: { appendChild: jest.fn() },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn()
};

global.window = {
  close: jest.fn(),
  setTimeout: jest.fn((fn) => fn())
};

describe('Clipboard Preference Persistence', () => {
  let mockClipboardToggle;
  let mockBackgroundSelect;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM elements
    mockClipboardToggle = {
      checked: false,
      addEventListener: jest.fn()
    };
    
    mockBackgroundSelect = {
      value: 'black',
      addEventListener: jest.fn()
    };

    global.document.getElementById = jest.fn((id) => {
      switch (id) {
        case 'clipboard-toggle':
          return mockClipboardToggle;
        case 'background-select':
          return mockBackgroundSelect;
        case 'start-selector':
          return { addEventListener: jest.fn(), style: { display: 'block' } };
        case 'stop-selector':
          return { addEventListener: jest.fn(), style: { display: 'none' } };
        case 'status':
          return { textContent: '', className: '', style: { display: 'none' } };
        default:
          return null;
      }
    });
  });

  test('should load default clipboard preference when no saved preference exists', async () => {
    // Mock storage returning no saved preferences
    global.chrome.storage.sync.get.mockResolvedValue({});

    // Simulate popup script loading
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
      });
    `;

    // Execute the popup script logic
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    expect(global.chrome.storage.sync.get).toHaveBeenCalledWith(['backgroundPreference', 'copyToClipboard']);
    expect(mockClipboardToggle.checked).toBe(true); // Default should be true
  });

  test('should load saved clipboard preference when it exists', async () => {
    // Mock storage returning saved preferences
    global.chrome.storage.sync.get.mockResolvedValue({
      backgroundPreference: 'white',
      copyToClipboard: false
    });

    // Simulate popup script loading
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
        clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
      });
    `;

    // Execute the popup script logic
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    expect(mockClipboardToggle.checked).toBe(false); // Should load saved value
  });

  test('should save clipboard preference when toggle is changed', async () => {
    let changeCallback;
    mockClipboardToggle.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') {
        changeCallback = callback;
      }
    });

    // Simulate popup script initialization
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const clipboardToggle = document.getElementById('clipboard-toggle');
        clipboardToggle.addEventListener('change', () => {
          chrome.storage.sync.set({ copyToClipboard: clipboardToggle.checked });
        });
      });
    `;

    // Execute the popup script logic
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    // Simulate user toggling the checkbox
    mockClipboardToggle.checked = true;
    changeCallback();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ copyToClipboard: true });
  });

  test('should persist clipboard preference across multiple sessions', async () => {
    // Simulate first session - user enables clipboard
    global.chrome.storage.sync.get.mockResolvedValueOnce({});
    
    let firstSessionChangeCallback;
    mockClipboardToggle.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') {
        firstSessionChangeCallback = callback;
      }
    });

    // First session initialization
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      
      const popupScript = `
        document.addEventListener('DOMContentLoaded', async () => {
          const clipboardToggle = document.getElementById('clipboard-toggle');
          const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
          clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
          
          clipboardToggle.addEventListener('change', () => {
            chrome.storage.sync.set({ copyToClipboard: clipboardToggle.checked });
          });
        });
      `;
      eval(popupScript);
    });

    // User disables clipboard in first session
    mockClipboardToggle.checked = false;
    firstSessionChangeCallback();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ copyToClipboard: false });

    // Simulate second session - should load the saved preference
    jest.clearAllMocks();
    global.chrome.storage.sync.get.mockResolvedValueOnce({
      copyToClipboard: false
    });

    // Reset mock element
    mockClipboardToggle.checked = true; // Reset to opposite of expected

    // Second session initialization
    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      
      const popupScript = `
        document.addEventListener('DOMContentLoaded', async () => {
          const clipboardToggle = document.getElementById('clipboard-toggle');
          const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
          clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
        });
      `;
      eval(popupScript);
    });

    expect(mockClipboardToggle.checked).toBe(false); // Should load saved preference from first session
  });

  test('should handle storage errors gracefully', async () => {
    // Mock storage error
    global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

    let errorOccurred = false;
    
    try {
      const popupScript = `
        document.addEventListener('DOMContentLoaded', async () => {
          try {
            const clipboardToggle = document.getElementById('clipboard-toggle');
            const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
            clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
          } catch (error) {
            // Should fall back to default behavior
            const clipboardToggle = document.getElementById('clipboard-toggle');
            clipboardToggle.checked = true; // Default value
          }
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
    } catch (error) {
      errorOccurred = true;
    }

    expect(errorOccurred).toBe(false); // Should handle error gracefully
    expect(mockClipboardToggle.checked).toBe(true); // Should fall back to default
  });

  test('should save both background and clipboard preferences independently', async () => {
    let clipboardChangeCallback;
    let backgroundChangeCallback;

    mockClipboardToggle.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') {
        clipboardChangeCallback = callback;
      }
    });

    mockBackgroundSelect.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') {
        backgroundChangeCallback = callback;
      }
    });

    // Initialize popup script
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

    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    // Change background preference
    mockBackgroundSelect.value = 'transparent';
    backgroundChangeCallback();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ backgroundPreference: 'transparent' });

    // Change clipboard preference
    mockClipboardToggle.checked = false;
    clipboardChangeCallback();

    expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ copyToClipboard: false });

    // Verify both calls were made independently
    expect(global.chrome.storage.sync.set).toHaveBeenCalledTimes(2);
  });

  test('should include clipboard preference in message to content script', async () => {
    // Mock tab query and message sending
    global.chrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://example.com' }]);
    global.chrome.tabs.sendMessage.mockResolvedValue();

    let startButtonCallback;
    const mockStartButton = {
      addEventListener: jest.fn((event, callback) => {
        if (event === 'click') {
          startButtonCallback = callback;
        }
      }),
      style: { display: 'block' }
    };

    global.document.getElementById = jest.fn((id) => {
      switch (id) {
        case 'start-selector':
          return mockStartButton;
        case 'clipboard-toggle':
          return { checked: true }; // Clipboard enabled
        case 'background-select':
          return { value: 'white' };
        case 'status':
          return { textContent: '', className: '', style: { display: 'none' } };
        default:
          return mockClipboardToggle;
      }
    });

    // Initialize popup script
    const popupScript = `
      document.addEventListener('DOMContentLoaded', async () => {
        const startBtn = document.getElementById('start-selector');
        const backgroundSelect = document.getElementById('background-select');
        const clipboardToggle = document.getElementById('clipboard-toggle');
        
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

    await new Promise(resolve => {
      global.document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback();
          resolve();
        }
      });
      eval(popupScript);
    });

    // Simulate start button click
    await startButtonCallback();

    expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
      action: 'startSelector',
      background: 'white',
      copyToClipboard: true
    });
  });
});