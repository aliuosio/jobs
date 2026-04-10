---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
partyModeOutput: 'Winston: Key risks - scraping weakest link, async handling via hybrid polling, DB as source of truth, no idempotency. Recommendations: status fields, job_id returns, elapsed time display, last_generated_at, 3-min timeout'
---

# UX Design Specification jobs

**Author:** User
**Date:** 2026-04-09

---

## Executive Summary

### Project Vision

Automate cover letter creation entirely for job applications. Users select a job from the extension's job list, extract the job description from the posting, and trigger the n8n workflow to generate a tailored cover letter saved directly to the database. User perceives a single application, not three systems.

### Target Users

Job seekers who want to automate cover letter writing without manual drafting. Users frustrated with current solutions that require context switching between browser, generator, and application tracker.

### Key Design Challenges

1. **Multi-step workflow** - User must save description before generating letter (dependency chain)
2. **Async feedback** - Generation takes 30 sec to 2 min - need clear loading states with elapsed time
3. **Error recovery** - Timeout, scrape failures need clear UI with retry options
4. **Information architecture** - Where to place buttons in existing job list UI

### Design Opportunities

1. **Seamless integration** - Tight coupling of 3 systems (extension, FastAPI, n8n) into single perceived app
2. **Status visibility** - Clear per-job status (No Description → Saved → Generating → Ready)
3. **Progressive disclosure** - Show relevant actions based on current state

---

## Core User Experience

### Defining Experience

**Primary action**: Generate cover letter (triggered once job description is saved)
**Core value moment**: User clicks "Generate" → sees progress → gets ready letter
**Success criteria**: One click from user, clear progress, result appears

### Platform Strategy

- **Platform**: Firefox extension popup (~400x500px constrained space)
- **Input method**: Mouse + keyboard (not touch)
- **Network dependency**: Needs network for FastAPI + n8n calls
- **Offline behavior**: Can view cached jobs, but generate requires network

### Effortless Interactions

- Status visible at a glance (badges/icons per job row)
- Buttons show/hide based on state (no "Generate" if no description)
- Clear elapsed time display during generation
- One-click progress understanding

### Critical Success Moments

- **"Ready" moment** - User sees letter generated → delight
- **Error clarity** - If fails, user knows exactly what to do and how to retry
- **No duplicates** - Button state prevents double-generation

### Experience Principles

1. **State-first UI** - Show relevant actions based on current job state
2. **Progress visibility** - Always show what's happening, never leave user wondering
3. **Recovery-first errors** - Every error has a clear retry path
4. **Idempotent actions** - Clicking twice shouldn't create duplicates

---

## Desired Emotional Response

### Primary Emotional Goals

- **Confidence** - User feels in control, knows exactly what's happening at each step
- **Accomplishment** - One click produces a tangible result

### Emotional Journey Mapping

| Stage | Desired Emotion |
|-------|-----------------|
| First discovery | Hopeful - "finally something that automates this!" |
| Save description | Confident - "it's capturing what I need" |
| Click Generate | Excited - "here we go!" |
| Waiting (30s-2min) | Reassured - "I can see it's working (elapsed time)" |
| On success | Delighted - "got my letter!" |
| On error | Supported - "I know what went wrong and how to fix it" |

### Micro-Emotions

- **Confidence vs. Confusion** - Clear state indicators prevent confusion
- **Trust vs. Skepticism** - Reliable progress updates build trust
- **Accomplishment vs. Frustration** - Easy success path without friction

### Design Implications

| Emotion | UX Approach |
|---------|-------------|
| Confidence | Always show current state (badge + action buttons) |
| Trust | Show elapsed time, stage indicator during wait |
| Accomplishment | Celebrate "Ready" state with clear visual |
| Avoid frustration | Every error has retry button + clear message |

### Emotional Design Principles

1. **Transparency** - User always knows current state
2. **Progress assurance** - Elapsed time prevents "is it working?" anxiety
3. **Recovery focus** - Errors are not failures, just detours with clear paths

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

| App | UX Strength | Application to Feature |
|-----|-------------|------------------------|
| **GitHub Actions** | Progress indicator with elapsed time | Show "Generating... 45s" |
| **LinkedIn** | State badges on job cards | "Saved", "Ready", "Error" badges |
| **Modern web apps** | One-click to action | Single button, clear next step |
| **Material Design** | Toast notifications | Success/error feedback |

### Transferable UX Patterns

- **Progress spinner + elapsed time** - Prevents "is it working?" anxiety
- **Badge-based state** - Clear status at a glance
- **Button state management** - Disable during processing to prevent duplicates

### Anti-Patterns to Avoid

1. **Silent loading** - Never leave user wondering what's happening
2. **No error recovery path** - Every error needs retry
3. **Blocking state** - Don't lock entire UI during async operation

### Design Inspiration Strategy

- **Adopt**: Progress indicator + elapsed time
- **Adapt**: Badge-based state (simplified for popup space)
- **Avoid**: Complex multi-step wizards (keep it single-click)

---

## Design System Foundation

### Design System Choice

**Custom Design System** - Reuse existing Firefox extension styles (`popup.css`)

### Rationale for Selection

- Extension already has `popup.css` with `.btn`, `.btn-primary`, `.btn-secondary` classes
- Simple UI (job list, action buttons, status badges) - no need for Material/Ant Design
- Firefox extension constrained space (~400x500px) - keep lightweight
- No new dependencies needed

### Implementation Approach

- Reuse existing button classes
- Add status badge classes
- Add loading spinner styles
- Minimal CSS additions (~20 lines)

### Customization Strategy

- Extend existing `.btn` with state-specific variants
- Add `.badge` classes for status indicators
- Keep existing color palette, add minimal new styles

---

## 2. Core User Experience

### 2.1 Defining Experience

**"One-click cover letter generation"**
- User clicks "Generate" → sees progress → gets result
- This is what users will describe to friends: "I just click a button and it writes my cover letter"

### 2.2 User Mental Model

- **Current**: Manually write cover letter for each job (painful, time-consuming)
- **Expectation**: "Click button → get letter" (simple, magical)
- **Confusion point**: Why can't I click Generate without saving description first?

### 2.3 Success Criteria

- ✅ One click initiates entire process
- ✅ Progress visible (elapsed time shown)
- ✅ Result appears in DB (user retrieves via DB viewer)
- ✅ Feels fast even if actual generation takes 30s-2min

### 2.4 Novel UX Patterns

- **Established**: Button → progress → result pattern (GitHub Actions, download managers)
- **Our twist**: Show stage ("Scraping..." → "Generating..." → "Ready")

### 2.5 Experience Mechanics

| Stage | User Action | System Response | Feedback |
|-------|-------------|-----------------|----------|
| **Initiation** | Click "Generate" | Start async process | Button shows spinner |
| **Interaction** | Wait | Poll for status | Elapsed time counter |
| **Feedback** | See progress | Update every 3-5s | "Generating... 45s" |
| **Completion** | See "Ready" | Status badge changes | Green "Ready" badge |

---

## Visual Design Foundation

### Color System

Reuse existing extension colors + semantic status colors:

| State | Color | Usage |
|-------|-------|-------|
| Primary | `#0d6efd` | Main action buttons |
| Secondary | `#6c757d` | Secondary actions |
| **Ready** | `#28a745` | Green - letter generated |
| **Generating** | `#ffc107` | Yellow - in progress |
| **No Description** | `#6c757d` | Gray - needs description |
| **Error** | `#dc3545` | Red - failed, retry |

### Typography System

- **Font**: System fonts (existing)
- **Body**: 14px (existing)
- **Badges**: 12px, semi-bold

### Spacing & Layout Foundation

- **Base unit**: 8px (existing)
- **Padding**: 8px for badges, 12px for buttons
- **Layout**: Keep existing job list structure

### Accessibility Considerations

- Badge text must meet WCAG contrast ratios
- Button states clearly distinguishable
- Loading state accessible to screen readers

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->
