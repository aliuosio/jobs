# Research: Persist Extension State

## Decision: Use browser.storage.local for state persistence

### Rationale

- Native Firefox API, no external dependencies required
- Automatic synchronization between popup and background contexts
- Built-in quota management and error handling
- Persistent across browser sessions

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| IndexedDB | Overkill for simple key-value data |
| localStorage | Not available in extension background scripts |
| Third-party libraries | Violates KISS principle - native API sufficient |

### Storage Architecture

```
browser.storage.local
├── jobOffers          # Array of job offer objects
├── jobOffersTimestamp # Unix timestamp of last fetch
├── detectedFields     # Array of field objects
├── lastUrl            # URL for field cache key
├── lastTab            # User's last selected tab
└── storageVersion     # Schema version for migrations
```

### Best Practices Identified

1. **Cache-first strategy**: Load from storage immediately, fetch fresh data in background
2. **Stale data indicator**: Show visual cue when cache > 1 hour old
3. **URL-scoped field cache**: Clear fields when navigating to different domain
4. **Versioned schema**: Include version number for future migrations
5. **Error handling**: Catch quota exceeded, storage unavailable errors

### Performance Considerations

- Storage read is synchronous but fast (<50ms typical)
- Batch reads using `get()` with array of keys
- Minimize data stored - only cache essential state
- Clear old data proactively to avoid quota issues
