# Data Model: Persist Job State on Extension Open

**Phase**: 1 - Design & Contracts

## Entities

### JobDataCache

| Field | Type | Description |
|-------|------|-------------|
| jobOffers | Array<JobOffer> | Cached list of job offers |
| jobOffersTimestamp | number | Unix timestamp of last cache update |

### JobOffer

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique job offer ID |
| title | string | Job title |
| url | string | Job posting URL |
| applied | boolean | Whether user has applied |
| pending | boolean | Update in progress |
| error | boolean | Update failed |

### LastClickedJobLink

| Field | Type | Description |
|-------|------|-------------|
| lastClickedJobLink | number | Job ID of last clicked link |

### VisitedJobLinks (Existing)

| Field | Type | Description |
|-------|------|-------------|
| visitedLinks | Array<number> | Set of visited job IDs |

## Storage Schema

```javascript
const STORAGE_KEYS = {
  JOB_OFFERS: 'jobOffers',              // existing
  JOB_OFFERS_TIMESTAMP: 'jobOffersTimestamp', // existing
  VISITED_LINKS: 'visitedLinks',        // existing
  LAST_CLICKED_JOB_LINK: 'lastClickedJobLink' // NEW
};
```

## State Transitions

```
Popup Open:
  1. Load jobOffers from storage → display
  2. Load lastClickedJobLink from storage → apply highlight
  
User Clicks Job Link:
  1. Mark as visited (add to visitedLinks)
  2. Save job ID to lastClickedJobLink
  3. Navigate to URL

User Clicks Refresh:
  1. Fetch fresh data from backend
  2. Update jobOffers in storage
  3. Update timestamp
```

## Validation Rules

- jobOffers must be an array (can be empty)
- lastClickedJobLink must be a number or null
- visitedLinks must be an array of numbers
- If lastClickedJobLink is not in current jobOffers, don't highlight any link
