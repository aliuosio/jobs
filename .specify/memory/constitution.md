<!--
## Sync Impact Report

**Version change**: 1.2.0 → 1.3.0
**Modified principles**: N/A
**Added sections**: 
  - Runtime Constitution VI: Playwright Browser Automation
**Removed sections**: N/A
**Templates requiring updates**:
  - ✅ All templates align (new section is additive)
**Follow-up TODOs**: None

-->

# Job Forms Helper Constitution

## Core Principles

### I. SOLID Design (NON-NEGOTIABLE)

All code MUST adhere to SOLID principles:

- **Single Responsibility**: Each class/function has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Many specific interfaces over one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

Services are organized by responsibility (embedder, retriever, generator, validation).
Each service has a single, well-defined purpose with clear boundaries.

### II. DRY (Don't Repeat Yourself) (NON-NEGOTIABLE)

Knowledge MUST have a single, authoritative representation:

- Shared logic extracted to utilities (`src/utils/`)
- Configuration centralized in `src/config.py` via Pydantic Settings
- Schemas defined once in `src/api/schemas.py` with full type annotations
- No duplicated business logic across services

### III. YAGNI (You Aren't Gonna Need It) (NON-NEGOTIABLE)

Implement only what is currently required:

- No speculative features or "might need later" abstractions
- Configuration values limited to actual runtime needs
- Services contain only methods currently used
- Defer optimization until measured performance indicates need

### IV. KISS (Keep It Simple, Stupid) (NON-NEGOTIABLE)

Simplicity MUST be prioritized over cleverness:

- Prefer explicit code over implicit magic
- Clear, linear data flow: Extension → API → Services → External
- Avoid over-engineering; prefer straightforward solutions
- Code should be understandable by reading, not debugging

### V. Type Safety (NON-NEGOTIABLE)

All code MUST be 100% type-safe:

- Python: Full type annotations on all functions, methods, and class attributes
- JavaScript: JSDoc type annotations for extension code
- Pydantic models for all API schemas with validation
- No `any` types, no `@ts-ignore`, no `# type: ignore`
- Runtime validation via Pydantic Field constraints

### VI. Composition Over Inheritance

Inheritance is PROHIBITED; use composition exclusively:

- Services compose functionality through dependency injection
- Shared behavior through functions, not base classes
- Configuration through composition, not inheritance hierarchies
- Extension modules compose through explicit imports

### VII. Git-Flow Branching Strategy (NON-NEGOTIABLE)

All development MUST follow git-flow branching conventions:

- **`main`**: Production-ready code only. Always deployable. Protected branch.
- **`develop`**: Integration branch for features. Pre-release testing happens here.
- **`feature/*`**: One branch per feature. Naming: `feature/###-short-description`
- **`bugfix/*`**: One branch per bug fix. Naming: `bugfix/###-short-description`
- **`hotfix/*`**: Emergency production fixes. Naming: `hotfix/###-short-description`
- **`release/*`**: Release preparation. Naming: `release/vX.Y.Z`

**Branch Lifecycle**:
1. Create branch from appropriate parent (`develop` for features, `main` for hotfixes)
2. Implement changes with atomic commits
3. Merge back via pull request (no direct commits to `main`/`develop`)
4. Delete branch after merge

**Rationale**: Isolated branches enable parallel development, clear history, and safe rollbacks.
Every unit of work must be traceable to a single branch.

## Technical Constraints

### Runtime Constitution I: Embedding Dimensions

All embeddings MUST use 1024-dimensional vectors (Mistral `mistral-embed` model).

**Rationale**: Ensures consistency between embedding generation and vector storage.
Mismatched dimensions cause runtime failures in Qdrant similarity search.

### Runtime Constitution II: Retrieval Configuration

Vector search MUST retrieve exactly 5 context chunks (k=5).

**Rationale**: Provides sufficient context for answer generation while limiting token usage.
This value is tuned for resume-to-field matching accuracy.

### Runtime Constitution III: Anti-Hallucination

LLM generation MUST use grounded prompts that forbid fabrication.

**System Prompt Requirements**:
1. ONLY use information from provided context
2. Explicit "I don't have information" fallback
3. NEVER fabricate or infer experience not explicitly stated
4. Low temperature (0.3) for factual responses

**Rationale**: Form fields require accurate resume data, not creative extrapolation.

### Runtime Constitution IV: CORS Configuration

Backend MUST enable CORS for extension origin access.

**Rationale**: Firefox extension requires cross-origin requests to backend API.
Without CORS, extension cannot communicate with backend services.

### Runtime Constitution V: Event Dispatching

Form field modifications MUST dispatch input and change events with `bubbles: true`.

**Rationale**: React/Angular applications listen for bubbled events to detect form changes.
Silent value modifications do not trigger framework state updates.

### Runtime Constitution VI: Playwright Browser Automation

Browser automation for testing and scraping MUST use Playwright:

- Install via `pip install playwright && playwright install chromium`
- Use async Playwright API for consistency with existing async codebase
- Always run headless in CI/CD environments
- Target chromium by default (cross-browser testing optional)

**Rationale**: Playwright provides reliable cross-browser automation with async support,
essential for testing Firefox extension integration and web scraping workflows.

## Development Workflow

### Code Quality Gates

- All functions MUST have docstrings with Args/Returns/Raises
- All API endpoints MUST have structured error responses
- All configuration MUST have sensible defaults documented
- All services MUST log significant operations

### Docker-First Development

All testing and verification MUST be run in Docker using `docker-compose exec api-backend`:

```bash
# Run tests
docker-compose -f docker-compose.yml exec api-backend python -m pytest tests/ -v

# Verify services
docker-compose -f docker-compose.yml exec api-backend curl http://localhost:8000/health
```

Rationale: Ensures consistent environment between development and CI/CD.

### Testing Requirements

- Unit tests for utility functions (`tests/unit/`)
- Integration tests for API endpoints (`tests/integration/`)
- Manual testing via `/health`, `/validate`, `/fill-form` endpoints
- Docker stack validation for full integration

### Documentation Standards

- Self-documenting code: names convey intent
- README for project overview and quick start
- Technical overview for architecture decisions
- Inline comments only for "why", not "what"

## Governance

### Amendment Procedure

1. Proposed changes MUST be documented with rationale
2. Impact on existing code MUST be assessed
3. Migration plan REQUIRED for breaking changes
4. Version MUST increment according to semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Compliance Review

- All code changes MUST verify compliance with Core Principles
- Technical Constraints MUST be referenced in relevant code comments
- Complexity beyond KISS MUST be justified in documentation
- This constitution supersedes conflicting practices

### Runtime Guidance

For runtime development guidance, refer to `AGENTS.md` in the repository root.

**Version**: 1.3.0 | **Ratified**: 2026-03-19 | **Last Amended**: 2026-03-20
