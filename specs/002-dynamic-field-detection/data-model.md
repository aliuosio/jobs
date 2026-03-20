# Data Model: Dynamic Form Field Detection

## Entities

### FormObserverOptions

Configuration object passed to FormObserver constructor.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `debounceMs` | number | No | 300 | Milliseconds to wait before processing mutations |
| `maxWaitMs` | number | No | 10000 | Maximum time to observe DOM (FR-007) |
| `onFormDetected` | Function | No | `() => {}` | Callback when new form detected |
| `onFieldDetected` | Function | No | `() => {}` | Callback when new field detected |

### FormObserverState

Internal state managed by FormObserver.

| Field | Type | Description |
|-------|------|-------------|
| `observer` | MutationObserver\|null | Active MutationObserver instance |
| `processedForms` | WeakSet | Tracks processed form elements |
| `processedFields` | WeakSet | Tracks processed field elements |
| `pendingMutations` | MutationRecord[] | Accumulated DOM mutations |
| `debounceTimer` | number\|null | Timer reference for debounce |
| `scanStartTime` | number\|null | Timestamp when scanning started |
| `isScanning` | boolean | Whether observer is active |

### MutationRecord

Standard DOM API type. Represents a single DOM change.

| Field | Type | Description |
|-------|------|-------------|
| `addedNodes` | NodeList | Nodes added in this mutation |
| `removedNodes` | NodeList | Nodes removed in this mutation |
| `type` | string | 'childList', 'attributes', or 'characterData' |

## Relationships

```
FormObserver
    ├─── owns ────► MutationObserver (DOM API)
    ├─── tracks ──► processedForms (WeakSet<HTMLFormElement>)
    ├─── tracks ──► processedFields (WeakSet<HTMLElement>)
    └─── emits ───► callbacks (onFormDetected, onFieldDetected)
                           │
                           └───► content.js detectedFields[]
```

## Field Element Detection

**Supported Element Tags**: `'input'`, `'textarea'`, `'select'`

**Supported Input Types** (from form-scanner.js):
- `'text'`
- `'email'`
- `'tel'`
- `'url'`
- `'number'`

**Excluded**:
- `type === 'password'`
- `element.readOnly === true`
- `element.disabled === true`
- `type === 'hidden'`
- `style.display === 'none'`
- `style.visibility === 'hidden'`

## State Transitions

### FormObserver Lifecycle

```
┌─────────────┐     start()      ┌──────────────┐
│  CREATED    │ ───────────────► │   SCANNING    │
└─────────────┘                  └───────────────┘
     │                                  │
     │                                  │ stop() or maxWaitMs
     │                                  ▼
     │                           ┌──────────────┐
     └──────────────────────────►│   STOPPED    │
                                 └──────────────┘
```

### Mutation Processing Flow

```
DOM Change Detected
        │
        ▼
handleMutationsDebounced()
        │
        │ Accumulate + set timer
        ▼
After debounceMs
        │
        ▼
processPendingMutations()
        │
        ├─► Extract FORM elements → onFormDetected(form)
        │
        └─► Extract FIELD elements → onFieldDetected(field)
        │
        ▼
Clear pendingMutations[]
```

## Validation Rules

1. **No duplicate fields**: WeakSet prevents same element from being processed twice
2. **Memory cleanup**: WeakSet allows garbage collection of removed elements
3. **Non-blocking**: All processing happens asynchronously via callbacks
4. **Bounded time**: maxWaitMs ensures observer stops after timeout

## Key Invariants

1. `processedForms` and `processedFields` are disjoint sets
2. A field element may be inside a form element - both callbacks fire
3. If a field has no associated form, only `onFieldDetected` fires
4. Observer disconnects after `maxWaitMs` regardless of mutation count
