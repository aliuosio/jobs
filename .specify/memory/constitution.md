# Jobs Constitution

> **Sync Impact Report**
>
> - Version: 0.3.0 → 0.4.0
> - Changed: Added Docker-Based Deployment principle (Section V)
> - Templates: ✅ No template changes required
> - Follow-up: None

## Core Principles

### I. SOLID & DRY Principles (MANDATORY)

All code MUST follow SOLID principles and DRY methodology:

- **Single Responsibility**: Every class, function, and module MUST have one clear purpose
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Prefer small, focused interfaces over large ones
- **Dependency Inversion**: Depend on abstractions, not concretions
- **DRY (Don't Repeat Yourself)**: Never duplicate logic. Extract to shared utilities, base classes, or modules

**Rationale**: Ensures maintainable, testable, and extensible code. Violations must be explicitly justified in the plan.

---

### II. Design Pattern Selection (MANDATORY)

For every new problem, the architect MUST:

1. Analyze the problem domain to identify the core concern
2. Research known design patterns that address similar concerns
3. Select the best pattern based on: simplicity, maintainability, testability, and project fit
4. Document why the selected pattern is superior to alternatives

**Rationale**: Prevents over-engineering and ensures battle-tested solutions. Pattern choice must be justified in implementation plan.

---

### III. Test Driven Development (MANDATORY for Code)

For all code implementations (Python, JavaScript, TypeScript):

- **Step 1**: Write failing tests that describe expected behavior
- **Step 2**: Get user approval on test scenarios
- **Step 3**: Implement minimum code to pass tests
- **Step 4**: Refactor while maintaining test pass

**Red-Green-Refactor cycle is STRICTLY enforced.**

**Exception**: n8n workflow files (JSON) are EXCLUDED from TDD and follow their own testing approach.

**Rationale**: Ensures testable, behavior-driven code. Tests serve as living documentation.

---

### IV. n8n Workflow Management (MANDATORY)

For all n8n workflow operations, MUST use n8nac CLI and its skills:

- **n8nac skills validate**: Validate workflow JSON/TypeScript before deployment
- **n8nac skills search**: Search nodes, docs, and examples
- **n8nac skills node-info**: Get full node schema and documentation
- **n8nac pull/push**: Sync workflows from/to n8n instance (not local JSON files)

**Workflow Management Rules**:

- NEVER edit workflows directly in `n8n-workflows/` folder
- Use `n8nac pull` to fetch workflows from n8n instance
- Use `n8nac push` to deploy changes to n8n instance
- Validate with `n8nac skills validate` before push

**Rationale**: Ensures workflows are managed through n8nac for proper validation, sync, and AI-assisted development.

---

### V. Docker-Based Deployment (MANDATORY)

The entire stack runs via Docker Compose. All Docker containers MUST be defined in `docker-compose.yml`:

- **Container Reuse**: Reuse existing containers by extending them when possible
- **New Services**: Create new containers only when extending would require more effort than creating a new one
- **Service Dependencies**: All inter-service dependencies MUST be documented in docker-compose.yml
- **Local Development**: Developers MUST use `docker-compose up` for local development
- **Environment Variables**: All environment-specific configuration MUST use `.env` files loaded by docker-compose

**Rationale**: Ensures consistent, reproducible deployments across all environments. Centralizes service definition and dependency management.

---

## Additional Constraints

### Technology Standards

- **Python**: Target Python 3.11+, use Ruff linter (line-length=100)
- **JavaScript**: Extension uses ES Modules where possible
- **Testing**: pytest for Python, extension tests in `extension/tests/`
- **No type suppression**: NEVER use `as any`, `@ts-ignore`, or `@ts-expect-error`

### Code Review Requirements

- All PRs MUST verify constitution compliance
- Complexity must be justified in the plan (see Constitution Check section)
- SOLID/DRY violations require explicit rationale
- Design pattern choices must be documented

---

## Development Workflow

The Jobs project follows this workflow:

1. **Idea** → User describes feature requirement
2. **Branch** → `speckit.git.feature` creates `feature/{name}` branch
3. **Specify** → `/speckit.specify` creates spec with user stories
4. **Clarify** → `/speckit.clarify` identifies gaps (optional)
5. **Plan** → `/speckit.plan` creates implementation plan with Constitution Check
6. **Checklist** → `/speckit.checlist` creates checklist
7. **Tasks** → `/speckit.tasks` generates task list
8. **Review** → `speckit.analyze` validates consistency
9. **Implement** →`speckit.implement`Code with TDD for code files

---

## Governance

**Version**: 0.4.0 | **Ratified**: 2026-04-17 | **Last Amended**: 2026-04-22

### Amendment Procedure

1. Constitutional changes require a spec with user stories
2. Changes to core principles (I-V) are MAJOR version bumps
3. New principles or constraint additions are MINOR version bumps
4. Clarifications and wording fixes are PATCH version bumps

### Compliance

- All implementation plans MUST include Constitution Check
- All PRs/reviews must verify compliance
- Design pattern selection must be documented in plan.md
- SOLID/DRY violations require explicit justification
