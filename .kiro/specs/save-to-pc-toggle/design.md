# Design Document

## Overview

The save to PC toggle feature will be implemented as an additional setting in the extension popup, positioned alongside the existing clipboard toggle. The feature will modify the existing screenshot capture workflow to conditionally perform file downloads based on user preference. The implementation will ensure that users can independently control both clipboard copying and file downloading, providing maximum flexibility in their screenshot workflow.

## Architecture

The feature will be implemented across three main components:

1. **Popup UI Enhancement**: Add toggle control and persistence logic
2. **Content Script Integration**: Modify screenshot capture to conditionally download files
3. **Storage Management**: Extend existing preference storage system
4. **Validation Logic**: Ensure at least one output method is selected

The save to PC functionality will be implemented as a conditional enhancement to the existing screenshot workflow, maintaining backward compatibility while providing new flexibility.

## Components and Interfaces

### Popup Interface (`popup.html` & `popup.js`)

**New UI Elements:**
- Toggle switch control for "Save to PC" option
- Positioned above the clipboard toggle for logical grouping
- Consistent styling with existing controls
- Warning message when both toggles are disabled

**Storage Integration:**
- Extend existing `chrome.storage.sync` usage to include `saveToPc` preference
- Default value: `true` (enabled by default to maintain existing behavior)
- Load and save preferences alongside existing background and clipboard preferences

**Validation Logic:**
- Check that at least one output method (save to PC or clipboard) is enabled
- Display warning message when both are disabled
- Prevent screenshot capture when no output method is selected

**Message Passing:**
- Include `saveToPc` setting in the `startSelector` message to content script
- No changes needed to existing message structure, just additional property

### Content Script Enhancement (`content.js`)

**ScreenshotSelector Class Modifications:**
- Add `saveToPc` property to constructor
- Modify `init()` method to accept and store save to PC preference
- Enhance `captureElement()` method to conditionally perform file downloads

**Conditional Download Implementation:**
```javascript
// In captureElement method, replace automatic download with conditional logic
if (this.saveToPc) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
  link.click();
}
```

**User Feedback Enhancement:**
- Update success messages to reflect which operations were performed
- Handle cases where no output method is selected (should not occur due to popup validation)

### User Feedback System

**Success States:**
- "Screenshot saved and copied to clipboard!" - when both operations succeed
- "Screenshot saved!" - when only save to PC is enabled and succeeds
- "Screenshot copied to clipboard!" - when only clipboard is enabled and succeeds
- "Screenshot captured!" - fallback message for edge cases

**Error States:**
- "Please enable at least one output method (Save to PC or Copy to Clipboard)" - when both are disabled
- Existing clipboard error messages remain unchanged

**Loading States:**
- Update loading message to reflect enabled operations
- "Capturing screenshot..." - when only save to PC is enabled
- "Capturing screenshot and preparing for clipboard..." - when only clipboard is enabled
- "Capturing screenshot and preparing for clipboard..." - when both are enabled (clipboard preparation is the longer operation)

## Data Models

### Settings Storage Schema
```javascript
{
  backgroundPreference: 'black' | 'transparent' | 'white',
  copyToClipboard: boolean,
  saveToPc: boolean  // New addition
}
```

### Message Interface Extension
```javascript
// startSelector message
{
  action: 'startSelector',
  background: string,
  copyToClipboard: boolean,
  saveToPc: boolean  // New addition
}
```

## Error Handling

### Validation Errors
- Prevent screenshot capture when both save to PC and clipboard are disabled
- Display clear error message in popup when no output method is selected
- Provide guidance on enabling at least one option

### Download Failures
- Handle file download failures gracefully (though these are rare in modern browsers)
- Ensure clipboard operations continue even if download fails (when both are enabled)
- Provide specific error messages for download-related issues

### Backward Compatibility
- Ensure existing users see no change in behavior (save to PC enabled by default)
- Handle cases where preference is not yet set in storage
- Maintain existing error handling for clipboard operations

## Testing Strategy

### Unit Testing Approach
- Test preference storage and retrieval for save to PC setting
- Verify message passing includes new saveToPc property
- Test validation logic for ensuring at least one output method is enabled
- Mock file download operations for testing conditional download logic

### Integration Testing
- Test complete workflow: toggle setting → capture screenshot → verify file download behavior
- Test all four combinations of save to PC and clipboard settings
- Verify error handling when both options are disabled
- Test preference persistence across browser sessions

### User Experience Testing
- Verify toggle state persistence across browser sessions
- Test visual feedback for different operation combinations
- Confirm tooltip and help text clarity
- Test warning messages when both toggles are disabled

## Implementation Considerations

### Performance Impact
- No performance impact when save to PC is enabled (existing behavior)
- Slight performance improvement when save to PC is disabled (no file creation)
- No impact on clipboard operations

### Security Considerations
- File downloads use existing browser download mechanisms
- No new security concerns introduced
- Maintains existing security model for clipboard operations

### Accessibility
- Save to PC toggle will include proper ARIA labels
- Keyboard navigation support for toggle control
- Screen reader compatible success/error messages
- Warning messages will be announced to screen readers

### User Experience Design
- Logical grouping of output method toggles
- Clear visual hierarchy with save to PC above clipboard (primary → secondary)
- Consistent styling with existing UI elements
- Intuitive default settings (both enabled initially)

## Browser Compatibility

### File Download Support
- File downloads work in all modern browsers
- No fallback needed as this is core browser functionality
- Existing implementation already handles download edge cases

### Storage and UI
- Uses existing chrome.storage.sync API (already implemented)
- Toggle UI uses existing CSS patterns
- No new browser API dependencies

## Migration Strategy

### Existing Users
- Default `saveToPc` to `true` when preference doesn't exist
- No change in behavior for existing users
- Seamless upgrade experience

### New Users
- Both save to PC and clipboard enabled by default
- Provides full functionality out of the box
- Users can customize based on their workflow preferences