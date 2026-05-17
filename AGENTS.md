# jobs

AI-powered job application management system. FastAPI backend (RAG pipeline + form filling), Firefox extension (Job Forms Helper + Job Links Manager), n8n automation workflows.

## Structure

```
jobs/
├── src/         # FastAPI backend (Python)
├── extension/   # Firefox extension (JS)
├── tests/       # pytest suite (unit, integration, e2e, load)
├── n8n-workflows/
└── specs/       # Feature specs
```

## Dependencies

Qdrant, PostgreSQL, Redis, n8n, Mistral API.

## Commands

```bash
docker-compose up -d
curl http://localhost:8000/health
docker compose exec api-backend pytest tests/
```

## Rules

- [Python & Backend](docs/rules/python.md)
- [API Design](docs/rules/api-design.md)
- [Testing](docs/rules/testing.md)
- [Extension](docs/rules/extension.md)

## Git

- Do not commit directly without user request

## Agents

- [Spec References (SPECKIT)](docs/agents/speckit-links.md)
- [Tooling Configuration](docs/agents/tooling-config.md)