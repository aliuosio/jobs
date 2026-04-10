# BMad Shortcuts Reference

BMad (Business-Minded Development) is a multi-agent workflow system with persona-based agents and specialized skills.

---

## 🎭 Persona Agents (Talk To)

> Invoke by asking to "talk to" the persona or requesting them by name

| Shortcut | Persona | Role | When to Use |
|----------|---------|------|-------------|
| `/bmad-agent-analyst` | **Mary** | Business Analyst | Market research, competitive analysis, requirements elicitation, domain expertise |
| `/bmad-agent-pm` | **John** | Product Manager | PRD creation, requirements discovery, user interviews, stakeholder alignment |
| `/bmad-agent-architect` | **Winston** | System Architect | Technical design decisions, distributed systems planning, architecture documentation |
| `/bmad-agent-dev` | **Amelia** | Senior Developer | Story execution, code implementation, test-driven development |
| `/bmad-agent-qa` | **Quinn** | QA Engineer | Test automation, E2E test generation, rapid coverage |
| `/bmad-agent-sm` | **Bob** | Scrum Master | Sprint planning, story preparation, agile ceremonies, retrospective |
| `/bmad-agent-quick-flow-solo-dev` | **Barry** | Elite Solo Dev | Quick flow — rapid spec and implementation (minimum ceremony) |
| `/bmad-agent-tech-writer` | **Paige** | Technical Writer | Documentation, diagrams, technical explanations |

---

## 🔧 Core Utilities

| Shortcut | Description |
|----------|-------------|
| `/bmad-help` | **Main help command** — analyzes your current state and recommends the next skill to use |
| `/bmad-init` | Initialize project configuration (usually auto-triggered by other skills) |

---

## ⭐ Main Commands (You'll Use Most)

> These are the core workflow commands for day-to-day development

| Command | Skill | Description |
|---------|-------|-------------|
| **CP** | `bmad-create-prd` | Create a Product Requirements Document |
| **SP** | `bmad-sprint-planning` | Generate sprint plan (sequence tasks for dev) |
| **CS** | `bmad-create-story` | Prepare a story with all context for implementation |
| **DS** | `bmad-dev-story` | Write tests and code for a story (Amelia) |
| **QD** | `bmad-quick-dev` | **Quick flow** — clarify, plan, implement, review, present (Barry) |
| **CA** | `bmad-create-architecture` | Document technical decisions and architecture |
| **CR** | `bmad-code-review` | Comprehensive multi-facet code review |
| **QA** | `bmad-qa-generate-e2e-tests` | Generate E2E tests for existing features |

---

## 📋 Planning & Requirements

| Command | Skill | Description |
|---------|-------|-------------|
| **VP** | `bmad-validate-prd` | Validate PRD is comprehensive and well-organized |
| **EP** | `bmad-edit-prd` | Update existing PRD |
| **CE** | `bmad-create-epics-and-stories` | Create epics and stories listing |
| **IR** | `bmad-check-implementation-readiness` | Ensure PRD, UX, Architecture, and Stories are aligned |
| **CC** | `bmad-correct-course` | Handle major changes mid-implementation |

---

## 🏗️ Design & Architecture

| Command | Skill | Description |
|---------|-------|-------------|
| **CA** | `bmad-create-architecture` | Document technical design decisions |
| UX Design | `bmad-create-ux-design` | Plan UX patterns and design specifications |

---

## 🧪 Testing & Review

| Command | Skill | Description |
|---------|-------|-------------|
| **CR** | `bmad-code-review` | Adversarial code review (Blind Hunter + Edge Case + Acceptance) |
| **QA** | `bmad-qa-generate-e2e-tests` | Generate API and E2E tests |
| **ER** | `bmad-retrospective` | Post-epic review to extract lessons |

---

## 📝 Documentation & Analysis

| Shortcut | Skill | Description |
|----------|-------|-------------|
| **DP** | `bmad-document-project` | Document brownfield project for AI/human consumption |
| **WD** | (via tech-writer) | Author document through guided conversation |
| **MG** | (via tech-writer) | Create Mermaid diagram |
| **VD** | (via tech-writer) | Validate documentation against standards |

---

## 🔍 Research & Discovery (Via Mary)

| Code | Skill | Description |
|------|-------|-------------|
| **BP** | `bmad-brainstorming` | Expert guided brainstorming |
| **MR** | `bmad-market-research` | Market and competitive analysis |
| **DR** | `bmad-domain-research` | Industry/domain deep dive |
| **TR** | `bmad-technical-research` | Technical feasibility research |
| **CB** | `bmad-product-brief` | Create/update product briefs |

---

## 🎉 Collaboration

| Shortcut | Description |
|----------|-------------|
| `/bmad-party-mode` | Orchestrates group discussion between all BMad agents |
| `/bmad-shard-doc` | Split large markdown into organized files |

---

## Quick Start Workflow

```
1. Talk to Mary (analyst)  → Research problem space
2. Talk to John (PM)      → Create PRD (CP)
3. Talk to Bob (SM)        → Create stories (CS) → Sprint plan (SP)
4. Talk to Amelia (dev)   → Implement stories (DS)
5. Talk to Quinn (QA)     → Generate tests (QA)
6. Talk to Winston (arch) → Document architecture (CA)
```

---

## Alternative: Quick Flow (Barry)

For faster implementation without full ceremony:

```
Talk to Barry → QD → Quick flow (spec + implement + review + present)
```

---

*Generated from BMad skill definitions in `.opencode/skills/bmad-*/`*