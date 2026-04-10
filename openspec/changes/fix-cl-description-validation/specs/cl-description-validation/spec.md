## ADDED Requirements

### Requirement: Minimum Description Length Validation
The system SHALL enforce a minimum job description length of 200 characters before enabling the Cover Letter Generate action in the Extension UI.

#### Scenario: Description Too Short
- **WHEN** user has saved a job description with fewer than 200 characters
- **THEN** the Generate button SHALL be disabled and display a tooltip indicating the minimum length requirement

#### Scenario: Description Meets Minimum Length
- **WHEN** user has saved a job description with 200 or more characters
- **AND** the description has been successfully saved (cl_status is 'saved' or 'ready')
- **THEN** the Generate button SHALL be enabled

### Requirement: State-Based Enable Logic
The system SHALL require that the job description has been successfully saved to the backend before enabling the Generate button, regardless of description length.

#### Scenario: Description Not Saved
- **WHEN** user has entered a job description in the modal but has not clicked Save
- **THEN** the Generate button SHALL remain disabled even if description length >= 200

#### Scenario: Description Saved Successfully
- **WHEN** user has successfully saved a job description (cl_status = 'saved')
- **AND** description length >= 200
- **THEN** the Generate button SHALL be enabled

### Requirement: User Feedback on Validation Failure
The system SHALL provide clear user feedback when the Generate button is disabled due to insufficient description length.

#### Scenario: Display Validation Message
- **WHEN** description exists but length < 200 characters
- **THEN** the UI SHALL display a validation message indicating the current length and required minimum (e.g., "Description: 50/200 characters")

#### Scenario: Button Tooltip
- **WHEN** Generate button is disabled due to short description
- **THEN** hovering over the button SHALL show a tooltip with the reason (e.g., "Description must be at least 200 characters")

### Requirement: Parity with Core Validation
The Extension UI validation threshold SHALL match the Core (n8n workflow) validation threshold of 200 characters.

#### Scenario: Threshold Parity
- **WHEN** user saves a description of exactly 200 characters
- **THEN** the Generate button SHALL be enabled in the Extension
- **AND** the n8n workflow SHALL proceed with cover letter generation (not skip due to length)