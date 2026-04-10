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
| **Bridge** | `bmad-github-bridge` | Push stories to GitHub Issues |

## Usage by Phase

### Planning Phase

- **John** (`bmad-agent-pm`) - Create PRD
- **Mary** (`bmad-agent-analyst`) - Refine scope
- **Winston** (`bmad-agent-architect`) - Technical design
- **Sally** (`bmad-agent-ux-designer`) - UX specifications
- **Bob** (`bmad-agent-sm`) - Sprint planning, create stories
- **Bridge** (`bmad-github-bridge`) - Push stories to GitHub
- **Paige** (`bmad-agent-tech-writer`) - Project documentation

### Development Phase

- **Amelia** (`bmad-agent-dev`) - Implement stories
- **Quinn** (`bmad-agent-qa`) - Generate + run tests
- **Barry** (`bmad-agent-quick-flow-solo-dev`) - Rapid fixes
- **Paige** (`bmad-agent-tech-writer`) - Update docs

## GitHub Bridge

### Model

```
story.md ──────push──────► GitHub Issue (content)
   │
   │◄───────sync─────────── GitHub Issue (status only)
   │
   └── Bob reads GitHub status → updates story.md
```

**Push:** story.md content → GitHub (one-time)
**Sync:** GitHub status → story.md (ongoing)

### CLI

```bash
# List all stories
python scripts/sync_stories.py --list

# Push story content to GitHub
python scripts/sync_stories.py --push 001

# Get status sync info
python scripts/sync_stories.py --status 001

# Show all stories with status
python scripts/sync_stories.py --sync-all
```

### In opencode

**Push:**
```python
skill(name="bmad-github-bridge")
github_create_issue(owner="aliuosio", repo="jobs", title=..., body=..., labels=["story"])
```

**Sync:**
```python
skill(name="bmad-github-bridge")
github_get_issue(owner="aliuosio", repo="jobs", issue_number=42)
```

### Story Fields

```markdown
github_issue: "#42"
github_status: "open"
github_labels: "blocked"
```

## Invocation

```python
# Planning
skill(name="bmad-agent-pm")
skill(name="bmad-agent-sm")
skill(name="bmad-github-bridge")  # Push to GitHub

# Development
skill(name="bmad-agent-dev")
skill(name="bmad-agent-qa")
```

## Story File Locations

- `**/*.story.md`
- `**/stories/**/*.md`
- `**/specs/**/story.md`

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Bob creates story.md                                         │
│ Developers read story.md locally                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ push content
┌─────────────────────────────────────────────────────────────┐
│ GitHub Issue created                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ sync status
┌─────────────────────────────────────────────────────────────┐
│ Bob reads GitHub → updates story status only                 │
│ Developers work locally (story.md is source of truth)        │
└─────────────────────────────────────────────────────────────┘
```
