# Quickstart: Extension Modernization

## Prerequisites

- Docker + Docker Compose
- Node.js 20+
- Firefox browser (for testing)

## Quick Start

```bash
# Start all services including extension
docker-compose up -d

# Access extension dev server
# http://localhost:5173 (Vite dev server)
```

## Project Structure

```
extension/
├── src/
│   ├── components/     # React UI components
│   ├── hooks/         # TanStack Query hooks
│   ├── services/      # API services
│   ├── content/       # Content script entry
│   ├── background/    # Background script
│   └── types/        # TypeScript types
├── public/            # Static assets
├── dist/             # Build output
└── tests/            # Tests
```

## Development

```bash
# Start Vite dev server
cd extension && npm run dev

# Build for production
cd extension && npm run build

# Load in Firefox
# 1. Open about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select extension/dist/manifest.json
```

## Key Commands

| Command | Description |
|---------|-----------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

## API Integration

The extension communicates with the backend at `http://localhost:8000`:

| Endpoint | Method | Description |
|----------|--------|---------|
| `/api/fields` | POST | Detect form fields |
| `/api/fill` | POST | Fill form fields |
| `/api/jobs` | GET | List jobs |
| `/api/profile` | GET | Get user profile |

## Troubleshooting

- **HMR not working**: Check volume mapping in docker-compose.yml
- **API errors**: Ensure backend is running at localhost:8000
- **Extension not loading**: Check manifest.json for errors