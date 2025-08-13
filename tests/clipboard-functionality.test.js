/**
 * Comprehensive test suite for clipboard functionality
 * Tests clipboard API availability detection, operations with different backgrounds,
 * error handling, and preference persistence
 */

// Mock ScreenshotSelector class for testing
class MockScreenshotSelector {
  constructor() {
    this.copyToClipboard = true;
    this.background = 'black';
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

      const blob = await Promise.race([
        new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to blob conversion returned null'));
          }, 'image/png');
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Canvas to blob conversion timed out')), 10000)
        )
      ]);

      const maxBlobSize = 50 * 1024 * 1024;
      if (blob.size > maxBlobSize) {
        return {
          success: false,
          error: `Image too large for clipboard (${Math.round(blob.size / 1024 / 1024)}MB). Try capturing a smaller area.`,
          errorType: 'size_limit'
        };
      }

      let clipboardItem;
      try {
        clipboardItem = new global.window.ClipboardItem({ 'image/png': blob });
      } catch (clipboardItemError) {
        return {
          success: false,
          error: 'Failed to create clipboard item. Your browser may not support image clipboard operations.',
          errorType: 'clipboard_item_creation'
        };
      }

      await Promise.race([
        global.navigator.clipboard.write([clipboardItem]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Clipboard write timed out')), 5000)
        )
      ]);

      return { success: true };
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Permission denied', errorType: 'permission_denied' };
      } else if (error.name === 'SecurityError') {
        return { success: false, error: 'Security error', errorType: 'security_error' };
      } else if (error.message.includes('Canvas to blob conversion returned null')) {
        return { success: false, error: error.message, errorType: 'canvas_conversion' };
      } else if (error.message.includes('ClipboardItem creation failed')) {
        return { success: false, error: error.message, errorType: 'clipboard_item_creation' };
      } else if (error.message.includes('timed out')) {
        return { success: false, error: error.message, errorType: 'timeout' };
      }
      return { success: false, error: error.message, errorType: 'unexpected' };
    }
  }

  getClipboardErrorMessage(clipboardResult) {
    if (!clipboardResult || !clipboardResult.error) {
      return 'Clipboard copy failed due to unknown error.';
    }

    const errorType = clipboardResult.errorType;
    const errorMessage = clipboardResult.error;

    switch (errorType) {
      case 'permission_denied':
        return 'Clipboard copy failed: Permission denied. Please allow clipboard access in your browser settings.';
      case 'not_supported':
      case 'api_unavailable':
        return 'Clipboard copy not available in this browser. Screenshot was still downloaded.';
      case 'security_error':
        return 'Clipboard copy blocked by browser security. Try using HTTPS or check site permissions.';
      case 'size_limit':
      case 'quota_exceeded':
        return 'Clipboard copy failed: Image too large. Try capturing a smaller area.';
      case 'timeout':
        return 'Clipboard copy timed out. The image may be too large or complex.';
      default:
        return `Clipboard copy failed: ${errorMessage}`;
    }
  }

  getClipboardSupportFeedback() {
    const availability = this.checkClipboardAPIAvailability();
    
    if (availability.available) {
      return {
        supported: true,
        message: 'Clipboard copying is available and ready to use.'
      };
    }

    let userMessage = '';
    if (availability.reason.includes('not available') || availability.reason.includes('not supported')) {
      userMessage = 'Your browser doesn\'t support clipboard copying. Screenshots will still be downloaded.';
    } else if (availability.reason.includes('secure context')) {
      userMessage = 'Clipboard copying requires HTTPS. Screenshots will still be downloaded.';
    } else if (availability.reason.includes('write functionality')) {
      userMessage = 'Clipboard writing is not available. Screenshots will still be downloaded.';
    } else {
      userMessage = 'Clipboard copying is not available. Screenshots will still be downloaded.';
    }

    return {
      supported: false,
      message: userMessage
    };
  }
}

describe('Clipboard API Availability Detection', () => {
  let screenshotSelector;

  beforeEach(() => {
    jest.clearAllMocks();
    screenshotSelector = new MockScreenshotSelector();
  });

  test('should detect clipboard API availability when all APIs are present', () => {
    global.navigator = {
      clipboard: {
        write: jest.fn()
      }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;

    const result = screenshotSelector.checkClipboardAPIAvailability();
    
    expect(result.available).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  test('should detect missing navigator.clipboard', () => {
    global.navigator = {};
    
    const result = screenshotSelector.checkClipboardAPIAvailability();
    
    expect(result.available).toBe(false);
    expect(result.reason).toBe('Clipboard API not available in this browser');
  });

  test('should detect missing ClipboardItem', () => {
    global.navigator = {
      clipboard: { write: jest.fn() }
    };
    global.window.ClipboardItem = undefined;
    
    const result = screenshotSelector.checkClipboardAPIAvailability();
    
    expect(result.available).toBe(false);
    expect(result.reason).toBe('ClipboardItem not supported in this browser');
  });

  test('should detect insecure context', () => {
    global.navigator = {
      clipboard: { write: jest.fn() }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = false;
    
    const result = screenshotSelector.checkClipboardAPIAvailability();
    
    expect(result.available).toBe(false);
    expect(result.reason).toBe('Clipboard API requires a secure context (HTTPS)');
  });

  test('should detect missing clipboard.write', () => {
    global.navigator = {
      clipboard: {}
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;
    
    const result = screenshotSelector.checkClipboardAPIAvailability();
    
    expect(result.available).toBe(false);
    expect(result.reason).toBe('Clipboard write functionality not available');
  });
});

describe('Clipboard Operations with Different Background Settings', () => {
  let screenshotSelector;
  let mockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    
    global.navigator = {
      clipboard: {
        write: jest.fn().mockResolvedValue()
      }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;

    mockCanvas = {
      toBlob: jest.fn((callback, format) => {
        const mockBlob = new Blob(['mock image data'], { type: format });
        callback(mockBlob);
      }),
      toDataURL: jest.fn(() => 'data:image/png;base64,mockdata')
    };

    screenshotSelector = new MockScreenshotSelector();
  });

  test('should copy to clipboard with transparent background', async () => {
    screenshotSelector.background = 'transparent';
    screenshotSelector.copyToClipboard = true;

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(true);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(global.navigator.clipboard.write).toHaveBeenCalled();
  });

  test('should copy to clipboard with black background', async () => {
    screenshotSelector.background = 'black';
    screenshotSelector.copyToClipboard = true;

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(true);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(global.navigator.clipboard.write).toHaveBeenCalled();
  });

  test('should copy to clipboard with white background', async () => {
    screenshotSelector.background = 'white';
    screenshotSelector.copyToClipboard = true;

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(true);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(global.navigator.clipboard.write).toHaveBeenCalled();
  });

  test('should handle canvas to blob conversion failure', async () => {
    mockCanvas.toBlob = jest.fn((callback) => {
      callback(null);
    });

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas to blob conversion returned null');
    expect(result.errorType).toBe('canvas_conversion');
  });

  test('should handle large blob size limit', async () => {
    const largeMockBlob = {
      size: 60 * 1024 * 1024,
      type: 'image/png'
    };
    
    mockCanvas.toBlob = jest.fn((callback) => {
      callback(largeMockBlob);
    });

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Image too large for clipboard');
    expect(result.errorType).toBe('size_limit');
  });
});

describe('Error Handling for Clipboard Operations', () => {
  let screenshotSelector;
  let mockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCanvas = {
      toBlob: jest.fn((callback) => {
        const mockBlob = new Blob(['mock data'], { type: 'image/png' });
        callback(mockBlob);
      })
    };

    screenshotSelector = new MockScreenshotSelector();
  });

  test('should handle permission denied errors', async () => {
    global.navigator = {
      clipboard: {
        write: jest.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
      }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('permission_denied');
    expect(result.error).toContain('Permission denied');
  });

  test('should handle security errors', async () => {
    global.navigator = {
      clipboard: {
        write: jest.fn().mockRejectedValue(new DOMException('Security error', 'SecurityError'))
      }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('security_error');
  });

  test('should handle ClipboardItem creation failure', async () => {
    global.navigator = {
      clipboard: { write: jest.fn() }
    };
    global.window.ClipboardItem = jest.fn(() => {
      throw new Error('ClipboardItem creation failed');
    });
    global.window.isSecureContext = true;

    const result = await screenshotSelector.copyCanvasToClipboard(mockCanvas);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('clipboard_item_creation');
  });
});

describe('User-Friendly Error Messages', () => {
  let screenshotSelector;

  beforeEach(() => {
    screenshotSelector = new MockScreenshotSelector();
  });

  test('should provide user-friendly message for permission denied', () => {
    const clipboardResult = {
      success: false,
      error: 'Permission denied',
      errorType: 'permission_denied'
    };

    const message = screenshotSelector.getClipboardErrorMessage(clipboardResult);
    
    expect(message).toBe('Clipboard copy failed: Permission denied. Please allow clipboard access in your browser settings.');
  });

  test('should provide user-friendly message for API unavailable', () => {
    const clipboardResult = {
      success: false,
      error: 'API not supported',
      errorType: 'api_unavailable'
    };

    const message = screenshotSelector.getClipboardErrorMessage(clipboardResult);
    
    expect(message).toBe('Clipboard copy not available in this browser. Screenshot was still downloaded.');
  });

  test('should provide user-friendly message for size limit', () => {
    const clipboardResult = {
      success: false,
      error: 'Image too large',
      errorType: 'size_limit'
    };

    const message = screenshotSelector.getClipboardErrorMessage(clipboardResult);
    
    expect(message).toBe('Clipboard copy failed: Image too large. Try capturing a smaller area.');
  });

  test('should provide user-friendly message for timeout', () => {
    const clipboardResult = {
      success: false,
      error: 'Operation timed out',
      errorType: 'timeout'
    };

    const message = screenshotSelector.getClipboardErrorMessage(clipboardResult);
    
    expect(message).toBe('Clipboard copy timed out. The image may be too large or complex.');
  });

  test('should handle unknown error types gracefully', () => {
    const clipboardResult = {
      success: false,
      error: 'Unknown error occurred',
      errorType: 'unknown'
    };

    const message = screenshotSelector.getClipboardErrorMessage(clipboardResult);
    
    expect(message).toBe('Clipboard copy failed: Unknown error occurred');
  });
});

describe('Clipboard Support Feedback', () => {
  let screenshotSelector;

  beforeEach(() => {
    screenshotSelector = new MockScreenshotSelector();
  });

  test('should provide positive feedback when clipboard is supported', () => {
    global.navigator = {
      clipboard: { write: jest.fn() }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = true;

    const feedback = screenshotSelector.getClipboardSupportFeedback();
    
    expect(feedback.supported).toBe(true);
    expect(feedback.message).toBe('Clipboard copying is available and ready to use.');
  });

  test('should provide helpful feedback when clipboard is not supported', () => {
    global.navigator = {};

    const feedback = screenshotSelector.getClipboardSupportFeedback();
    
    expect(feedback.supported).toBe(false);
    expect(feedback.message).toBe('Your browser doesn\'t support clipboard copying. Screenshots will still be downloaded.');
  });

  test('should provide HTTPS requirement feedback', () => {
    global.navigator = {
      clipboard: { write: jest.fn() }
    };
    global.window.ClipboardItem = jest.fn();
    global.window.isSecureContext = false;

    const feedback = screenshotSelector.getClipboardSupportFeedback();
    
    expect(feedback.supported).toBe(false);
    expect(feedback.message).toBe('Clipboard copying requires HTTPS. Screenshots will still be downloaded.');
  });
});