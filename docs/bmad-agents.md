# BMAD Agent Quick Reference

## Agent Map

| Agent | Skill | Role |
|---|---|---|
| **John** | `bmad-agent-pm` | Product Manager - PRD creation, requirements discovery |
| **Mary** | `bmad-agent-analyst` | Business Analyst - strategic analysis, scope refinement |
| **Winston** | `bmad-agent-architect` | System Architect - technical design, architecture decisions |
| **Sally** | `bmad-agent-ux-designer` | UX Designer - UI patterns, design specifications |
| **Amelia** | `bmad-agent-dev` | Developer - story execution, code implementation |
| **Quinn** | `bmad-agent-qa` | QA Engineer - test automation, coverage |
| **Bob** | `bmad-agent-sm` | Scrum Master - sprint planning, story preparation |
| **Barry** | `bmad-agent-quick-flow-solo-dev` | Quick Flow Dev - rapid implementation |
| **Paige** | `bmad-agent-tech-writer` | Tech Writer - documentation |

## Usage by Phase

### Planning Phase

Invoke these agents when defining what to build:

- **John** (`bmad-agent-pm`) - Create PRD, define product requirements
- **Mary** (`bmad-agent-analyst`) - Strategic analysis, refine scope
- **Winston** (`bmad-agent-architect`) - Technical architecture, solution design
- **Sally** (`bmad-agent-ux-designer`) - UX specifications, UI patterns
- **Bob** (`bmad-agent-sm`) - Sprint planning, break into stories
- **Paige** (`bmad-agent-tech-writer`) - Project documentation

### Development Phase

Invoke these agents when writing code:

- **Amelia** (`bmad-agent-dev`) - Implement stories from specs
- **Quinn** (`bmad-agent-qa`) - Generate e2e tests, verify coverage
- **Barry** (`bmad-agent-quick-flow-solo-dev`) - Rapid prototyping, quick fixes
- **Paige** (`bmad-agent-tech-writer`) - Keep docs updated (README, API docs)

## Invocation

```python
# Planning agents
skill(name="bmad-agent-pm")
skill(name="bmad-agent-analyst")
skill(name="bmad-agent-architect")
skill(name="bmad-agent-ux-designer")
skill(name="bmad-agent-sm")
skill(name="bmad-agent-tech-writer")

# Development agents
skill(name="bmad-agent-dev")
skill(name="bmad-agent-qa")
skill(name="bmad-agent-quick-flow-solo-dev")
```
