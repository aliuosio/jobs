## ADDED Requirements

### Requirement: Fresh job load on startup
The extension SHALL fetch job offers fresh from the API when the popup opens, ensuring users always see current job listings that match the data from clicking the refresh button.

#### Scenario: Popup opens with API available
- **WHEN** user opens the extension popup and the API server is reachable
- **THEN** the extension displays a loading skeleton, fetches fresh job offers from the API, and displays the current job listings
- **AND** the job offers are cached to browser.storage.local for offline fallback

#### Scenario: Popup opens with API unavailable and no cache
- **WHEN** user opens the extension popup, the API server is unreachable, and there are no cached job offers
- **THEN** the extension displays an error message indicating jobs could not be loaded

#### Scenario: Popup opens with API unavailable but has cache
- **WHEN** user opens the extension popup, the API server is unreachable, but cached job offers exist
- **THEN** the extension displays the cached job offers with an error indicator showing the last refresh failed
- **AND** the cached job offers match what was shown when the refresh button was last clicked

#### Scenario: Refresh button clicked
- **WHEN** user clicks the "Refresh Jobs" button
- **THEN** the extension fetches fresh job offers from the API and displays them (same behavior as on popup open)
