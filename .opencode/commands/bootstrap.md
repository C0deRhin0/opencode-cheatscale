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

2. **Codebase Detection** (MANDATORY):
   - Run: `find codebase -type f | head -5`
   - **If files found** → set `MODE=codebase-aware`. Ask via `question` tool:
     > "Existing codebase detected in `codebase/`. Analyze it to align the roadmap with your existing stack, patterns, and conventions? (yes/no)"
   - **If empty** → set `MODE=greenfield`. Skip this question.
   - **STOP**: Wait for answer before proceeding.

3. **Complexity Classification**:
   - Analyze `$ARGUMENTS`
   - Classify: **Simple** | **Medium** | **Complex**

   | Complexity | Criteria | Agents |
   |------------|----------|--------|
   | Simple | Single domain, clear requirements | architect, planner |
   | Medium | 2-3 domains, partial clarity | architect, frontend-engineer |
   | Complex | 3+ domains, ambiguous requirements | + researcher, + critic |

4. **Scope Name Extraction**:
   - Extract first word from `$ARGUMENTS` as scope (e.g., `billing`, `auth`)
   - Default to `core` if main project

5. **User Preferences** (via `question` tool):
   - Primary Goal: MVP Speed OR Enterprise Scalability
   - Tech Stack: Strict requirements OR AI recommendation
   - Feature Priority: Core only OR Full specification

6. **MANDATORY STOP**: Wait for user answers before Wave 0.5 / Wave 1

---

## Wave 0.5: Codebase Ingestion (Only if MODE=codebase-aware)

`[Mode: Ingest]`

**Trigger**: User answered YES to codebase analysis in Phase 0 step 2.

**Parallel Execution** (via `task` tool):

### Stack & Architecture Audit — `@architect`
```
Scan: codebase/ directory (find codebase -type f | head -50)
Read: package.json, tsconfig.json, Dockerfile, *.config.*, and the likes (top-level only)
Identify:
  - Language / framework / runtime
  - Folder structure and domain boundaries
  - Existing patterns (repos, services, hooks, middlewares)
  - Tech debt or legacy patterns to preserve
Output: ExistingStack summary + ArchitectureMap + PatternsToRespect
```

### Convention Extraction — `@code-reviewer`
```
Scan: 3-5 representative files across codebase/
Identify:
  - Naming conventions (camelCase, kebab-case, etc.)
  - Error handling patterns
  - Import style (absolute vs relative)
  - Testing setup (if any)
Output: ExistingConventions list
```

**Output feeds directly into**:
- Wave 2 Domain Analysis (agents receive Existing Stack + Existing Conventions as context)
- Synthesis (coding_convention.md extended with existing conventions)
- feature.md (implementation approach aligned to existing stack)

**MANDATORY**: Do NOT suggest replacing existing stack. New features MUST integrate with what exists.

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

**FRONTMATTER REQUIREMENT**: Every file MUST include frontmatter for Obsidian graph linking.

**Template** (use for ALL files):
```yaml
---
tags: [type, scope]
scope: $SCOPE
---
```

**File Frontmatter Mapping**:
| File | Tags | Graph Role |
|------|------|------------|
| `$SCOPE.md` | `tags: [scope, $SCOPE]` | Hub node |
| `idea_research.md` | `tags: [research, $SCOPE]` | Leaf → feature |
| `coding_convention.md` | `tags: [convention, $SCOPE]` | Leaf → feature |
| `INSTRUCTIONS.md` | `tags: [instructions, $SCOPE]` | Leaf → feature |
| `feature.md` | `tags: [feature, $SCOPE]` | Bridge → $SCOPE |
| `tasks/*.md` | `tags: [task, $SCOPE]` | Leaf → feature |

---

### Write Files

0. **Write `plans/$SCOPE/$SCOPE.md`** (Scope Hub Node — FIRST FILE):
   ```markdown
   ---
   tags: [scope, $SCOPE]
   type: scope
   ---
   # Scope: $SCOPE

   ## Overview
   <!-- One-sentence description of this scope -->

   ## Features
   - [[feature]]

   ## Context
   - [[idea_research]]
   - [[coding_convention]]
   - [[INSTRUCTIONS]]
   ```
   > This file is the Obsidian graph hub. All other files in the scope connect through it.

1. **Write `plans/$SCOPE/idea_research.md`**:
   - Include frontmatter at top
   - Link to other files: `See [[coding_convention]] and [[feature]]`
   ```markdown
   ---
   tags: [research, $SCOPE]
   scope: $SCOPE
   ---
   
   ## Project Brief: $SCOPE
   
   ### Goal
   <One sentence>
   
   ### Task
   <Deliverables>
   
   ### Constraints
   - Tech stack: <stack>
   - Timeline: <phases>
   - Non-goals: <out of scope>
   ```

2. **Write `plans/$SCOPE/coding_convention.md`**:
   - Include frontmatter at top
   - Tech-stack specific best practices
   - Naming conventions, file structure patterns
   - Testing requirements (80%+ coverage)
   - Link: `Related: [[idea_research]], [[feature]]`

3. **Write `plans/$SCOPE/INSTRUCTIONS.md`**:
   - Include frontmatter at top
   - Workspace boundaries: ``, `plans/$SCOPE/`, `codebase/`
   - Key project conventions
   - 3-Tier Architecture emphasis
   - Link: `See [[feature]] for implementation`

4. **Write `plans/$SCOPE/feature.md`**:
   - Include frontmatter with scope, feature, jira_epic
   - Contains Feature overview and Tasks list
   - **MUST link to scope hub**: include `Part of: [[$SCOPE]]` in body
   - Link: `Based on [[idea_research]], [[coding_convention]], [[INSTRUCTIONS]]`

5. **Create `plans/$SCOPE/tasks/` directory**:
   - Create individual task files: `tasks/{task-name}.md`
   - Each task file contains subtasks with checkboxes

   **feature.md Structure**:
   ```markdown
   ---
   scope: {SCOPE}
   feature: {FEATURE_NAME}
   jira_epic: {EPIC_KEY}
   tags: [feature, {SCOPE}]
   ---

   # Feature: {FEATURE_NAME}

   Part of: [[{SCOPE}]]
   Based on: [[idea_research]] | [[coding_convention]] | [[INSTRUCTIONS]]

   ## Tasks

   ### Task: {TASK_NAME_1}
   - [link to tasks/login-flow.md]
   - Type: story | task | bug
   - Estimate: {N} SP

   ### Task: {TASK_NAME_2}
   - [link to tasks/password-reset.md]
   - Type: story
   ```

   **tasks/{TASK_NAME}.md Structure**:
   ```markdown
   ---
   tags: [task, $SCOPE]
   scope: $SCOPE
   parent: "[[feature]]"
   ---
   # Task: {TASK_NAME}

   ## Subtasks

   - [ ] Subtask: {SUBTASK_NAME_1}
   - [ ] Subtask: {SUBTASK_NAME_2}

   ## Notes
   <!-- Implementation notes -->
   ```

    **Note**: Maps 1:1 to JIRA (Epic > Task > Subtask)

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

- [ ] `plans/$SCOPE/$SCOPE.md` — Scope hub node (Obsidian graph root)
- [ ] `plans/$SCOPE/idea_research.md` — Project brief
- [ ] `plans/$SCOPE/coding_convention.md` — Tech conventions
- [ ] `plans/$SCOPE/INSTRUCTIONS.md` — Project rules
- [ ] `plans/$SCOPE/feature.md` — Feature overview with `Part of: [[$SCOPE]]` link
- [ ] `plans/$SCOPE/tasks/*.md` — Task files with `parent: "[[feature]]"`
- [ ] `feature.md` links to `[[$SCOPE]]` (scope hub) in body
- [ ] (If codebase-aware) `coding_convention.md` includes ExistingConventions from Wave 0.5

**Output**:
```
## Bootstrap Complete [$SCOPE]

Generated 4 context files in plans/$SCOPE/
Complexity: [Simple/Medium/Complex]
Waves Executed: [1/2/3]
```

---

## Obsidian Integration

**Files now include frontmatter** for Obsidian graph linking:
- Each file has `tags: [type, $SCOPE]` and `scope: $SCOPE`
- Wiki-links connect files: `[[feature]], [[idea_research]], etc.`

Configure Obsidian vault to project root (`./`) or `plans/`. All roadmaps visible in graph view.

No dual-write needed - single source of truth in `plans/`.

---

**Next Steps**:
- Execute: `/routine $SCOPE <task-id>` to begin implementation
  - Example: `/routine auth login-flow` (NEW)
  - Example: `/routine auth P1D1` (OLD, deprecated but works)
- Inject: `/inject $SCOPE <new-feature>` to add to roadmap

---

## Usage

```bash
/bootstrap "billing service with Stripe integration"
/bootstrap "auth module with JWT and OAuth"
/bootstrap "core API for inventory management"
```