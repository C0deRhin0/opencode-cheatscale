---
description: Incrementally inject new requirements into existing roadmap using wave-based orchestration. Surgical updates without data loss.
agent: orchestrator
---

# Inject: Surgical Roadmap Evolution

Add new requirements to an existing roadmap without overwriting prior work. Uses wave-based orchestration for efficient processing.

---

## Core Principles

- **Surgical Update**: Only modify affected sections; preserve completed phases
- **Orchestrator as Conductor**: Orchestrator writes files; subagents provide content
- **Wave-Based**: Parallel execution where possible, sequential where required
- **Single Source**: All files in `plans/$SCOPE/` - Obsidian sees via project root

---

## Input

**New Requirements:** $ARGUMENTS

Format: `/inject $SCOPE <requirements>`

---

## Phase 0: Scan & Route (MANDATORY FIRST)

`[Mode: Scan]`

1. **Parse Scope**: Extract `$SCOPE` from `$ARGUMENTS` (first word)
2. **Read Existing Context**:
   - `plans/$SCOPE/roadmap.md` - current roadmap
   - `plans/$SCOPE/idea_research.md` - project brief
   - `plans/$SCOPE/coding_convention.md` - conventions

3. **Classify Injection Type**:
   | Type | Criteria | Wave Pattern |
   |------|----------|--------------|
   | **Simple** | Single phase addition, no new domain | Skip waves, direct to planner |
   | **Medium** | New phase, 1-2 affected areas | Wave 2 only (architect) |
   | **Complex** | Cross-cutting concern, multiple domains | Full wave pattern |

4. **User Clarification** (via `question` tool):
   - Severity: Immediate / High / Medium / Low
   - Scope: UI only / Backend only / Full-stack / Architecture shift

5. **MANDATORY STOP**: Wait for answers before processing

---

## Wave 1: Impact Analysis (If Needed)

`[Mode: Research]`

**Trigger**: If injection requires research on new tech/patterns

**Parallel**:
- `@researcher`: Analyze new requirements impact
- `@fact-checker`: Verify claims against existing context

**Skip** if requirements are straightforward.

---

## Wave 2: Affected Domain Analysis

`[Mode: Analysis]`

**Parallel** (based on injection scope):

### Backend Impact — `@architect`
```
Analyze: New requirements $ARGUMENTS
Context: Read plans/$SCOPE/coding_convention.md
Output: Does this require tech stack update? Y/N + rationale
```

### Frontend Impact — `@frontend-engineer` (if UI-related)
```
Analyze: New requirements $ARGUMENTS
Context: Read existing UI patterns in plans/
Output: UI component impact assessment
```

**Wait for responses**

---

## Phase: Synthesis & Surgical Update

`[Mode: Update]`

**Orchestrator Tasks**:

1. **Determine Injection Point**:
   - Review current roadmap phases
   - Identify where new work fits
   - Mark affected vs unaffected phases

2. **Update `plans/$SCOPE/idea_research.md`**:
   - Append new goals/tasks without removing existing
   - Update constraints if tech stack shifted
   - Preserve historical context

3. **Update `plans/$SCOPE/coding_convention.md`**:
   - Append new conventions only if paradigm shift
   - Do NOT rewrite existing rules

4. **Update `plans/$SCOPE/roadmap.md`**:
   
   **Surgical Rules**:
   - DO NOT modify completed phases
   - DO NOT rewrite existing days
   - ADD new tasks to existing days if supplementing current phase
   - ADD new phase at bottom if completely new feature
   - Preserve `## Implementation Plan` section, append to tables if needed

   ```markdown
   <!-- Add to appropriate location -->
   
   ### Phase N+1 — [New Feature]
   
   **Day 1**
   - [ ] New task 1
   - [ ] New task 2
   
   **Deliverable:** <what this achieves>
   ```

---

## Completion Checklist

- [ ] `plans/$SCOPE/idea_research.md` — reconciled (or confirmed unchanged)
- [ ] `plans/$SCOPE/coding_convention.md` — updated (or confirmed unchanged)
- [ ] `plans/$SCOPE/roadmap.md` — surgically updated, no data loss

**Output**:
```
## Inject Complete [$SCOPE]

Injection Type: [Simple/Medium/Complex]
Phases Affected: [list]
New Tasks Added: [count]
```

---

## Usage

```bash
/inject core           # Add to core roadmap
/inject billing        # Add to billing roadmap
/inject auth           # Add to auth roadmap
```

**Example**:
```
/inject billing add VAT handling for EU customers
```