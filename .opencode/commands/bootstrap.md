---
description: End-to-end project bootstrap using enterprise wave-based orchestration. Generates complete project context with parallel agent execution.
agent: orchestrator
---

# Bootstrap: Enterprise Project Planning

Generate project context using wave-based orchestration. All artifacts written to `plans/$SCOPE/` - Obsidian vault configured to project root to see all roadmaps.

---

## Core Principles

- **Wave-Based Dispatch**: Execute agents in parallel waves, sequential between waves
- **Single Source of Truth**: All files written to `plans/$SCOPE/` only
- **No Code Sovereignty Violation**: Subagents NEVER write to `codebase/` during bootstrap
- **Orchestrator Synthesis**: Only Orchestrator writes files; subagents provide content
- **Phase 0 Scan**: Always scan project structure before routing

---

## Input

**Project Vision:** $ARGUMENTS

---

## Phase 0: Scan & Route (MANDATORY FIRST)

`[Mode: Scan]`

1. **Project Scan**:
   - Run: `ls -laF` to confirm project root
   - Check: `plans/` directory exists
   - Identify: Project structure (codebase/, src/, etc.)

2. **Complexity Classification**:
   - Analyze `$ARGUMENTS`
   - Classify: **Simple** | **Medium** | **Complex**

   | Complexity | Criteria | Agents |
   |------------|----------|--------|
   | Simple | Single domain, clear requirements | architect, planner |
   | Medium | 2-3 domains, partial clarity | architect, frontend-engineer |
   | Complex | 3+ domains, ambiguous requirements | + researcher, + critic |

3. **Scope Name Extraction**:
   - Extract first word from `$ARGUMENTS` as scope (e.g., `billing`, `auth`)
   - Default to `core` if main project

4. **User Preferences** (via `question` tool):
   - Primary Goal: MVP Speed OR Enterprise Scalability
   - Tech Stack: Strict requirements OR AI recommendation
   - Feature Priority: Core only OR Full specification

5. **MANDATORY STOP**: Wait for user answers before Wave 1

---

## Wave 1: Knowledge (If Unknowns Exist)

`[Mode: Research]`

**Trigger**: If task has technical unknowns requiring investigation

**Parallel Execution** (agents called simultaneously via `task` tool):
- `@researcher`: Analyze tech stack, architecture options, provide recommendation
- `@fact-checker`: Verify claims, check version numbers, validate assumptions

**Output**: Synthesized research findings for architect

**Skip Wave 1** if requirements are clear and tech stack is known.

---

## Wave 2: Domain Analysis (Parallel)

`[Mode: Analysis]`

**Parallel Execution** (agents called simultaneously via `task` tool):

### Backend Analysis — `@architect`
```
Analyze: $ARGUMENTS + user preferences
Focus: Technical feasibility, architecture, data flow, performance, security
Output: Solution options with pros/cons + recommended approach
Scope: plans/$SCOPE/ domain
```

### Frontend/UX Analysis — `@frontend-engineer` (if UI involved)
```
Analyze: $ARGUMENTS + user preferences
Focus: UI structure, component design, user experience
Output: Visual approach options with pros/cons + recommended approach
Scope: plans/$SCOPE/ domain
```

**Wait for ALL responses before proceeding to Wave 3**

---

## Wave 3: Quality Review (Parallel)

`[Mode: Quality]`

**Parallel Execution**:

### Adversarial Review — `@critic`
```
Review: Phase 1-2 outputs (research + analysis)
Focus: Feasibility risks, edge cases, hidden assumptions, timeline viability
Output: Critical issues list with severity ratings
```

**Wait for response before Synthesis**

---

## Phase: Synthesis & Roadmap Generation

`[Mode: Synthesis]`

**Orchestrator Tasks**:

1. **Read all Wave outputs** from task results

2. **Write `plans/$SCOPE/idea_research.md`**:
   ```markdown
   ## Project Brief: $SCOPE
   
   ### Goal
   <One sentence project objective>
   
   ### Task
   <Concrete deliverables>
   
   ### Constraints
   - Tech stack: <stack>
   - Timeline: <phase targets>
   - Non-goals: <out of scope>
   ```

3. **Write `plans/$SCOPE/coding_convention.md`**:
   - Tech-stack specific best practices
   - Naming conventions, file structure
   - Testing requirements (80%+)

4. **Write `plans/$SCOPE/INSTRUCTIONS.md`**:
   - Workspace boundaries
   - Key project conventions
   - 3-Tier Architecture emphasis

5. **Write `plans/$SCOPE/roadmap.md`** with:

   **Section A — Write Scopes**:
   ```markdown
   ### Write Scopes
   | Agent | Authorized Directory Scopes | Conceptual Domain |
   |-------|-----------------------------|-------------------|
   | orchestrator | `plans/`, `docs/` | Secretary / Border Guard |
   | architect | <Defined based on project> | Logic / Engine |
   | frontend-engineer | <Defined based on project> | UI / Presentation |
   ```

   **Section B — Roadmap**:
   ```markdown
   ## Roadmap
   
   ### Phase N — [Name] (~N days, M tasks)
   
   **Day 1**
   - [ ] Task 1 (Atomic, 15 min or less)
   - [ ] Task 2
   
   **Day 2**
   - [ ] Task 1
   
   **Deliverable:** What works at phase end
   ```

   **Section C — Implementation Plan**:
   ```markdown
   ## Implementation Plan
   
   ### Selected Approach
   <Synthesized from Wave 2>
   
   ### Key Files
   | File | Layer | Description |
   |------|-------|-------------|
   ```

---

## Completion Checklist

- [ ] `plans/$SCOPE/idea_research.md` — Project brief
- [ ] `plans/$SCOPE/coding_convention.md` — Tech conventions
- [ ] `plans/$SCOPE/INSTRUCTIONS.md` — Project rules
- [ ] `plans/$SCOPE/roadmap.md` — Full roadmap + implementation plan

**Output**:
```
## Bootstrap Complete [$SCOPE]

Generated 4 context files in plans/$SCOPE/
Complexity: [Simple/Medium/Complex]
Waves Executed: [1/2/3]
```

---

## Obsidian Integration

Configure Obsidian vault to project root (`./`). Obsidian automatically indexes all `plans/` subdirectories, showing all feature roadmaps.

No dual-write needed - single source of truth in `plans/`.

---

**Next Steps**:
- Execute: `/routine $SCOPE P1D1` to begin implementation
- Inject: `/inject $SCOPE <new-feature>` to add to roadmap