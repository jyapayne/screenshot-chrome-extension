# Requirements Document

## Introduction

This feature adds a save to PC toggle option to the Full Screenshot Selector extension, allowing users to choose whether captured screenshots should be automatically downloaded as files to their computer. This provides users with more flexibility in how they handle their screenshots, enabling them to use only the clipboard functionality without cluttering their downloads folder with files they may not need.

## Requirements

### Requirement 1

**User Story:** As a user of the screenshot extension, I want to toggle whether screenshots are saved to my PC, so that I can avoid downloading files when I only need to paste the image elsewhere.

#### Acceptance Criteria

1. WHEN the popup is opened THEN the system SHALL display a toggle control for "Save to PC"
2. WHEN the user toggles the save to PC option THEN the system SHALL save this preference to browser storage
3. WHEN the extension is reopened THEN the system SHALL restore the previously saved save to PC preference
4. WHEN a screenshot is captured AND save to PC is enabled THEN the system SHALL download the file as before
5. WHEN a screenshot is captured AND save to PC is disabled THEN the system SHALL NOT download any file

### Requirement 2

**User Story:** As a user, I want clear visual feedback about the save to PC feature, so that I understand when files will be downloaded and when they won't.

#### Acceptance Criteria

1. WHEN the save to PC toggle is enabled THEN the system SHALL display visual indication of the enabled state
2. WHEN a screenshot is captured with save to PC enabled THEN the system SHALL show a success message indicating the download
3. WHEN a screenshot is captured with save to PC disabled THEN the system SHALL show a success message without mentioning download
4. WHEN hovering over the save to PC toggle THEN the system SHALL display helpful tooltip text

### Requirement 3

**User Story:** As a user, I want the save to PC feature to work independently of the clipboard feature, so that I can choose any combination of saving and copying that suits my workflow.

#### Acceptance Criteria

1. WHEN both save to PC and copy to clipboard are enabled THEN the system SHALL perform both operations
2. WHEN only save to PC is enabled THEN the system SHALL only download the file
3. WHEN only copy to clipboard is enabled THEN the system SHALL only copy to clipboard
4. WHEN both features are disabled THEN the system SHALL show an error message and not capture the screenshot

### Requirement 4

**User Story:** As a user, I want sensible default settings for the save to PC feature, so that the extension works intuitively without requiring configuration.

#### Acceptance Criteria

1. WHEN the extension is used for the first time THEN the save to PC option SHALL be enabled by default
2. WHEN upgrading from a previous version THEN the save to PC option SHALL be enabled by default to maintain existing behavior
3. WHEN both save to PC and clipboard options are available THEN users SHALL be able to configure them independently