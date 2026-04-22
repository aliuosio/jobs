# Quickstart: Extension Manifest & Setup

## Prerequisites

- Node.js 18+
- npm
- Firefox 109+
- Docker (optional, for Docker-based development)

## Build

```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Build extension
npm run build

# Verify dist/ contains:
# - manifest.json
# - popup.html
# - background.js
# - content.js
# - assets/
# - icons/
```

## Load in Firefox

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on"**
4. Select `extension/dist/manifest.json`
5. Extension icon appears in toolbar

## Development

```bash
# Development mode with hot reload (if running in Docker)
docker-compose up -d extension

# Or locally
cd extension
npm run dev
```

**Note**: Hot reload works for React components. Full extension reload required for manifest changes.

## Verify Installation

1. Click extension icon in toolbar
2. Verify popup shows Job Links tab
3. Switch to Job Forms Helper tab
4. Click "Scan Page" on any job application form
5. Verify fields are detected

## File Structure

```
extension/
├── dist/                    # Built extension (load this)
│   ├── manifest.json        # Extension config
│   ├── popup.html           # Popup entry
│   ├── background.js        # Background script
│   ├── content.js           # Content script
│   ├── assets/              # Built React app
│   └── icons/               # Extension icons
├── public/                  # Source files
│   ├── manifest.json
│   ├── popup.html
│   └── icons/
└── src/                     # React source
    ├── background/
    ├── content/
    └── ...
```

## Troubleshooting

### Extension won't load
- Check manifest.json syntax
- Verify all referenced files exist
- Check Firefox browser console (F12)

### Popup blank
- Verify popup.html loads React bundle correctly
- Check browser console for React errors

### Content script not working
- Verify content_scripts matches in manifest
- Check if page blocks content scripts