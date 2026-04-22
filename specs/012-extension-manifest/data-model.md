# Data Model: Extension Manifest & Setup

## Entities

### Extension Manifest

Firefox WebExtension manifest v3 configuration.

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| manifest_version | number | Must be 3 | WebExtension standard |
| name | string | Max 45 chars | Display name |
| version | string | x.y.z format | Semantic versioning |
| description | string | Max 132 chars | Extension description |
| browser_specific_settings.gecko.id | string | UUID format | Firefox extension ID |
| browser_specific_settings.gecko.strict_min_version | string | x.y.z format | Firefox 109+ |

### Permissions

| Permission | Purpose |
|------------|---------|
| storage | Persist extension data |
| activeTab | Access current tab content |
| scripting | Inject content scripts |
| <all_urls> | Host permission for form access |

### Popup UI

Entry point for the React application.

| Field | Type | Notes |
|-------|------|-------|
| default_popup | string | "popup.html" path |
| default_icon | object | Toolbar icon sizes (16/32/48) |

### Background Script

Service worker handling message routing.

| Field | Type | Notes |
|-------|------|-------|
| scripts | string[] | Entry scripts |
| type | string | "module" for ES modules |

### Content Script

Script injected into web pages for form detection.

| Field | Type | Notes |
|-------|------|-------|
| matches | string[] | URL patterns to inject |
| js | string[] | Script files |
| run_at | string | "document_idle" timing |

### Extension Icons

Visual identifiers for toolbar and add-ons page.

| Size | Purpose |
|------|---------|
| 16px | Toolbar (toolbar icon) |
| 32px | Toolbar retina |
| 48px | Add-ons page |
| 128px | About:addons page |

---

## Key Relationships

```
Extension
├── manifest.json (configuration)
├── popup.html (React entry)
├── background.js (message hub)
├── content.js (form injection)
└── icons/ (visual assets)
```

---

## Validation Rules

1. manifest_version MUST be 3 for Firefox 109+
2. gecko strict_min_version MUST be "109.0" or higher
3. All icon files MUST exist at specified paths
4. popup.html MUST load built React bundle correctly
5. Background and content scripts MUST be valid ES modules

---

## Caching Strategy (TanStack Query)

| Query Key | Cache Time | Notes |
|----------|-----------|-------|
| ['jobs'] | 5 min | Job links list |
| ['job', id] | 10 min | Single job |
| ['profile'] | 30 min | User profile |
| ['fields', url] | 1 min | Detected fields |

---

## State Transitions

### Extension Load States
1. **Loading** - Extension files loading
2. **Ready** - All scripts initialized
3. **Active** - Popup or content script in use
4. **Error** - Script error, graceful degradation

### Form Detection States
1. **Idle** - No scan in progress
2. **Scanning** - Page analysis in progress
3. **Detected** - Fields identified
4. **Filling** - Form filling in progress
5. **Complete** - All operations done