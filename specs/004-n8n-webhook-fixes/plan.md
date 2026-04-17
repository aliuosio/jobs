# Implementation Plan: n8n Webhook Fixes - Job Application Writer

**Branch**: `004-n8n-webhook-fixes` | **Date**: 2026-04-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-n8n-webhook-fixes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix three issues in the n8n "Job Application Writer" workflow: (1) filter by job_offers_id parameter, (2) wait for full processing before responding, (3) remove unused Respond to Webhook node. This is a configuration-only change to an existing n8n workflow JSON file - no code implementation required.

## Technical Context

| Attribute | Value |
|-----------|-------|
| **Language/Version** | n8n workflow (JSON), no code |
| **Primary Dependencies** | n8n, PostgreSQL, Mistral AI, IMAP |
| **Storage** | PostgreSQL (job_offers, job_applications tables) |
| **Testing** | n8n workflow execution testing (TDD EXCLUDED per Constitution) |
| **Target Platform** | n8n instance (Linux server) |
| **Project Type** | n8n workflow (configuration-based) |
| **Performance Goals** | Not specified (internal workflow) |
| **Constraints** | None |
| **Scale/Scope** | Single workflow, 3 user stories |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **IV. TDD** | ✅ PASS | n8n workflow JSON excluded from TDD per Constitution |
| **V. n8n Workflow Management** | ✅ PASS | Will use n8nac validate/push workflow |
| **I. SOLID/DRY** | ✅ PASS | Configuration-only, no code |
| **II. Design Patterns** | ✅ N/A | No patterns needed for workflow config |
| **III. Git Flow** | ✅ PASS | Feature branch created |

## Project Structure

### Documentation (this feature)

```text
specs/004-n8n-webhook-fixes/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (N/A - no research needed)
├── data-model.md        # Phase 1 output (N/A - no new data model)
├── quickstart.md        # Phase 1 output (inline in plan.md)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
n8n-workflows/
└── 3.Job Application Writer.json   # Workflow to fix

# No code files - configuration-only change
```

**Structure Decision**: Single n8n workflow JSON file modification. No new source code, tests, or library components required.

## Phase 0: Research

*Not applicable for this feature.*

**Reason**: The three issues are well-documented in the spec:
1. SQL query missing WHERE clause for job_offers_id - straightforward fix
2. Webhook responseMode not set - single configuration property change  
3. Unused node - remove or reconnect

No external research, patterns, or integrations need investigation.

## Phase 1: Design

### Data Model

No new entities or data model changes required. Existing entities (WebhookRequest, JobOffer, JobApplication) remain unchanged.

### Interface Contracts

No new external interfaces. The webhook endpoint `/webhook/writer` already exists.

### Quickstart

**Workflow fix steps**:
1. Pull latest workflow from n8n: `n8nac pull 3.Job Application Writer`
2. Edit workflow JSON:
   - Set webhook node `responseMode: "lastNode"`
   - Update SQL query to filter by `$input.params.job_offers_id`
   - Remove or reconnect the "Respond to Webhook" node
3. Validate: `n8nac skills validate n8n-workflows/3.Job Application Writer.json`
4. Push: `n8nac push 3.Job Application Writer`
5. Test via webhook with specific job_offers_id

## Post-Design Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| **IV. TDD** | ✅ PASS | n8n workflow JSON excluded from TDD per Constitution |
| **V. n8n Workflow Management** | ✅ PASS | Using n8nac for validate/push |
| **I. SOLID/DRY** | ✅ PASS | No code - configuration only |
| **II. Design Patterns** | ✅ N/A | Not applicable |
| **III. Git Flow** | ✅ PASS | Branch `004-n8n-webhook-fixes` active |

All gates pass. Feature ready for task generation.
