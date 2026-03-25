# Implementation Plan: Fix LinkedIn Job Crawling in n8n Workflow

**Branch**: `1003-linkedin-crawl-fix` | **Date**: 2026-03-24 | **Spec**: specs/1003-linkedin-crawl-fix/spec.md
**Input**: Feature specification from `/specs/1003-linkedin-crawl-fix/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix the n8n workflow "2.Job Offers Research" that fails to crawl LinkedIn job URLs with `ERR_TOO_MANY_REDIRECTS`. The fix involves:
1. Disable `enable_stealth` and `magic` mode in crawl4ai config (causes redirect loops)
2. Change `wait_until` from "networkidle" to "load"
3. Add proxy rotation via PROXIES environment variable
4. Implement exponential backoff rate limiting (5-30 seconds)
5. Implement cookie refresh mechanism for long-term auth

## Technical Context

**Language/Version**: TypeScript (n8n workflow)  
**Primary Dependencies**: n8n (latest), crawl4ai (v0.8.5), PostgreSQL  
**Storage**: PostgreSQL (job_offers, job_offers_process tables)  
**Testing**: Manual via n8n workflow execution + docker logs review  
**Target Platform**: Docker (n8n + crawl4ai containers via docker-compose)  
**Project Type**: n8n workflow (modification of existing workflow)  
**Performance Goals**: 90 seconds max per URL crawl, 70%+ success rate  
**Constraints**: Must use n8n-as-code skill for workflow modifications  
**Scale/Scope**: Single workflow modification, ~10 LinkedIn URLs per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution Rule | Status | Notes |
|-----------------|--------|-------|
| Git-Flow required | ✅ PASS | Using feature branch 1003-linkedin-crawl-fix |
| Memory MCP check | ✅ PASS | Project structure exists in memory |
| Sequential thinking | ✅ PASS | Used for research analysis |
| Knowledge gathering priority | ✅ PASS | Used context7/librarian for crawl4ai docs |
| Docker execution | ✅ PASS | Workflow runs via docker-compose |
| Type Safety | N/A | Workflow is TypeScript (n8n-as-code) |
| Secrets in env vars | ✅ PASS | Using PROXIES env var approach |

**Constitution Assessment**: All relevant rules satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```
specs/1003-linkedin-crawl-fix/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── checklists/          # Validation checklists
│   └── requirements.md  # Specification quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
workflows/
└── local_5678_osio_a/
    └── personal/
        └── 2.Job Offers Research.workflow.ts  # Modified workflow file

.docker/
└── crawl4ai/
    └── supervisord.conf  # crawl4ai container config (if needed)

src/                     # Existing backend (not modified)
tests/                   # Existing tests (not modified)
```

**Structure Decision**: This is a workflow-only modification. The main changes are:
- Modified: `workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts`
- No backend code changes required
- No new tests needed (manual verification via n8n execution)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - standard workflow modification following existing patterns.

---

## Phase 0: Research

### Research Questions

| Question | Source | Answer |
|----------|--------|--------|
| Why does crawl4ai get ERR_TOO_MANY_REDIRECTS on LinkedIn? | Root cause analysis | LinkedIn's anti-bot detects automated access and redirects to auth/challenge pages |
| What crawl4ai config fixes the redirect issue? | Librarian + Oracle | Disable `enable_stealth` and `magic` mode; change `wait_until` to "load" |
| How to configure proxy rotation in crawl4ai? | Crawl4AI docs | Use PROXIES env var with RoundRobinProxyStrategy |
| What's the best auth approach for LinkedIn crawling? | Oracle | Cookie refresh mechanism (simpler than browser profiles) |

### Research Findings (consolidated from earlier agent runs)

**Decision**: Disable stealth/magic, use proxy rotation
**Rationale**: LinkedIn job pages redirect incorrectly with aggressive anti-bot settings. Stealth mode triggers redirect loops.
**Alternatives considered**: 
- Browser profiles (more complex setup)
- Apify LinkedIn API (external service, higher cost)
- Skipping LinkedIn entirely (loses job data)

### Unknowns Resolved

All major unknowns resolved through research:
- ✅ Proxy configuration approach (PROXIES env var)
- ✅ Authentication approach (cookie refresh)
- ✅ Performance target (90 seconds)
- ✅ Rate limiting (exponential backoff 5-30s)

---

## Phase 1: Design

### Data Model

The workflow modifies existing data structures. No new entities required.

**Existing Entities (from spec)**:

| Entity | Fields | Source |
|--------|--------|--------|
| JobOffer | id, url, title, description, research_status | PostgreSQL job_offers table |
| Crawl4aiConfig | proxy_urls, browser_config, crawler_config | Workflow JSON config |

**No changes to data model** - all modifications are in workflow configuration.

### Quickstart (for implementation)

**Prerequisites**:
- n8n instance running at http://localhost:5678
- crawl4ai container running at http://crawl4ai:11235
- Valid LinkedIn li_at cookie (to be provided via environment variable)

**Steps to Implement**:

1. **Pull latest workflow from n8n**:
   ```bash
   npx n8nac pull Sdr3tGnYNBHZG0Sj
   ```

2. **Edit the workflow** - modify `SubmitCrawlJob` node:
   - Change `browser_config.enable_stealth` to `false`
   - Change `browser_config.magic` to `false` 
   - Change `crawler_config.wait_until` to `"load"`
   - Add `crawler_config.delay_before_return_html` = 2.0
   - Add proxy configuration to crawler_config

3. **Validate**:
   ```bash
   npx n8nac skills validate workflows/local_5678_osio_a/personal/2.Job Offers Research.workflow.ts
   ```

4. **Push with verification**:
   ```bash
   npx n8nac push "2.Job Offers Research.workflow.ts" --verify
   ```

5. **Test** - Execute workflow and verify:
   - Check docker logs: `docker logs jobs_crawl4ai`
   - Verify no ERR_TOO_MANY_REDIRECTS errors
   - Query job_offers table for extracted descriptions

**Verification Commands**:
```bash
# Check crawl4ai logs for errors
docker logs jobs_crawl4ai 2>&1 | grep -i "error\|redirect"

# Query for extracted descriptions
docker exec jobs_postgres psql -U postgres -d n8n -c "SELECT id, title, description IS NOT NULL as has_desc FROM job_offers LIMIT 5;"
```

---

## Phase 2: Constitution Check (Post-Design)

Re-evaluated after design completion:

| Constitution Rule | Status | Notes |
|-----------------|--------|-------|
| Git-Flow required | ✅ PASS | Feature branch created |
| n8n-as-code skill | ✅ PASS | Using npx n8nac for workflow updates |
| Secrets in env vars | ✅ PASS | Cookies via env vars, not hardcoded |
| Docker execution | ✅ PASS | Testing via docker logs |

**Post-Design Assessment**: ✅ All gates pass. Ready for implementation.
