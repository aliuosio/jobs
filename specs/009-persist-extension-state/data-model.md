# Data Model: Persist Extension State

## Entities

### JobOffer

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique job offer ID |
| title | string | Job title |
| url | string | Link to job posting |
| applied | boolean | Whether user marked as applied |

### DetectedField

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique field identifier |
| label | string | Field label text |
| type | string | Field type (text, email, etc.) |
| confidence | string | Detection confidence (high, medium, low) |

### UserPreferences

| Field | Type | Description |
|-------|------|-------------|
| lastTab | string | Last selected tab (forms, links) |

### StorageMetadata

| Field | Type | Description |
|-------|------|-------------|
| storageVersion | number | Schema version (current: 1) |
| jobOffersTimestamp | number | Unix timestamp of last API fetch |
| lastUrl | string | URL where fields were detected |

## State Transitions

```
Extension Open:
  1. Load state from storage.local
  2. Display cached data immediately
  3. Fetch fresh data in background (if cache stale)

Job Applied Toggle:
  1. Update in-memory state
  2. Persist to storage.local
  3. Sync to backend API

Page Navigation:
  1. Check if URL changed
  2. If same URL: restore fields from cache
  3. If different URL: clear cached fields

Extension Close:
  1. Current state already persisted
  2. No action needed
```

## Validation Rules

- Job offers: Array of objects with required id, title, url
- Applied status: Boolean, defaults to false
- Storage version: Integer >= 1
- Timestamp: Unix epoch in milliseconds
