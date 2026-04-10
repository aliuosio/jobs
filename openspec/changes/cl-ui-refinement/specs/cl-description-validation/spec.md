## MODIFIED Requirements

### Requirement: Minimum Description Length Validation
The system SHALL enforce a minimum job description length of 200 characters before enabling the Cover Letter Generate action in the Extension UI.

#### Scenario: Description Too Short
- **WHEN** user has a job description with fewer than 200 characters
- **THEN** the Generate button SHALL be disabled and display a tooltip indicating the minimum length requirement

#### Scenario: Description Meets Minimum Length
- **WHEN** user has a job description with 200 or more characters (regardless of save status)
- **THEN** the Generate button SHALL be enabled

### Requirement: State-Based Enable Logic
The system SHALL enable the Generate button based on description length alone, without requiring the description to be saved to the backend.

#### Scenario: Description Not Saved
- **WHEN** user has a job description in local state but has not saved it
- **AND** description length >= 200
- **THEN** the Generate button SHALL be enabled

#### Scenario: Description Saved Successfully
- **WHEN** user has saved a job description (cl_status = 'saved')
- **AND** description length >= 200
- **THEN** the Generate button SHALL be enabled

### Requirement: User Feedback on Validation Failure
The system SHALL provide minimal user feedback when the Generate button is disabled due to insufficient description length.

#### Scenario: Button Disabled
- **WHEN** description exists but length < 200 characters
- **THEN** the Generate button SHALL be disabled with a tooltip explaining the requirement

#### Scenario: No Character Count Display
- **WHEN** description is displayed in the job links list
- **THEN** no character count (e.g., "50/200") SHALL be displayed

### Requirement: Letter Available Indicator
The system SHALL display a "Letter available" indicator when a cover letter has already been generated for a job offer.

#### Scenario: Letter Already Generated
- **WHEN** cl_status === 'ready' (cover letter already generated)
- **THEN** the Generate button tooltip SHALL display "Letter available"

#### Scenario: No Letter Generated
- **WHEN** cl_status !== 'ready' and button is disabled
- **THEN** tooltip SHALL display the appropriate reason for disabled state

### Requirement: Parity with Core Validation
The Extension UI validation threshold SHALL match the Core (n8n workflow) validation threshold of 200 characters.

#### Scenario: Threshold Parity
- **WHEN** user has a description of exactly 200 characters
- **THEN** the Generate button SHALL be enabled in the Extension
- **AND** the n8n workflow SHALL proceed with cover letter generation