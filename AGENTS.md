# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-22
**Commit:** 563b251
**Branch:** 010-fix-copy-clipboard-button

## OVERVIEW

AI-powered job application management system. Four components: FastAPI backend (RAG pipeline + form filling), Firefox extension (Job Forms Helper + Job Links Manager), n8n automation workflows, comprehensive test suite.

## STRUCTURE

```
jobs/
├── src/                    # FastAPI backend (Python)
│   ├── api/               # Routes + Pydantic schemas
│   ├── services/          # Core business logic
│   └── utils/             # Cache utilities
├── extension-old/         # Legacy Firefox extension (JS/TypeScript)
│   ├── background/       # Background scripts
│   ├── content/          # Content scripts (form detection)
│   ├── popup/            # Popup UI
│   ├── services/         # Extension services
│   └── tests/            # Extension tests
├── extension/            # Modernized React extension
│   ├── src/
│   │   ├── components/  # React UI components
│   │   ├── hooks/        # TanStack Query hooks
│   │   ├── services/     # API services
│   │   ├── content/      # Content script entry
│   │   ├── background/   # Background script
│   │   └── types/        # TypeScript types
│   ├── public/            # Static assets
│   └── dist/             # Build output
├── tests/                # Python test suite
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
├── n8n-workflows/        # n8n automation (JSON)
├── workflows/            # GitHub Actions
├── specs/                # Specifications
└── scripts/              # Utility scripts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Backend API | `src/api/routes.py` | FastAPI endpoints |
| RAG Pipeline | `src/services/retriever.py`, `generator.py`, `embedder.py` | Hybrid search + HyDE + reranking |
| Form Filling | `src/services/field_classifier.py`, `fill_form.py` | Field detection + auto-fill |
| Extension | `extension/manifest.json` | Entry point |
| Tests | `tests/` | Unit, integration, e2e, load |
| Config | `src/config.py` | Environment settings |

## CONVENTIONS

- Python: `src/` layout, `__init__.py` per package, Pydantic v2
- Ruff linter (line-length=100, target-version=py311)
- No pyproject.toml - uses requirements.txt in `.docker/api-backend/`
- Extension: ES Module conversion in progress (see `extension/REFACTORING-PLAN.md`)
- Service classes: global singletons imported directly in routes
- All route handlers: `async def`
- Global singletons pattern: `job_offers_service`, `generator`, `retriever`, `reranker`, `hyde`, `embedder`, `query_cache`

## ANTI-PATTERNS (THIS PROJECT)

- Do NOT use `as any` or `@ts-ignore` for type suppression
- Do NOT delete failing tests to pass - fix the code
- Do NOT commit directly without user request
- Do NOT fabricate experience not in resume (GeneratorService)
- Do NOT add explanatory text for simple fields

## CONSTITUTION

- **TDD Required**: Write failing tests first, then implementation
- **Docker-First**: Always use Docker for backend operations
- **No Unnecessary Comments**: Only essential docstrings
- **No Type Suppression**: No `as any`, no empty catch blocks

## COMMANDS

```bash
# Backend (via Docker)
docker-compose up -d
curl http://localhost:8000/health

# Run tests
docker compose exec api-backend pytest tests/

# Extension (Firefox)
# Load extension from extension/ directory as temporary add-on
```

## NOTES

- Multi-language monorepo: Python (backend) + JavaScript (extension)
- Dependencies: Qdrant, PostgreSQL, Redis, n8n, Mistral API
- n8n workflows: Job Offers Extractor, Job Skills Import, Application Writer, Jobs Fit Chat

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
- Extension Modernization: specs/010-extension-modernization/plan.md
- Extension Manifest Setup: specs/012-extension-manifest/plan.md
- Dockerfile to Compose: specs/011-dockerfile-to-compose/plan.md
- Feature Spec: specs/010-extension-modernization/spec.md
- Research: specs/010-extension-modernization/research.md
- Data Model: specs/010-extension-modernization/data-model.md
<!-- SPECKIT END -->
