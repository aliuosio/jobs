# Draft: SpeckIT Constitution — GitFlow Integration

## Purpose
- Integrate GitFlow as the standard governance model for SpeckIT work.
- Align GitHub SDD Framework guidance with a consistent, machine-enforceable workflow.
- Enable traceability of specification work (speckit.specify) within the constitution.

## Context
- The current SpeckIT constitution governs branching, reviews, and milestone workflows.
- The GitHub SDD Framework describes specification planning and execution processes to be used by agents.
- The goal is to codify a single source of truth for governance that all SpeckIT tooling (Metis, Momus, Oracle) can reference.

## Proposed Changes (GitFlow-based governance)
- Branching model:
  - Main branches: main, develop
  - Feature branches: feature/<short-name>
  - Release branches: release/*
  - Hotfix branches: hotfix/*
- PRs and reviews:
  - Mandatory code/review approvals: at least 2 peers
  - Mandatory CI checks before merge (lint, tests, spec validation)
- Merge strategy:
  - Default: squash merge for feature branches; preserve history for releases/hotfixes
- Roles and guardrails:
  - Metis: strategy alignment & gap analysis
  - Oracle: architecture validation for large scopes
  - Momus: high-accuracy review loop when activated
- Traceability:
  - All speckit.specify tasks and spec files must be linked to the corresponding feature branch and stored under .sisyphus.
- Compatibility:
  - Ensure compatibility with speckit.plan and speckit.implement workflows

## Governance & Amendment Process
- Amendments require a formal proposal in a GitHub PR with at least 2 approvals and CI checks passing
- Versioning for the constitution follows semantic versioning: MAJOR / MINOR / PATCH
- Ratification and amendment dates are recorded in the constitution history section

## Sync & Impact
- After changes, propagate updates to dependent templates (plan-template.md, spec-template.md, tasks-template.md) where applicable
- Update any references in extension workflows, tasks, and agent prompts that assume the previous governance model

## Notes
- If ratification date is unknown, insert TODO markers and track in the Sync Impact Report

---

Version: v0.x.patch
RATIFICATION_DATE: TODO
LAST_AMENDED_DATE: 2026-03-20
