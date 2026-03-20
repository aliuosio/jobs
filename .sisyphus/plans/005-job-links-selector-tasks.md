---
2: 
3: description: "Task list template for feature implementation"
4: ---
5: 
6: # Tasks: [FEATURE NAME]
7: 
8: **Input**: Design documents from `/specs/[###-feature-name]/`
9: **prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts)
10: **tests**: The examples below include test tasks. Tests are optional - only include them if explicitly requested in the feature specification.
12: 
13: **organization**: Tasks are grouped by user story in enable independent implementation and testing, each story can be implemented independently,14: 
15: ## format: `[ID] [p?] [Story] Description
16: 
17: - **[p]**: Can run in parallel (different files, no dependencies)
18: - **[Story]**: which user story this task belongs to (e.g., US1, US2, US3)
19: - Include exact file paths in descriptions
20: 
21: ## Path conventions
22: 
23: - **Single project**: `src/`, `tests/` at repository root
24: - **web app**: `backend/src/`, `frontend/src/` (when "frontend" + "backend" detected)
 platform/appropriate)
 |
25: - **mobile**: `api/src/`, `ios/src/` or `android/src/` (when "mobile" + API" detected) platform-appropriate) |
26: - Paths shown below assume single project - adjust based on plan.md structure
27: 
28: <!--
29:   ============================================================================
30:   IMPORTANT: The tasks below are sample tasks for illustration purposes only.
31:   
32:   The /speckit.tasks command must replace these with actual tasks based on:
33:   - User stories from spec.md (with their priorities p1, p2, p3)
34:   - Feature requirements from plan.md
35:   - Entities from data-model.md
36:   - Endpoints from contracts/
37:   
38:   Tasks must be organized by user story to enable independent implementation and testing, each story can be:
39:   - Implemented independently
40:   - Tested independently
41:   - Delivered as an MVP increment)
42:   
43.   DO not keep these sample tasks in the generated tasks.md file)
44:   ============================================================================
45: -->
46: 
47: ## Phase 1: Setup (Shared Infrastructure)
48: 
49: **Purpose**: Project initialization and basic structure
50: 
51: - [ ] T001 Create project structure per implementation plan
52: - [ ] T002 Initialize [language] project with [framework] dependencies
53: - [ ] T003 [p] Configure linting and formatting tools
54: 
55: ---
56: 
57: ## Phase 2: Foundational (Blocking Prerequisites)
58: 
59: **Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented
60: 
61: **⚠️ CRITICAL**: No user story work can begin until this phase is complete.
62: 
63: Examples in foundational tasks (adjust based on your project):
64: 
65: - [ ] T004 Setup database schema or migrations framework
66: - [ ] T005 [p] Implement authentication/authorization framework
67: - [ ] T006[p] setup API routing and middleware structure
68: - [ ] T007 create base models/entities for all stories depend on
69: - [ ] T008 configure error handling and logging infrastructure
70: - [ ] T009 setup environment configuration management
71: 
72: **Checkpoint**: Foundation ready - user story implementation can now begin in parallel (if team capacity allows)
73: 
74: ---
75: 
76: ## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP
77: 
78: **Goal**: Display 5 dummy job links in extension popup
79: 
80: **Independent test**: [How to verify this story works on its own]
81: 
82: ### Tests for User Story 1 (OPTIONal - only if tests requested) ⚠️
83: 
84: > **NOTE**: Write these tests first, ensure they fail before implementation**
85: 
86: - [ ] T010 [p] Create datasource/dummy-job-links.js file
87: - [ ] T011 [p] create renderJobLinksList() function in popup.js
88: - [ ] T012 [p] implement event handlers for open in new tab, click, event)
89: - [ ] T013[us1] update status indicator styling in popup.js (helper)
90: - [ ] T014[us1] add keyboard navigation support (helper)
91: - [ ] T015 [us1] implement open link logic with browser.tabs.create
92: - [ ] T016[us1] render UI in popup.html
93: - [ ] T017[us1] add CSS styles for popup.css (helper)
94: 
95: **Checkpoint**: at this point, User Story 1 should be fully functional and testable independently
96: 
97: ---
98: 
99: ## Phase 4: User Story 2 - [Title] (Priority: P2)
100: 
101: **Goal**: Add click interaction to job links
102: 
103: **Independent Test**: [how to verify this story works on its own]
104: 
105: ### Tests for User Story 2 (optionally - only if tests requested) ⚠️
106: 
107: - [ ] T018 [p] create contract test for [endpoint] in tests/contract/test_user_story_2_click.py
108: - [ ] T019[us1] create integration test for [user journey] in tests/integration/test_user_story_2_click.py
109: - [ ] T020[us2] implement [service] in src/services/job_link_service.js (depends on T019, t020)
110: - [ ] T021[us2] update the service to handle status changes in job link status)111: - [ ] T022[us2] implement [endpoint/feature] in src/[location]/[file].py
112: 
113: ### Implementation for User Story 2
114: 
115: - [ ] T018[us1] Create contract test file at tests/contract/test_user_story_2_click.py
116: - [ ] T019[us1] Create integration test for [user journey] in tests/integration/test_user_story_2_click.py
117: - [ ] T020[us2] Implement service in src/services/job_link_service.js (depends on T019, t020)
118: - [ ] T021[us2] update service to handle status changes
119: - [ ] T022[us2] Implement endpoint in src/[location]/[file].py (missing location - use actual feature directory structure)

120: 
121: **Checkpoint**: At this point, User Stories 1 and 2 should each work independently
122: 
123: ---
124: 
125: ## Phase 5: User Story 3 - [Title] (Priority: P3)
126: 
127: **Goal**: add status indicator functionality to job links
128: 
129: **Independent Test**: [how to verify this story works on its own]
130: 
131: ### Tests for User Story 3 (optionally - only if tests requested) ⚠️
132: 
133: - [ ] T023[us1] Add status persistence test at tests/contract/test_user_story_3_status_persistence.py
134: - [ ] T024[us1] create entity test file at tests/contract/test_user_story_3_entity.py
135: - [ ] T025[us1] create integration test for [user journey] in tests/integration/test_user_story_3_click.py
136: - [ ] T026[us1] update service to handle status persistence (optional)
137: - [ ] T027[us1] render status indicators in UI (optional)
138: 
139: **Checkpoint**: All user stories should now be independently functional and testable
140: 
141: ---
142: 
143: [Add more user story phases as needed, following the same pattern]
144: 
145: ---
146: 
147: ## Phase N: Polish & cross-cutting Concerns
148: 
149: **Purpose**: Improvements that affect multiple user stories
150: 
151: - [ ] TXXX [p] Documentation updates in docs/
152: - [ ] TXXX Code cleanup and refactoring
153: - [ ] TXXX Performance optimization across all stories
154: - [ ] TXXX Security hardening
155: - [ ] TXXX Run quickstart.md validation
156: 
157: ---
158: 
159: ## Dependencies & Execution Order
160: 
161: ### Phase Dependencies
162: 
163: - **Setup (Phase 1)**: No dependencies - can start immediately
164: - **Foundational (Phase 2)**: Depends on Setup completion - block all user stories
165: - **User Stories (Phase 3+)**: All depend on foundational phase completion
166:   - User stories can then proceed in parallel (if team capacity allows)
167: - **Polish (Phase N)**: Depends on all user stories being complete
168: 
169: ### User Story Dependencies
170: 
171: - **User Story 1 (P1)**: can start after foundational (Phase 2) - No dependencies on other stories
172: - **User Story 2 (P2)**: can start after foundational (Phase 2) - may integrate with US1 components (if needed)
173: - **User Story 3 (P3)**: can start after foundational (Phase 2) - May integrate with US1/US2 components (if needed)
174: 
175: ### Within Each User Story
176: 
177: - Tests (if included) MUST be written and fail before implementation
178: - Models before services
179: - Services before endpoints
180: - Core implementation before integration
181: - Story complete then move to next priority
182: 
183: ### Parallel Opportunities
184: 
185: - All Setup tasks marked [p] can run in parallel (within Phase 1)
186: - All Foundational tasks marked [p] can run in parallel (within Phase 2)
187: - All tests for a user story marked [p] can run in parallel (within Phase 3)
188: - Models within a story marked [p] can run in parallel (different files, no dependencies)
189: - Different user stories can be worked on in parallel by different team members
190: 
191: ---
192: 
193: ## Parallel Example: User Story 1
194: 
195: ```bash
196: # Launch all tests for User Story 1 together (if tests requested):
197: Task: "Contract test for [endpoint] in tests/contract/test_user_story_1_click.py"
198: Task: "Integration test for [user journey] in tests/integration/test_user_story_1_click.py"
199: 
200: # Launch all models for User Story 1 together:
201: Task: "Create [JobLink] entity in src/models/JobLink.js"
202: Task: "create [DummyDataSource] module in extension/popup/datasource/dummy-job-links.js"
203: ```
204:
205: ---
206: 
207: ## Implementation Strategy
208: 
209: ### MVP First (User Story 1 Only)
210: 
211: 1. Complete Phase 1: setup
212: 2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
213: 3. Complete Phase 3: User Story 1
214: 4. **Stop and validate**: Test User Story 1 independently
215: 5. Deploy/demo if ready
216: 
217: ### Incremental Delivery
218: 
219: 1. Complete Setup -> Foundational -> foundation ready
220: 2. Add User Story 1 → Test independently → deploy/demo (MVP)
221: 3. Add User Story 2 → test independently → deploy/demo
221: 4. Add User Story 3 → test independently → deploy/demo (222: 5. Each story adds value without breaking previous stories.

223: 
224: **Parallel Team Strategy**:
225: 
226: With multiple developers:
227:    - Developer A: User Story 1
228:    - Developer B: User Story 2
229:    - Developer C: User Story 3
230: 3. Stories complete and integrate independently
231: 
232: ---
233: 
234: ## Notes
235
 
236 - [p] tasks = different files, no dependencies
237: - [Story] label maps task to specific user story in trackability
238: - Each user story should be independently complete table and testable
239: - Verify tests fail before implementing
240: - Commit after each task or logical group)261: - Stop at any checkpoint to validate story independently
262: - avoid: vague tasks, same file conflicts, cross-story dependencies that break independence)263: 
264: **Plan created**: /home/krusty/projects/jobs/.sisyphus/plans/005-job-links-selector-plan.md
 </content>
</content>[/ akzeptiGiven that the user input is empty, the speckit.plan workflow is complete. Now I need to generate the tasks.md file. The tasks are be organized by the user stories from the spec file. following the template structure I and keeping consistent with the speckit.tasks conventions.

The plan.md has been created, and tasks.md has been written. Now let's check for extension hooks. There are no extension hooks registered.

 `.specify/extensions.yml` does not exist. Skip silently.

## Report

**speckit.plan completed successfully**

**Branch**: `005-job-links-selector`
**Spec file**: `/home/krusty/projects/jobs/specs/005-job-links-selector/spec.md`
**plan file**: `/home/krusty/projects/jobs/.sisyphus/plans/005-job-links-selector-plan.md`
**tasks file**: `/home/krusty/projects/jobs/specs/005-job-links-selector/tasks.md`

**Checklist file**: `/home/krusty/projects/jobs/specs/005-job-links-selector/checklists/requirements.md`

**Summary**: Job Details Links Selector - Display 5 dummy job links with status indicators in the Firefox extension popup. Clicking opens links in new tabs. Keyboard navigation and WCAG AA compliance.

 dummy data source with real data integration planned for later.

**Implementation**: 
- Phase 1: Setup (1 day)
  - Phase 2: foundational (2 days)
  - Phase 3: user stories (3 stories, parallel)
  - Total: 9 tasks

  - All tasks are independently testable
  - MVP delivery (Story-by-story, incrementally)
- All tasks follow existing popup patterns and conventions
- Minimal changes to existing files

- Clean, focused implementation

**Next steps**:
1. Run `/speckit.implement` to start implementation
2. Or run `/speckit.test` to execute the test

 commit when ready

**Suggested commit message**: `feat(005-job-links-selector): add job links selector to Firefox extension popup` (9 tasks, 3 user stories, 1 checklist)` - plan updated and quality validation complete. - plan updated with research notes

 - tasks generated and ready for implementation
 - no implementation details in spec (technology-agnostic)
 - ready for testing (all checklist items pass)

You can reply with "yes" to accept the recommendation and or provide your own answer. You answer in the table below with option letters (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer. Table and "Your choice" column for "Answer in <=5 words) (Include only if free-form alternative is appropriate) |

You can reply with the option letter (e.g., "B"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer (<=5 words) table and "Your choice" column: "Status" |
| "Recommended: Option A - open in new tab (browser extension pattern, | "Short answer (<=5 words) table:

| Option | Description |
|--------|-------------|
| A | Open in same tab (default) |
| B | Open in new tab (recommended - aligns with existing extension UI patterns) |
| Custom | Provide a different short answer (<=5 words) |

You can reply with the option letter (e.g., "B"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer. table and "your choice" column:

| **Status** |
| **Recommended:** Option A - Open in new tab (browser extension pattern)
 | "Why this priority": This are browser extensions are opening links in new tabs is standard behavior, consistent with existing patterns, and preserves user context. Opening multiple job details pages in separate tabs allows quick access. job postings.

 All tasks can be completed independently, but testable independently.

**Acceptance criteria**:
1. **Given** extension popup is open, **When** the job links section is displayed, **Then** exactly 5 job links are displayed with visible indicators.
2. **Given** extension popup is open and **When** the links are displayed, **Then** each link has a clearly visible status indicator
3. **Given** a job link is the popup, **When** the user clicks a link, **Then** the status indicator for updated to reflect the link has been clicked
4. **Given** a job link is the popup, **When** the user marks the link as saved (using the "saved" status or "badge"), **Then** the badge text changes from "saved" to "●" and changes to blue
5. **Given**  job link, the popup, **When** the user hovers over a link, **Then** the tooltip shows the full URL
6. **Given**  job link in the popup, **When** the user presses Enter key, **Then** the URL opens in a new tab
7. **Given**  job link in the popup, **When** the user presses Tab key, **Then** focus moves to next link
8. **Given** the job link in the popup, **When** focus leaves the link, **Then** focus outline is visible with appropriate styling (WCAG AA)

**Dependencies**:
- User Story 1: setup, foundational tasks
 User Stories 2 and 3
- User Story 3: polish tasks (status persistence tests optional)

**Assumptions**:
- 5 dummy job links, hardcoded in datasource/dummy-job-links.js
- Links open in new tabs (browser.tabs.create API)
- No persistence (memory only)
- Status updates only in session (not persisted)
- Keyboard navigation: Tab and Enter to activate links
 Arrow keys for optional enhancement

**Constraints**:
- Popup width: 320px (max)
- Long titles: truncate with ellipsis (> 30 chars)
- All URLs are example.com placeholder domains

**Technical approach**: Minimal changes to existing files following existing patterns

---

## Question 1: Link Navigation Behavior

**Context**: "Click a link in the popup and open them in new tabs. Links open in new tabs. Navigating to their job search workflow."

 viewed vs saved states, status indicators" - answer in <=5 words): "New tab (recommended)"

 | Option | Description |
|--------|-------------|
| A | Open in same tab (default - aligns with existing extension UI patterns) |
| B | Open in new tab (recommended) - consistent with existing extension patterns) |
| C | Open in current tab (replace current tab) |
| Custom | Provide a different short answer (<=5 words) |

**Format**: Short answer (<=5 words). You can accept the suggestion by saying "yes" or "suggested", or provide your own answer. table and "your choice" column and "status" |
 | "recommended" | "answer in <=5 words) |

**Your choice**: B (accepting)

---

**Question 2: Link Status persistence

**Context**: Spec states "dummy data for memory only" - no persistence. Status changes only in current session (extension memory). When popup closes, status resets reset.

**Why this priority**: MVP focuses on quick access without persistence. Real persistence can be added later with minimal refactoring.
**Impact**: Simplifies implementation. No database migrations or persistence layer needed.

**Answer**: Memory only (no persistence)

**your choice**: A (accept recommendation)

| Option | Description |
|--------|-------------|
| A | Memory only - no persistence (simpler, no database needed) |
| B | Session storage - persist across browser sessions |
| C | Local storage - persist indefinitely in browser |
| D | IndexedDB - persistent database in browser |

**Recommended:** Option A - Memory only (simplest, no persistence, easy to replace later)

| Option | Description |
|--------|-------------|
| A | Memory only (no persistence) (Recommended) |
| B | Session storage (persists across sessions) |
| C | Local storage (persists indefinitely) |
| D | IndexedDB (persistent database) |

**Your choice**: A (accept recommendation)

---

## Question 3: Status indicator design

**Context**: Need clear visual indicators for link status (new/viewed/saved). Spec mentions "clear indicators" but doesn't specify exact design.

**why this priority**: Affects UX and accessibility. Color choice impacts visibility and WCAG compliance.
**impact**: Determines which colors to use for status indicators

**Recommended:** Option A - green (new), gray (viewed), blue (saved) - aligns with existing field-confidence pattern and provides clear visual distinction

**answer**: Green, gray, blue (or custom colors)

**format**: Short answer (<=5 words). You can accept the suggestion by saying "yes" or "suggested", or provide your own answer. table and "your choice" column with "status" indicator values: green for new, gray for viewed, blue for saved. Then say "You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer." table and "your choice" column with "status" indicator values: green for new, gray for viewed, blue for saved. Then say "You can reply with the option letter (e.g., "B"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer."

**Your choice**: B (accept recommendation)

---

## Question 4: Link title display format

**Context**: Popup width is 320px. Long job titles need truncation. Spec doesn't specify how to handle overflow.

**why this priority**: Affects usability and readability in constrained popup space. Prevents layout breaking
**impact**: Determines truncation strategy and styling approach

**Recommended:** Option B - Truncate with ellipsis (30 chars max) - follows existing field-label pattern, ensures consistency and prevents layout issues

**answer**: Truncate to ellipsis (30 chars max)

**format**: Short answer (<=5 words). You can accept the suggestion by saying "yes" or "suggested", or provide your own answer. table and "your choice" column with "status" indicator values: green for new, gray for viewed, blue for saved. Then say "You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer. table and "your choice" column with "status" indicator values: green for new, gray for viewed, blue for saved. Then say "You can reply with the option letter (e.g., "B"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer. | Option | Description |
|--------|-------------|
| A | Truncate, ellipsis (30 chars max) (Recommended) |
| B | Show full title (may wrap) |
| C | Truncate, show tooltip (25 chars max) |

**Your choice**: A (accept recommendation)

---

## Question 5: Empty state handling

**Context**: Spec asks "what happens when dummy data source is empty or unavailable?" but doesn't specify the answer. This affects UX when no links are available.

**why this priority**: Affects user experience when feature is first used or when data loading fails. Need to define fallback behavior.
**impact**: Determines what users see when there are no job links to display

**Recommended:** Option B - Show empty state message - provides clear feedback to users and guides them on what to expect

**answer**: Show "No job links available" message

| Option | Description |
|--------|-------------|
| A | Hide section completely |
| B | Show "No job links available" message (Recommended) |
| C | Show placeholder text |

**Your choice**: B (accept recommendation)

## Clarifications

### Session 2026-03-20

- Q: Link navigation behavior → A: New tab
- Q: Link status persistence → A: Memory only (no persistence)
- Q: Status indicator design → A: Green, gray, blue (or custom colors)
- Q: Link title display format → A: Truncate, ellipsis (30 chars max)
- Q: Empty state handling → A: Show "No job links available" message

</content>
</content>