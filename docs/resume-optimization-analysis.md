# Resume Optimization Analysis for Firefox Extension Import

**Date**: 2026-03-19
**Context**: Brainstorming session on optimizing `.shared/resume-all.md` for form-filling extension

---

## Executive Summary

The current system uses a **RAG (Retrieval-Augmented Generation)** architecture where:
1. Form field labels are converted to embeddings
2. Qdrant vector DB is queried for similar context chunks
3. An LLM generates answers based on retrieved context
4. A field classifier enables direct extraction for common fields (name, email, phone, etc.)

**Key Finding**: The resume file `.shared/resume-all.md` is **NOT directly used**. Instead, a hardcoded `PROFILE_DATA` dictionary in `scripts/ingest_profile.py` is the actual data source.

---

## System Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Firefox       │     │   Backend API   │     │    Qdrant       │
│   Extension     │────▶│   (FastAPI)     │────▶│   (Vector DB)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       ▲
        │                       ▼                       │
        │                ┌─────────────────┐            │
        │                │  Mistral API    │            │
        │                │ (Embeddings+LLM)│            │
        │                └─────────────────┘            │
        │                                               │
        └───────────────────────────────────────────────┘
                    (displays filled values)
```

---

## Vector DB Querying Mechanism

### Query Flow

1. **Signal Extraction** (`extension/content/signal-extractor.js`)
   - Extracts: `autocomplete`, `label_text`, `input_name`, `html_type`, `placeholder`
   - Creates combined text for pattern matching

2. **API Request** (`extension/content/api-client.js`)
   ```javascript
   POST http://localhost:8000/fill-form
   {
     "label": "Years of Python experience",
     "signals": { "autocomplete": "name", "label_text": "Full Name", ... }
   }
   ```

3. **Backend Processing** (`src/api/routes.py`)
   - Generates 1024-dim embedding via Mistral API (mistral-embed model)
   - Queries Qdrant collection "resume" with k=5 retrieval
   - Classifies field type for direct extraction
   - Falls back to LLM generation if no direct match

4. **Vector Search** (`src/services/retriever.py`)
   ```python
   response = await client.query_points(
       collection_name="resume",
       query=query_vector,
       limit=5,
       with_payload=True,
   )
   ```

### Confidence Levels

| Level | Avg Score Threshold | Meaning |
|-------|---------------------|---------|
| `high` | >= 0.8 | Multiple relevant chunks with clear match |
| `medium` | >= 0.5 | Some relevant context found |
| `low` | < 0.5 | Weak or ambiguous matches |
| `none` | 0 chunks | No relevant context retrieved |

### Profile Chunk Retrieval

For direct field extraction, the system fetches a special profile chunk:
```python
# Filter by type "p" (profile)
scroll_filter={"must": [{"key": "t", "match": {"value": "p"}}]}
```

---

## Current Resume Structure Analysis

### Issues Identified in `.shared/resume-all.md`

1. **Dual Language Content**
   - Contains both German and English sections
   - Embeddings may be diluted by language mixing
   - Job sites may query in either language

2. **Inconsistent Field Formats**
   - `available_from: 01.04.2026` (not standard date format)
   - `salary: 75.000 €` (currency symbol may cause parsing issues)
   - Contact info scattered across multiple sections

3. **Duplicate Information**
   - Same projects listed multiple times
   - Contact info repeated in both German and English sections
   - Work experience duplicated

4. **Non-Standard Structure**
   - Mixed markdown headers (H1, H2, H3)
   - Inconsistent delimiter usage
   - Projects section mixed with work experience

5. **Missing Direct Mappings**
   - No LinkedIn URL (set to `null` in profile data)
   - GitHub listed as `github.com/aliuosio` but not consistently formatted
   - Phone format: `+49 177 639 40 82` (with spaces)

---

## Current Ingestion Process

### Profile Data Structure (from `ingest_profile.py`)

```python
PROFILE_DATA = {
    "t": "p",                    # Type: profile
    "text": "...",              # Text for embedding
    "d": "back",                # Domain: backend
    "tech": ["PHP", "Python", ...],  # Technologies list
    "role": "Senior Developer",
    "lang": "en",
    "profile": {
        "fn": "Osiozekha Aliu",
        "em": "aliu@dev-hh.de",
        "ph": "+49 177 639 40 82",
        "adr": {
            "st": "Schleusentwiete 1",
            "zip": "22399",
            "city": "Hamburg",
            "cc": "DE",
        },
        "avail": "2026-04-01",
        "sal": 75000,
        "social": {"gh": "aliuosio", "li": None},
    },
}
```

### Field Classifier Mappings

| Field Type | Profile Path | Example Value |
|------------|--------------|---------------|
| `full_name` | `profile.fn` | "Osiozekha Aliu" |
| `first_name` | `profile.fn` | (Full name returned) |
| `last_name` | `profile.fn` | (Full name returned) |
| `email` | `profile.em` | "aliu@dev-hh.de" |
| `phone` | `profile.ph` | "+49 177 639 40 82" |
| `city` | `profile.adr.city` | "Hamburg" |
| `street` | `profile.adr.st` | "Schleusentwiete 1" |
| `zip` | `profile.adr.zip` | "22399" |
| `country` | `profile.adr.cc` | "DE" |
| `github` | `profile.social.gh` | "aliuosio" |
| `linkedin` | `profile.social.li` | (None) |

---

## Recommendations

### 1. Create Structured Resume Source File

**Problem**: Current `ingest_profile.py` has hardcoded data, not reading from `.shared/resume-all.md`

**Solution**: Create a structured JSON/YAML file that the ingestion script reads:

```yaml
# .shared/resume-profile.yaml
profile:
  fn: "Osiozekha Aliu"
  em: "aliu@dev-hh.de"
  ph: "+49 177 639 40 82"
  adr:
    st: "Schleusentwiete 1"
    zip: "22399"
    city: "Hamburg"
    cc: "DE"
  avail: "2026-04-01"
  sal: 75000
  social:
    gh: "aliuosio"
    li: null  # Add when available

text:
  en: |
    Senior E-Commerce & Backend Developer with 20 years of professional experience...
  de: |
    Senior E-Commerce & Backend Entwickler mit 20 Jahren experience...

tech:
  - PHP
  - Python
  - JavaScript
  - React
  - Docker
  - Magento
  - n8n

role: "Senior Developer"
lang: "en"
```

### 2. Normalize Data Formats

| Field | Current | Recommended |
|-------|---------|-------------|
| `available_from` | `01.04.2026` | `2026-04-01` (ISO date) |
| `salary` | `75.000 €` | `75000` (integer) |
| `phone` | `+49 177 639 40 82` | `+491776394082` (no spaces) |
| `github` | `github.com/aliuosio` | `aliuosio` (username only) |

### 3. Enhance Vector Search Quality

**Chunking Strategy**:
- Split resume into semantic chunks by topic
- Each chunk should be 100-500 tokens
- Include metadata (type, language, relevance)

**Suggested Chunk Categories**:
```python
CHUNK_TYPES = {
    "profile": "p",      # Personal info (name, contact)
    "experience": "e",   # Work experience
    "skill": "s",         # Technical skills
    "project": "pr",     # Project details
    "education": "ed",   # Education (if any)
}
```

### 4. Add Missing Fields

Currently missing from profile but commonly requested:
- **LinkedIn URL**: Add to profile.social.li
- **Nationality**: Already in resume but not in structured data
- **Languages spoken**: Not captured
- **Work authorization**: Not captured (EU citizen, visa status)

### 5. Improve Resume Markdown Structure

**Current Issues**:
- Mixed German/English sections confuse vector search
- Inconsistent header hierarchy
- Duplicate information

**Recommended Structure**:
```markdown
# Personal Profile
- Name: Osiozekha Aliu
- Email: aliu@dev-hh.de
- Phone: +49 177 639 40 82
- Location: Hamburg, Germany
- GitHub: github.com/aliuosio
- Available: April 2026
- Expected Salary: €75,000

# Professional Summary
[Single paragraph, 3-5 sentences]

# Skills
## Backend
- PHP (20 years)
- Python (5 years)
...

## Frontend
- JavaScript
- React
...

# Work Experience
[Each job as structured entry]

## Projects
[Each project with clear metadata]
```

### 6. Update Ingestion Script

**Current**: Hardcoded `PROFILE_DATA` dictionary

**Recommended**: Read from external file with validation

```python
# scripts/ingest_profile.py (updated)
import yaml
from pathlib import Path

def load_resume_profile(path: str = ".shared/resume-profile.yaml") -> dict:
    """Load resume profile from YAML file."""
    profile_path = Path(path)
    if not profile_path.exists():
        raise FileNotFoundError(f"Profile file not found: {path}")
    
    with open(profile_path) as f:
        data = yaml.safe_load(f)
    
    # Validate required fields
    required = ["fn", "em", "ph"]
    for field in required:
        if field not in data.get("profile", {}):
            raise ValueError(f"Missing required field: profile.{field}")
    
    return data
```

### 7. Add More Semantic Field Types

**Current Supported**:
- full_name, first_name, last_name
- email, phone
- city, street, zip, country
- github, linkedin, url

**Recommended Additions**:
- `availability_date` - When can start work
- `salary_expectation` - Expected salary
- `years_experience` - Total years of experience
- `current_location` - Current city/country
- `work_authorization` - Visa/work permit status
- `languages` - Languages spoken
- `nationality` - Citizenship

---

## Import Process for Future Sessions

### Step-by-Step Guide

1. **Prepare Resume Data File**
   ```bash
   # Create YAML file from resume
   cp .shared/resume-all.md .shared/resume-profile.yaml
   # Edit to match required structure
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Ingest Profile**
   ```bash
   docker-compose exec api-backend python scripts/ingest_profile.py
   ```

4. **Verify Ingestion**
   ```bash
   curl http://localhost:8000/health
   ```

5. **Test Form Filling**
   - Load Firefox extension
   - Navigate to job application page
   - Click extension icon
   - Verify fields fill correctly

### Quick Commands Reference

```bash
# Re-ingest profile after updates
docker-compose restart api-backend

# Check Qdrant collections
curl http://localhost:6333/collections

# View ingested points (collection name: resume)
curl http://localhost:6333/collections/resume/points/scroll
```

---

## Technical Debt & Future Improvements

### Short Term
1. ✅ Create YAML profile file
2. ✅ Update `ingest_profile.py` to read from file
3. ✅ Add LinkedIn URL
4. ✅ Normalize phone/salary formats

### Medium Term
1. 🔲 Multi-chunk ingestion (split resume by sections)
2. 🔲 Add more field classifiers
3. 🔲 Bilingual support (German/English queries)

### Long Term
1. 🔲 Automatic resume sync from `.shared/resume-all.md`
2. 🔲 Multiple resume versions (tailored per job type)
3. 🔲 Experience timeline vector search
4. 🔲 Skills matrix with proficiency levels

---

## Field Classifier Pattern Reference

Current patterns in `src/services/field_classifier.py`:

```python
# High Priority: autocomplete attributes
AUTOCOMPLETE_MAP = {
    "name": FULL_NAME,
    "given-name": FIRST_NAME,
    "family-name": LAST_NAME,
    "email": EMAIL,
    "tel": PHONE,
    "street-address": STREET,
    "city": CITY,
    "postal-code": ZIP,
    "country": COUNTRY,
    "url": URL,
}

# Medium Priority: label patterns
NAME_PATTERNS = [r"\bname\b", r"\bfull\s*name\b", ...]
EMAIL_PATTERNS = [r"\bemail\b", r"\be-?mail\s*address\b", ...]
PHONE_PATTERNS = [r"\bphone\b", r"\btelephone\b", r"\bmobile\b", ...]
```

---

## Technical Specifications

| Component | Technology | Details |
|-----------|------------|---------|
| Embeddings | Mistral API | `mistral-embed` model, 1024 dimensions |
| LLM | Mistral API | `mistral-small-latest`, temperature 0.3 |
| Vector DB | Qdrant | Collection: `resume` |
| Retrieval | k=5 | Top 5 chunks with similarity scores |

---

## Conclusion

The current system works well for basic fields but has significant optimization potential:

1. **Immediate Fix**: Create structured YAML profile file instead of hardcoded data
2. **Quick Win**: Normalize phone/salary formats
3. **Medium Effort**: Add LinkedIn URL and missing fields
4. **Larger Effort**: Multi-chunk ingestion for better semantic search

The resume file `.shared/resume-all.md` should be considered a **source of truth** but requires a transformation step to convert it to the structured format that the ingestion script can consume.