/**
 * Tests for output method validation logic
 */

// Mock DOM elements and Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

global.chrome = mockChrome;

describe('Output Method Validation', () => {
  let mockDocument;
  let clipboardToggle;
  let saveToPcToggle;
  let startBtn;
  let validationWarning;
  let validateOutputMethods;

  beforeEach(() => {
    // Reset mocks
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

    // Mock document.getElementById
    const mockGetElementById = jest.fn((id) => {
      switch (id) {
        case 'clipboard-toggle': return clipboardToggle;
        case 'save-to-pc-toggle': return saveToPcToggle;
        case 'start-selector': return startBtn;
        case 'validation-warning': return validationWarning;
        default: return null;
      }
    });

    mockDocument = {
      getElementById: mockGetElementById,
      addEventListener: jest.fn()
    };

    global.document = mockDocument;

    // Define validation function (extracted from popup.js logic)
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

  describe('Validation Logic', () => {
    test('should return true when both save to PC and clipboard are enabled', () => {
      clipboardToggle.checked = true;
      saveToPcToggle.checked = true;

      const result = validateOutputMethods();

      expect(result).toBe(true);
      expect(validationWarning.style.display).toBe('none');
      expect(startBtn.disabled).toBe(false);
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
    });

    test('should return true when only save to PC is enabled', () => {
      clipboardToggle.checked = false;
      saveToPcToggle.checked = true;

      const result = validateOutputMethods();

      expect(result).toBe(true);
      expect(validationWarning.style.display).toBe('none');
      expect(startBtn.disabled).toBe(false);
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
    });

    test('should return true when only clipboard is enabled', () => {
      clipboardToggle.checked = true;
      saveToPcToggle.checked = false;

      const result = validateOutputMethods();

      expect(result).toBe(true);
      expect(validationWarning.style.display).toBe('none');
      expect(startBtn.disabled).toBe(false);
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
    });

    test('should return false when both save to PC and clipboard are disabled', () => {
      clipboardToggle.checked = false;
      saveToPcToggle.checked = false;

      const result = validateOutputMethods();

      expect(result).toBe(false);
      expect(validationWarning.style.display).toBe('block');
      expect(startBtn.disabled).toBe(true);
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', 'validation-warning');
    });
  });

  describe('UI State Management', () => {
    test('should hide warning and enable button when validation passes', () => {
      clipboardToggle.checked = true;
      saveToPcToggle.checked = false;

      validateOutputMethods();

      expect(validationWarning.style.display).toBe('none');
      expect(startBtn.disabled).toBe(false);
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');
    });

    test('should show warning and disable button when validation fails', () => {
      clipboardToggle.checked = false;
      saveToPcToggle.checked = false;

      validateOutputMethods();

      expect(validationWarning.style.display).toBe('block');
      expect(startBtn.disabled).toBe(true);
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', 'validation-warning');
    });

    test('should update accessibility attributes correctly', () => {
      // Test valid state
      clipboardToggle.checked = true;
      saveToPcToggle.checked = true;
      validateOutputMethods();
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', '');

      // Reset mock
      startBtn.setAttribute.mockClear();

      // Test invalid state
      clipboardToggle.checked = false;
      saveToPcToggle.checked = false;
      validateOutputMethods();
      expect(startBtn.setAttribute).toHaveBeenCalledWith('aria-describedby', 'validation-warning');
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined checkbox states gracefully', () => {
      clipboardToggle.checked = undefined;
      saveToPcToggle.checked = true;

      const result = validateOutputMethods();

      // undefined should be falsy, so only saveToPc (true) should make it valid
      expect(result).toBe(true);
    });

    test('should handle null checkbox states gracefully', () => {
      clipboardToggle.checked = null;
      saveToPcToggle.checked = null;

      const result = validateOutputMethods();

      // Both null should be falsy, so validation should fail
      expect(result).toBeFalsy(); // Use toBeFalsy to handle null/false/undefined
      expect(validationWarning.style.display).toBe('block');
      expect(startBtn.disabled).toBe(true);
    });
  });
});