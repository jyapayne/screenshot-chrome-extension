# Design Document

## Overview

The copy to clipboard toggle feature will be implemented as an additional setting in the extension popup, similar to the existing background color selector. The feature will use the modern Clipboard API with appropriate fallbacks for older browsers. The implementation will integrate seamlessly with the existing screenshot capture workflow, adding clipboard functionality without disrupting the current download behavior.

## Architecture

The feature will be implemented across three main components:

1. **Popup UI Enhancement**: Add toggle control and persistence logic
2. **Content Script Integration**: Modify screenshot capture to include clipboard operations
3. **Storage Management**: Extend existing preference storage system

The clipboard functionality will be implemented as an optional enhancement to the existing screenshot workflow, ensuring backward compatibility and graceful degradation.

## Components and Interfaces

### Popup Interface (`popup.html` & `popup.js`)

**New UI Elements:**
- Toggle switch control for "Copy to Clipboard" option
- Positioned between background selector and start button
- Consistent styling with existing controls

**Storage Integration:**
- Extend existing `chrome.storage.sync` usage to include `copyToClipboard` preference
- Default value: `true` (enabled by default for better user experience)
- Load and save preferences alongside existing background preference

**Message Passing:**
- Include `copyToClipboard` setting in the `startSelector` message to content script
- No changes needed to existing message structure, just additional property

### Content Script Enhancement (`content.js`)

**ScreenshotSelector Class Modifications:**
- Add `copyToClipboard` property to constructor
- Modify `init()` method to accept and store clipboard preference
- Enhance `captureElement()` method to include clipboard operations

**Clipboard Implementation:**
```javascript
async copyCanvasToClipboard(canvas) {
  try {
    // Convert canvas to blob
    const blob = await new Promise(resolve => 
      canvas.toBlob(resolve, 'image/png')
    );
    
    // Use Clipboard API
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Error Handling:**
- Graceful fallback when Clipboard API is unavailable
- User-friendly error messages for clipboard failures
- Ensure screenshot download continues even if clipboard fails

### User Feedback System

**Success States:**
- "Screenshot saved and copied to clipboard!" - when both operations succeed
- "Screenshot saved! (Clipboard copy failed: [reason])" - when download succeeds but clipboard fails

**Loading States:**
- Update existing loading message to indicate clipboard operation when enabled
- "Capturing screenshot and preparing clipboard..." vs "Capturing screenshot..."

## Data Models

### Settings Storage Schema
```javascript
{
  backgroundPreference: 'black' | 'transparent' | 'white',
  copyToClipboard: boolean  // New addition
}
```

### Message Interface Extension
```javascript
// startSelector message
{
  action: 'startSelector',
  background: string,
  copyToClipboard: boolean  // New addition
}
```

## Error Handling

### Clipboard API Availability
- Check for `navigator.clipboard` and `ClipboardItem` support
- Provide clear error messages when API is unavailable
- Continue with download-only functionality as fallback

### Permission Handling
- Clipboard write operations may require user gesture
- Handle permission denied scenarios gracefully
- Provide user guidance for enabling clipboard permissions if needed

### Browser Compatibility
- Primary support: Chrome/Edge 76+, Firefox 87+, Safari 13.1+
- Fallback behavior for older browsers: disable clipboard feature with notification
- No impact on core screenshot functionality

## Testing Strategy

### Unit Testing Approach
- Mock Clipboard API for testing clipboard operations
- Test preference storage and retrieval
- Verify message passing between popup and content script
- Test error handling scenarios

### Integration Testing
- Test complete workflow: toggle setting → capture screenshot → verify clipboard content
- Test with different background settings and clipboard combinations
- Verify graceful degradation when Clipboard API unavailable

### Browser Compatibility Testing
- Test across Chrome, Firefox, Safari, Edge
- Verify behavior on older browser versions
- Test permission scenarios and user gesture requirements

### User Experience Testing
- Verify toggle state persistence across browser sessions
- Test visual feedback for success/error states
- Confirm tooltip and help text clarity

## Implementation Considerations

### Performance Impact
- Clipboard operations are asynchronous and won't block screenshot download
- Canvas-to-blob conversion adds minimal overhead
- No impact on screenshot capture performance

### Security Considerations
- Clipboard API requires secure context (HTTPS)
- User gesture requirement for clipboard write operations
- No sensitive data exposure through clipboard operations

### Accessibility
- Toggle control will include proper ARIA labels
- Keyboard navigation support for toggle control
- Screen reader compatible success/error messages

## Browser API Dependencies

### Required APIs
- `navigator.clipboard.write()` - Modern clipboard API
- `ClipboardItem` constructor - For image data handling
- `canvas.toBlob()` - Convert canvas to blob format

### Fallback Strategy
- Detect API availability before attempting clipboard operations
- Provide clear user feedback when clipboard features unavailable
- Maintain full functionality for screenshot download regardless of clipboard support