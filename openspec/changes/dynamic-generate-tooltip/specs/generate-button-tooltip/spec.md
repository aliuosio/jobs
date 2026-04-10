## ADDED Requirements

### Requirement: Dynamic Tooltip on Hover
The Generate button SHALL display a database-driven tooltip on hover showing whether a cover letter has been generated.

#### Scenario: Letter Exists in Database
- **WHEN** user hovers over Generate button
- **AND** a cover letter record exists for this job offer in the database
- **THEN** the tooltip SHALL display "Letter Generated"

#### Scenario: No Letter in Database
- **WHEN** user hovers over Generate button
- **AND** no cover letter record exists for this job offer in the database
- **THEN** the tooltip SHALL display "Letter Not Generated"

#### Scenario: API Error
- **WHEN** user hovers over Generate button
- **AND** the API call to check letter status fails
- **THEN** the tooltip SHALL fall back to displaying the local state message ("Letter available" or current logic)

### Requirement: Hover Event Handler
The Generate button SHALL have a hover event handler that triggers the database check.

#### Scenario: First Hover
- **WHEN** user hovers over Generate button for the first time for a specific job offer
- **THEN** the extension SHALL fetch letter status from the API
- **AND** cache the result for subsequent hovers

#### Scenario: Cached Result
- **WHEN** user hovers over Generate button after first hover (cached)
- **THEN** the tooltip SHALL display the cached result without making another API call

### Requirement: Non-Blocking Tooltip
The hover tooltip check SHALL NOT block or interfere with the button's click functionality.

#### Scenario: Click During Hover Fetch
- **WHEN** user clicks the Generate button while tooltip fetch is in progress
- **THEN** the generation trigger SHALL execute normally
- **AND** the click SHALL NOT be delayed by the tooltip fetch

#### Scenario: Button Still Enabled
- **WHEN** tooltip is being fetched on hover
- **THEN** the Generate button SHALL remain enabled and clickable