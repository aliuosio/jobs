# Quickstart: Form Filler Browser Extension

**Feature**: 003-form-filler-extension | **Date**: 2026-03-08

## Prerequisites

- Firefox Browser (version 109+)
- Backend API running at `http://localhost:8000`
- Resume embeddings loaded in Qdrant

---

## Quick Start

### 1. Load the Extension

```bash
# Navigate to project root
cd /home/krusty/projects/job-forms

# Open Firefox
# Go to about:debugging
# Click "This Firefox" → "Load Temporary Add-on"
# Select extension/manifest.json
```

### 2. Verify API Connection

1. Click the extension icon in Firefox toolbar
2. Check status shows "API Connected: Yes"
3. If not connected, ensure backend is running:

```bash
# Start backend (if not running)
docker-compose up -d api-backend

# Verify backend health
curl http://localhost:8000/health
```

### 3. Use the Extension

1. Navigate to a job application page
2. Click the extension icon
3. Click "Scan Page" to detect form fields
4. Click "Fill All Forms" to auto-fill
5. Review filled values and submit

---

## Extension Components

| Component | Purpose |
|-----------|---------|
| Popup UI | User interface for triggering actions |
| Content Script | Form detection and value injection |
| Background Script | API communication and message routing |

---

## Development

### Project Structure

```
extension/
├── manifest.json           # Extension manifest
├── background/
│   └── background.js       # Background script
├── content/
│   ├── content.js          # Content script
│   └── content.css         # Styles
├── popup/
│   ├── popup.html          # Popup UI
│   ├── popup.js            # Popup logic
│   └── popup.css           # Popup styles
└── icons/                  # Extension icons
```

### Testing

```bash
# Load extension in Firefox Developer Edition
# Open Browser Console (Ctrl+Shift+J)
# View content script logs
# Test on job application sites
```

### Debug Mode

Add to content script for verbose logging:

```javascript
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log('[FormFiller]', ...args);
}
```

---

## Troubleshooting

### Extension Not Loading

- Check manifest.json syntax
- Verify Firefox version >= 109
- Check Browser Console for errors

### Fields Not Detected

- Ensure forms use standard HTML elements
- Check if page is fully loaded
- Try manual re-scan

### Values Not Filling

- Check if fields are readonly/disabled
- Verify API is responding
- Check content script console logs

### API Connection Failed

- Verify backend is running: `curl http://localhost:8000/health`
- Check Docker containers: `docker-compose ps`
- Verify CORS configuration in backend

---

## Common Job Board Testing

| Site | Notes |
|------|-------|
| Indeed | Standard forms, good test case |
| LinkedIn | Complex forms, wrapper labels |
| Greenhouse | iframe forms, may need permissions |
| Lever | SPA, tests MutationObserver |

---

## Next Steps

1. **Test on real job boards** to validate form detection
2. **Tune detection heuristics** based on results
3. **Add error handling** for edge cases
4. **Consider user settings** for customization
