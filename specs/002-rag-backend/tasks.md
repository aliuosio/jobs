# Tasks: RAG Backend API

**Input**: Design documents from `/specs/002-rag-backend/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/openapi.yaml ✓

**Tests**: Not explicitly requested in spec. Test tasks included as optional in Polish phase.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure and install dependencies

- [X] T001 Create project directory structure per plan.md (src/, tests/, src/api/, src/services/, src/utils/, tests/unit/, tests/integration/)
- [X] T002 Initialize Python project with requirements.txt containing: fastapi, uvicorn, qdrant-client, openai, httpx, pydantic-settings, tenacity, pytest, pytest-asyncio
- [X] T003 [P] Create .env.example file with all environment variables from data-model.md Settings entity
- [X] T004 [P] Create .gitignore file for Python project

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create src/__init__.py with package initialization
- [X] T006 [P] Create src/config.py with Settings class using pydantic-settings per research.md section 2
- [X] T007 [P] Create src/api/__init__.py with package initialization
- [X] T008 [P] Create src/api/schemas.py with AnswerRequest, AnswerResponse, HealthResponse, ErrorResponse Pydantic models per data-model.md
- [X] T009 [P] Create src/services/__init__.py with package initialization
- [X] T010 [P] Create src/utils/__init__.py with package initialization
- [X] T011 Create src/main.py with basic FastAPI app instance and logging configuration per research.md section 1
- [X] T012 [P] Create tests/__init__.py with package initialization
- [X] T013 [P] Create tests/conftest.py with pytest fixtures and AsyncClient setup per research.md section 7
- [X] T014 Implement /health endpoint in src/api/routes.py returning HealthResponse per contracts/openapi.yaml
- [X] T015 Register router in src/main.py and include /health endpoint

---

## Phase 3: User Story 3 - Connect to Vector Database (Priority: P1)

**Goal**: Establish reliable connection to Qdrant vector database for resume embedding retrieval

**Independent Test**: Start the backend and verify it can ping the vector database health endpoint and retrieve sample embeddings.

**Why this order**: US1 (answer generation) depends on vector DB connectivity, so US3 must complete first.

### Implementation for User Story 3

- [X] T016 [US3] Create src/services/retriever.py with RetrieverService class using AsyncQdrantClient per research.md section 3
- [X] T017 [US3] Implement async connect() and close() methods in RetrieverService
- [X] T018 [US3] Implement search() method with k=5 parameter in RetrieverService (Constitution II compliance)
- [X] T019 [US3] Add lifespan context manager in src/main.py for RetrieverService and EmbedderService connection lifecycle
- [X] T020 [US3] Add connection retry logic with exponential backoff using tenacity in src/services/retriever.py
---

## Phase 4: User Story 1 - Generate Contextual Answers (Priority: P1) 🎯 MVP

**Goal**: Generate accurate answers based on resume data for form field labels

**Independent Test**: Send a POST request with a form label (e.g., "Years of Python experience") and receive an answer derived from the resume vector store.

### Implementation for User Story 1

- [X] T021 [US1] Create src/services/embedder.py with EmbedderService class and embed() method using AsyncOpenAI with dimensions=1536 (Constitution I compliance) per research.md section 6
- [X] T022 [P] [US1] Create src/services/generator.py with GeneratorService class and generate_answer() method with anti-hallucination system prompt (Constitution III compliance) per research.md section 4
- [X] T023 [P] [US1] Create src/utils/retry.py with retry_qdrant and retry_llm decorators using tenacity per research.md section 5
- [X] T024 [US1] Apply retry decorators to retriever and generator service methods
- [X] T025 [US1] Implement /fill-form POST endpoint in src/api/routes.py with full RAG pipeline
- [X] T026 [US1] Add confidence level calculation in /fill-form: high (avg score >= 0.8), medium (>= 0.5), low (< 0.5), none (0 chunks)
- [X] T027 [US1] Add context assembly logic to format retrieved chunks into prompt string for generator
- [X] T028 [US1] Add error handling for edge cases: no context found, API errors, rate limiting
- [X] T028a [US1] Add request payload size validation (10KB limit) in src/api/routes.py returning 413 error per spec edge case
- [X] T029 [US1] Add request/response logging in /fill-form endpoint (FR-010 compliance)

---

## Phase 5: User Story 2 - Cross-Origin Access for Extension (Priority: P1)

**Goal**: Enable Firefox extension communication without CORS errors

**Independent Test**: From a Firefox extension context, make a fetch request to the API health endpoint and receive a successful response.

### Implementation for User Story 2

- [X] T031 [US2] Add CORSMiddleware to FastAPI app in src/main.py with allow_origins for moz-extension://* and localhost per research.md section 1
- [X] T032 [US2] Configure CORS allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
- [X] T033 [US2] Verify preflight OPTIONS request handling works correctly
---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Testing, validation, and final improvements

### Optional Tests (if requested)

- [ ] T034 [P] Create tests/unit/test_retriever.py with mocked AsyncQdrantClient
- [ ] T035 [P] Create tests/unit/test_generator.py with mocked AsyncOpenAI
- [ ] T036 [P] Create tests/integration/test_api.py for /fill-form endpoint
- [ ] T037 [P] Create tests/integration/test_health.py for /health endpoint

### Final Validation

- [X] T038 Validate all quickstart.md scenarios work correctly
- [X] T039 Add comprehensive error response handling per contracts/openapi.yaml (400, 413, 500, 503)
- [X] T040 Verify all Constitution principles are implemented (I-V)
---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US3 (Phase 3)**: Depends on Foundational - Vector DB connection
- **US1 (Phase 4)**: Depends on US3 - Needs DB for answer generation
- **US2 (Phase 5)**: Depends on Foundational only - CORS is independent
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

```
Foundational ──┬──▶ US3 (Vector DB) ──▶ US1 (Answers)
               │
               └──▶ US2 (CORS) [parallel with US3]
```

- **US3 (Vector DB)**: Foundational only - no story dependencies
- **US1 (Answers)**: Depends on US3 - needs vector DB
- **US2 (CORS)**: Foundational only - independent, can parallel with US3

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T003, T004 can run in parallel (different files)

**Within Foundational (Phase 2)**:
- T006, T007, T008, T009, T010, T012, T013 can all run in parallel (different files)

**Within US1 (Phase 4)**:
- T022, T023 can run in parallel (different files: generator.py, retry.py)

**Within Polish (Phase 6)**:
- T034, T035, T036, T037 can run in parallel (different test files)

**Across User Stories**:
- US2 (CORS) can run in parallel with US3 (Vector DB) after Foundational completes

---

## Parallel Example: Foundational Phase

```bash
# Launch all independent foundational tasks together:
Task: "Create src/config.py with Settings class"
Task: "Create src/api/schemas.py with Pydantic models"
Task: "Create tests/conftest.py with pytest fixtures"

# Then sequentially:
Task: "Create src/main.py with FastAPI app"
Task: "Implement /health endpoint"
```

## Parallel Example: User Story 1

```bash
# Launch all independent service files together:
Task: "Create src/services/embedder.py with EmbedderService"
Task: "Create src/services/generator.py with GeneratorService"
Task: "Create src/utils/retry.py with retry decorators"

# Then sequentially:
Task: "Implement /fill-form endpoint with full pipeline"
Task: "Add error handling and logging"
```

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US3 (Vector DB Connection)
4. Complete Phase 4: US1 (Answer Generation) ← **MVP READY**
5. **STOP and VALIDATE**: Test answer generation end-to-end
6. Complete Phase 5: US2 (CORS) if extension integration needed
7. Complete Phase 6: Polish as needed

### Incremental Delivery

1. **Foundation** (Phase 1-2): Basic API with /health endpoint
2. **MVP** (Phase 3-4): Full RAG pipeline generating answers
3. **Extension-Ready** (Phase 5): CORS enabled for Firefox extension
4. **Production-Ready** (Phase 6): Tests, validation, error handling

### Suggested MVP Scope

**Minimum Viable Product = Phase 1 + Phase 2 + Phase 3 + Phase 4**
- Project structure and dependencies
- Configuration management
- Health endpoint
- Vector database connection
- Full RAG answer generation pipeline

---

## Notes

- All [P] tasks work on different files with no dependencies
- [Story] labels map tasks to specific user stories for traceability
- US3 must complete before US1 (dependency)
- US2 is independent and can be done in parallel with US3
- Tests are optional - only implement if requested
- Commit after each task or logical group
- Verify Constitution compliance (I-V) at each checkpoint
