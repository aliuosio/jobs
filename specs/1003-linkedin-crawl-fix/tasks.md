# Tasks: Fix LinkedIn Job Crawling in n8n Workflow

**Feature**: Fix LinkedIn Job Crawling in n8n Workflow
**Branch**: 1003-linkedin-crawl-fix
**Generated**: 2026-03-24

## Phase 1: Setup & Prerequisites

- [x] T001 Verify n8n-as-code skill is loaded: Run `npx n8nac --help` to confirm CLI is available
- [x] T002 Verify n8n instance is accessible: Check http://localhost:5678 is reachable
- [x] T003 Verify crawl4ai container is running: Run `docker ps | grep crawl4ai`

## Phase 2: Foundational (Pre-flight Checks)

- [x] T004 Identify workflow ID in n8n: Run `npx n8nac list` to find "2.Job Offers Research" workflow ID
- [x] T005 Pull latest workflow from n8n: Run `npx n8nac pull <workflow-id>` to get current version

## Phase 3: User Story 1 - Fix Immediate Crawl Failure (P1)

**Goal**: Workflow successfully crawls LinkedIn job URLs without ERR_TOO_MANY_REDIRECTS errors

**Independent Test**: Run workflow with single LinkedIn URL, verify no redirect errors

### Implementation Tasks

- [x] T006 [P] [US1] Read current SubmitCrawlJob node configuration in workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts
- [x] T007 [US1] Modify browser_config: Change `enable_stealth` from `true` to `false`
- [x] T008 [US1] Modify browser_config: Change `magic` from `true` to `false`
- [x] T009 [US1] Modify crawler_config: Change `wait_until` from `"networkidle"` to `"load"`
- [x] T010 [US1] Modify crawler_config: Add `delay_before_return_html` = 2.0
- [x] T011 [US1] Modify crawler_config: Change `page_timeout` from 60000 to 90000 (90 seconds)

### Verification Tasks

- [x] T012 [US1] Validate workflow syntax: Workflow syntax valid (npx n8nac push succeeded)
- [x] T013 [P] [US1] Push workflow to n8n: Run `npx n8nac push "2.Job Offers Research.workflow.ts" --workflowsid Sdr3tGnYNBHZG0Sj` - PUSHED
- [ ] T014 [US1] Execute workflow manually in n8n UI with a test LinkedIn job URL
- [ ] T015 [US1] Verify crawl success: Check docker logs `docker logs jobs_crawl4ai 2>&1 | grep -i "error\|redirect"` shows no ERR_TOO_MANY_REDIRECTS

## Phase 4: User Story 2 - Implement Robust Anti-Bot Evasion (P2)

**Goal**: Multi-layered anti-bot strategy with proxy rotation for reliable long-term crawling

**Independent Test**: Run 10 different LinkedIn URLs, verify 70%+ success rate

### Implementation Tasks

- [ ] T016 [P] [US2] Add proxy configuration to crawler_config in workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts
- [ ] T017 [US2] Configure PROXIES environment variable in .env file with residential proxy pool format: `PROXIES="user:pass@proxy1:port,user:pass@proxy2:port"`
- [ ] T018 [US2] Add exponential backoff delay between retries: Modify Wait30Seconds node amount to use random between 5-30 seconds

### Verification Tasks

- [ ] T019 [US2] Validate workflow: Run `npx n8nac skills validate workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts`
- [ ] T020 [P] [US2] Push workflow: Run `npx n8nac push "2.Job Offers Research.workflow.ts" --verify`
- [ ] T021 [US2] Execute workflow with 5+ LinkedIn URLs and measure success rate
- [ ] T022 [US2] Query database for blocked URLs: `docker exec jobs_postgres psql -U postgres -d n8n -c "SELECT COUNT(*) FROM job_offers WHERE research_status='blocked';"`

## Phase 5: User Story 3 - Add Sustainable Cookie/Auth Management (P3)

**Goal**: Automated cookie refresh to avoid manual rotation

**Independent Test**: Workflow runs multiple times without manual cookie updates

### Implementation Tasks

- [ ] T023 [P] [US3] Move hardcoded li_at cookie from workflow to .env file: Add `LINKEDIN_LI_AT=<cookie_value>` to .env
- [ ] T024 [US3] Update EditFields node in workflow to read cookie from environment variable using `{{ $env.LINKEDIN_LI_AT }}`
- [ ] T025 [US3] Add cookie validation check before crawl: Add Set node to validate cookie format before SubmitCrawlJob

### Verification Tasks

- [ ] T026 [US3] Validate workflow: Run `npx n8nac skills validate workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts`
- [ ] T027 [P] [US3] Push workflow: Run `npx n8nac push "2.Job Offers Research.workflow.ts" --verify`
- [ ] T028 [US3] Run workflow twice within 24 hours and verify second run uses updated cookie
- [ ] T029 [US3] Verify cookie rotation: Check logs show successful crawls with different cookie values (if rotated)

## Phase 6: Polish & Cross-Cutting

- [ ] T030 Update docker-compose.yml if needed: Add PROXIES environment variable to crawl4ai service
- [ ] T031 Document final configuration: Update README or runbook with proxy setup instructions
- [ ] T032 Final verification: Run complete workflow end-to-end and confirm all 4 success criteria are met

## Dependency Graph

```
Phase 1 (Setup)
    │
    ├── T001 ──┐
    ├── T002 ──┤
    └── T003 ──┘
         │
         v
Phase 2 (Foundational)
    │
    ├── T004 ──┐
    └── T005 ──┘
         │
         v
Phase 3 (US1) ──────────────────────────────────────────────► MVP
    │
    ├── T006 ──┐
    ├── T007 ──┤
    ├── T008 ──┤
    ├── T009 ──┤
    ├── T010 ──┤
    └── T011 ──┘
         │
         ├── T012 ──┐
         ├── T013 ──┤
         ├── T014 ──┤
         └── T015 ──┘
                  │
                  v
Phase 4 (US2) ◄────────────────────────────────────────────── Optional
    │
    ├── T016 ──┐
    ├── T017 ──┤
    ├── T018 ──┤
    ├── T019 ──┤
    ├── T020 ──┤
    ├── T021 ──┤
    └── T022 ──┘
                  │
                  v
Phase 5 (US3) ◄────────────────────────────────────────────── Optional
    │
    ├── T023 ──┐
    ├── T024 ──┤
    ├── T025 ──┤
    ├── T026 ──┤
    ├── T027 ──┤
    ├── T028 ──┤
    └── T029 ──┘
                  │
                  v
Phase 6 (Polish)
    │
    ├── T030
    ├── T031
    └── T032
```

## Parallel Opportunities

| Tasks | Can Run In Parallel Because |
|-------|----------------------------|
| T006-T011 | Different configuration changes in same file |
| T012-T015 | T012 validates, T013 pushes, T014 executes, T015 verifies |
| T016-T018 | Different changes but same file |
| T019-T022 | T019 validates, T020 pushes, T021 executes, T022 queries |
| T023-T025 | Different changes but same file |
| T026-T029 | T026 validates, T027 pushes, T028 executes, T029 verifies |

## MVP Scope (User Story 1 Only)

The minimum viable product is **Phase 3 (User Story 1)** which delivers:
- Working LinkedIn job crawl without ERR_TOO_MANY_REDIRECTS
- 90-second timeout per URL
- Basic retry logic

This is independent and can be shipped immediately after T015 verification.

## Implementation Strategy

1. **MVP First**: Complete Phase 3 (US1) - This fixes the immediate error
2. **Incremental**: Add Phase 4 (US2) - Proxy rotation for reliability
3. **Polish**: Add Phase 5 (US3) - Cookie management automation
4. **Final**: Phase 6 - Documentation and final verification
