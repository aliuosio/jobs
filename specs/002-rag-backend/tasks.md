# Tasks: RAG Backend API

**Input**: Design documents from `/specs/002-rag-backend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend module**: `backend/src/` at repository root
- **API layer**: `backend/src/api/`
- **Services layer**: `backend/src/services/`
- **Prompts**: `backend/src/prompts/`
- **Tests**: `backend/tests/`

---

## Phase 1: Setup (Project Structure)

**Purpose**: Create backend project structure and initialize dependencies

- [ ] T001 Create `backend/` directory structure with `src/` and `tests/` subdirectories
- [ ] T002 Create `backend/requirements.txt` with core dependencies (fastapi, uvicorn, langchain, langchain-openai, langchain-qdrant, qdrant-client, pydantic, pydantic-settings, python-dotenv, tenacity)
- [ ] T003 [P] Create `backend/src/__init__.py` (empty init file)
- [ ] T004 [P] Create `backend/src/api/__init__.py` (empty init file)
- [ ] T005 [P] Create `backend/src/services/__init__.py` (empty init file)
- [ ] T006 [P] Create `backend/src/prompts/__init__.py` (empty init file)
- [ ] T007 [P] Create `backend/tests/__init__.py` (empty init file)
- [ ] T008 Create `backend/Dockerfile` for api-backend service

---

## Phase 2: Foundational (Configuration & Core Infrastructure)

**Purpose**: Core configuration and shared infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create `backend/src/config.py` with Settings class (pydantic-settings) loading from environment variables
- [ ] T010 [P] Create `backend/src/api/schemas.py` with FillFormRequest Pydantic model
- [ ] T011 [P] Add FillFormResponse, SourceDocument models to `backend/src/api/schemas.py`
- [ ] T012 [P] Add HealthResponse model to `backend/src/api/schemas.py`
- [ ] T013 [P] Add ErrorResponse model to `backend/src/api/schemas.py`
- [ ] T014 Create `backend/src/prompts/system.py` with RAG_SYSTEM_PROMPT for zero-hallucination

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 3 - Connect to Vector Database (Priority: P1) 🎯

**Goal**: Establish a reliable connection to the vector database so that resume embeddings can be retrieved for answer generation.

**Independent Test**: Start the backend and verify it can ping the vector database health endpoint and retrieve sample embeddings.

**Why First**: The RAG pipeline (US1) cannot function without vector database connectivity.

### Implementation for User Story 3

- [ ] T015 [US3] Create `backend/src/services/vector_store.py` with VectorStoreConnection dataclass
- [ ] T016 [US3] Implement QdrantClient initialization with retry logic using tenacity in `backend/src/services/vector_store.py`
- [ ] T017 [US3] Implement connection health check method in `backend/src/services/vector_store.py`
- [ ] T018 [US3] Implement get_retriever() method with k=5 search_kwargs per Constitution II in `backend/src/services/vector_store.py`
- [ ] T019 [US3] Add get_vector_count() utility method for health monitoring in `backend/src/services/vector_store.py`

**Checkpoint**: At this point, User Story 3 should be fully functional - backend can connect to Qdrant with retry logic

---

## Phase 4: User Story 2 - Cross-Origin Access for Extension (Priority: P1)

**Goal**: Enable the browser extension to communicate with the backend API without CORS errors.

**Independent Test**: From a Firefox extension context, make a fetch request to the API health endpoint and receive a successful response.

### Implementation for User Story 2

- [ ] T020 [US2] Create `backend/src/main.py` with FastAPI app instance
- [ ] T021 [US2] Add CORSMiddleware with `moz-extension://` regex pattern in `backend/src/main.py`
- [ ] T022 [US2] Configure CORS to allow localhost origins in `backend/src/main.py`
- [ ] T023 [US2] Set CORS allow_credentials=True and appropriate headers in `backend/src/main.py`

**Checkpoint**: At this point, User Story 2 should be fully functional - extension can make CORS requests

---

## Phase 5: User Story 1 - Generate Contextual Answers (Priority: P1)

**Goal**: Generate accurate answers based on resume data so that form fields can be filled with relevant, truthful information.

**Independent Test**: Send a POST request with a form label (e.g., "Years of Python experience") to `/fill-form` and receive an answer derived from the resume vector store.

### Implementation for User Story 1

- [ ] T024 [US1] Create `backend/src/services/rag.py` with RAGPipeline dataclass
- [ ] T025 [US1] Implement ChatOpenAI client with custom base_url for Z.ai API in `backend/src/services/rag.py`
- [ ] T026 [US1] Implement create_rag_chain() method with RetrievalQA pattern in `backend/src/services/rag.py`
- [ ] T027 [US1] Implement generate_answer() async method with context retrieval and LLM generation in `backend/src/services/rag.py`
- [ ] T028 [US1] Add exponential backoff retry logic for LLM calls in `backend/src/services/rag.py`
- [ ] T029 [US1] Create `backend/src/api/routes.py` with APIRouter instance
- [ ] T030 [US1] Implement POST `/fill-form` endpoint with FillFormRequest/Response in `backend/src/api/routes.py`
- [ ] T031 [US1] Implement GET `/health` endpoint with HealthResponse in `backend/src/api/routes.py`
- [ ] T032 [US1] Add error handling for validation, service unavailable, and timeout in `backend/src/api/routes.py`
- [ ] T033 [US1] Register API router and include routes in `backend/src/main.py`
- [ ] T034 [US1] Add request logging middleware in `backend/src/main.py`
- [ ] T035 [US1] Configure Uvicorn server startup in `backend/src/main.py`

**Checkpoint**: At this point, User Story 1 should be fully functional - full RAG pipeline operational

---

## Phase 6: Polish & Integration

**Purpose**: Final integration, validation, and documentation updates

- [ ] T036 [P] Update `backend/requirements.txt` with development dependencies (pytest, pytest-asyncio, httpx)
- [ ] T037 Verify all endpoints work with `docker-compose up api-backend`
- [ ] T038 [P] Update quickstart.md with validated API usage examples
- [ ] T039 Run end-to-end test: POST to `/fill-form` and verify response structure
- [ ] T040 Verify CORS headers are returned for moz-extension:// origins

- [ ] T041 Run load test with 10 concurrent requests to `/fill-form` and verify P95 latency < 5 seconds (per SC-001)
---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US3 (Vector DB) should complete first - US1 depends on it
  - US2 (CORS) is independent - can run in parallel with US3
  - US1 (RAG) depends on US3 completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies (parallel with US3)
- **User Story 1 (P1)**: Depends on US3 (VectorStoreConnection) being complete

### Within Each User Story

- Service layer before API layer
- Core implementation before error handling
- Integration after all components ready

### Parallel Opportunities

- T003-T007 can all run in parallel (empty init files)
- T010-T013 can all run in parallel (different Pydantic models)
- US2 and US3 can run in parallel after Foundational phase
- T036 and T038 can run in parallel (different files)

---

## Parallel Example: Foundational Phase

```bash
# These tasks can be done together (different files):
Task: "Create backend/src/config.py with Settings class"
Task: "Create backend/src/api/schemas.py with FillFormRequest model"
Task: "Add FillFormResponse models to backend/src/api/schemas.py"
Task: "Create backend/src/prompts/system.py with RAG_SYSTEM_PROMPT"
```

---

## Implementation Strategy

### MVP First (User Story 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 3 (Vector DB connection)
4. **STOP and VALIDATE**: Test Qdrant connection with health check
5. Backend can connect to vector store - foundational capability ready

### Core Functionality (US3 + US1)

1. Complete Setup + Foundational → Configuration ready
2. Add User Story 3 → Vector DB connected
3. Add User Story 1 → Full RAG pipeline operational
4. Test `/fill-form` endpoint end-to-end
5. Core value delivered: form-filling answers

### Full Feature (All Stories)

1. Complete US3 + US1 → RAG pipeline ready
2. Add User Story 2 → CORS configured
3. Extension can communicate with backend
4. All P1 stories complete

### Single Developer Strategy

Recommended order for one developer:

1. T001-T008: Setup (15 min)
2. T009-T014: Foundational (30 min)
3. T015-T019: User Story 3 - Vector DB (30 min)
4. T020-T023: User Story 2 - CORS (15 min)
5. T024-T035: User Story 1 - RAG Pipeline (60 min)
6. T036-T040: Polish (20 min)

**Total estimated time**: ~170 minutes (~3 hours)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US3 (Vector DB) is foundational for US1 (RAG) - must complete first
- US2 (CORS) is independent and can parallelize with US3
- Stop at any checkpoint to validate story independently
- Constitution compliance built into tasks:
  - k=5 retrieval (Constitution II) in T018
  - 1536 dimensions via OpenAIEmbeddings (Constitution I) in T025
  - Zero-hallucination prompt (Constitution III) in T014
  - moz-extension:// CORS (Constitution IV) in T021
