# Quick Start: Form QA Field Testing

**Date**: 2026-03-19
**Feature**: 001-form-qa-field-testing

## Prerequisites

- Docker and Docker Compose installed
- Mistral API key (for embeddings and generation)
- Firefox browser (for the extension)
- Python 3.8+ (for local development)

## Quick Start Steps

### 1. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your Mistral API key
# MISTRAL_API_KEY=your_api_key_here
```

### 2. Start Services

```bash
# Start Qdrant and backend API
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Verify Health

```bash
# Check backend health
curl http://localhost:8000/health

# Validate configuration
curl http://localhost:8000/validate
```

### 4. Test Form Filling

#### Test First Name Field

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{
    "label": "First Name",
    "signals": {
      "autocomplete": "given-name",
      "html_type": "text"
    }
  }'
```

Expected response:
```json
{
  "answer": "John",
  "has_data": true,
  "confidence": "high",
  "context_chunks": 3,
  "field_value": "John",
  "field_type": "first_name"
}
```

#### Test Email Field

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Email Address",
    "signals": {
      "autocomplete": "email",
      "html_type": "email"
    }
  }'
```

#### Test City Field

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{
    "label": "City",
    "signals": {
      "autocomplete": "address-level2"
    }
  }'
```

#### Test Postcode Field

```bash
curl -X POST http://localhost:8000/fill-form \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Postcode",
    "signals": {
      "autocomplete": "postal-code"
    }
  }'
```

### 5. Seed Resume Data

If you don't have resume data in Qdrant:

```bash
# Run the ingestion script
python scripts/ingest_profile.py
```

### 6. Run Tests

```bash
# Run all tests
pytest tests/

# Run specific test
pytest tests/unit/test_field_classifier.py -v

# Run with coverage
pytest tests/ --cov=src
```

### 7. Install Firefox Extension

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `extension/` directory
4. The extension icon will appear in your toolbar

## Testing All Six Fields

### Test Script

Create a test script to validate all six fields:

```bash
#!/bin/bash
# test_all_fields.sh

FIELDS=("First Name" "Last Name" "Email" "City" "Postcode" "Street")
AUTOCOMPLETE=("given-name" "family-name" "email" "address-level2" "postal-code" "street-address")

for i in "${!FIELDS[@]}"; do
  echo "Testing field: ${FIELDS[$i]}"
  curl -X POST http://localhost:8000/fill-form \
    -H "Content-Type: application/json" \
    -d "{\"label\": \"${FIELDS[$i]}\", \"signals\": {\"autocomplete\": \"${AUTOCOMPLETE[$i]}\"}}" \
    | jq '.field_type, .field_value, .confidence'
  echo "---"
done
```

### Expected Results

All six fields should return:
- `has_data: true`
- `confidence: high`
- Correct `field_type` (first_name, last_name, email, city, postcode, street)
- Valid `field_value` matching the resume data

## Troubleshooting

### Backend won't start
1. Check Qdrant is running: `docker ps | grep qdrant`
2. Verify environment variables: `cat .env`
3. Check logs: `docker-compose logs api-backend`

### Extension can't connect to backend
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS configuration in `src/main.py`
3. Ensure port 8000 is not blocked

### No resume data found
1. Run the ingest script: `python scripts/ingest_profile.py`
2. Verify data in Qdrant: `curl http://localhost:6333/collections/resume`
3. Check collection name matches `QDRANT_COLLECTION` in `.env`

### Invalid postcode/email errors
1. Check validation patterns in `data-model.md`
2. Verify resume data has valid formats
3. Test with curl to see exact error messages

## Development Mode

### Run Backend Locally (without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn src.main:app --reload --port 8000
```

### Run Qdrant Only via Docker

```bash
# Start only Qdrant
docker-compose up -d qdrant

# Access Qdrant dashboard
open http://localhost:6333/dashboard
```

## Next Steps

1. Review the [API Contract](contracts/api-contract.md) for detailed endpoint documentation
2. Check the [Data Model](data-model.md) for field validation rules
3. Read the [Research](research.md) for technology decisions and rationale
