# Quickstart: Copy Cover Letter Feature

## Prerequisite

**Activate n8n workflow before first use:**

```bash
# Activate the workflow
npx --yes n8nac workflow activate VKuRwjXo1SdXDOKh

# Verify webhook responds to POST
curl -X POST http://localhost:5678/webhook/writer -H "Content-Type: application/json" -d '{"job_offers_id": 1}'
```

## Usage

1. Open Firefox extension popup → Jobs tab
2. Find a job with "Saved" badge (description saved)
3. Click "Generate" to trigger cover letter generation
4. Wait for "Ready" badge (polling takes ~1-3 min)
5. Click 📋 icon to copy cover letter to clipboard

## Tests

Run tests:
```bash
node extension/tests/cover-letter.test.js
```

All 23 tests should pass.