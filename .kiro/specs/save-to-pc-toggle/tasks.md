# Implementation Plan

- [ ] 1. Add save to PC toggle UI to popup
  - Add HTML toggle control above the clipboard toggle in popup.html
  - Style the toggle control to match existing UI design patterns
  - Include proper ARIA labels and accessibility attributes for the toggle
  - Position the save to PC toggle logically above clipboard toggle
  - _Requirements: 1.1, 2.1, 2.4_

- [ ] 2. Implement save to PC preference storage in popup
  - Extend existing storage logic in popup.js to handle saveToPc preference
  - Set default value to true to maintain existing behavior for current users
  - Load saved save to PC preference on popup initialization
  - Save save to PC preference changes to chrome.storage.sync
  - _Requirements: 1.2, 1.3, 4.1, 4.2_

- [ ] 3. Add validation logic for output method selection
  - Create validation function to ensure at least one output method is enabled
  - Display warning message in popup when both save to PC and clipboard are disabled
  - Prevent screenshot capture when no output method is selected
  - Update start button state based on validation results
  - _Requirements: 3.4_

- [ ] 4. Update message passing to include save to PC setting
  - Modify startSelector message in popup.js to include saveToPc property
  - Update content script message handler to receive and store save to PC preference
  - Ensure backward compatibility with existing message structure
  - _Requirements: 1.1, 1.4_

- [ ] 5. Implement conditional file download in content script
  - Modify captureElement method in ScreenshotSelector class to conditionally download files
  - Wrap existing download logic in conditional check for saveToPc preference
  - Ensure canvas generation still occurs regardless of download preference (needed for clipboard)
  - Maintain existing download filename generation and format
  - _Requirements: 1.4, 1.5, 3.1, 3.2_

- [ ] 6. Update user feedback messages for different operation combinations
  - Modify success messages to reflect which operations were performed
  - Create specific messages for save-only, clipboard-only, and both operations
  - Update loading messages to reflect enabled operations
  - Ensure error messages are appropriate for each operation combination
  - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3_

- [ ] 7. Add tooltip and help text for save to PC toggle
  - Implement tooltip showing save to PC feature explanation
  - Add help text explaining the relationship between save to PC and clipboard features
  - Ensure tooltip is accessible and keyboard navigable
  - Include information about default behavior and workflow flexibility
  - _Requirements: 2.4_

- [ ] 8. Implement warning system for disabled output methods
  - Create visual warning when both save to PC and clipboard toggles are disabled
  - Display clear guidance on enabling at least one output method
  - Make warning accessible to screen readers
  - Update warning state dynamically as toggles change
  - _Requirements: 3.4_

- [ ] 9. Test all combinations of save to PC and clipboard settings
  - Write test cases for save-only mode (saveToPc: true, clipboard: false)
  - Write test cases for clipboard-only mode (saveToPc: false, clipboard: true)
  - Write test cases for both enabled (saveToPc: true, clipboard: true)
  - Write test cases for validation when both disabled (saveToPc: false, clipboard: false)
  - Verify preference persistence across browser sessions for all combinations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.3_

- [ ] 10. Test backward compatibility and migration
  - Test behavior when saveToPc preference doesn't exist in storage (new installation)
  - Test behavior when upgrading from version without saveToPc preference
  - Verify that existing users maintain current behavior (files still download by default)
  - Test that new users get both features enabled by default
  - _Requirements: 4.1, 4.2_