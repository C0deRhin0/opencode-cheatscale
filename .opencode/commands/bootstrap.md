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
- **Orchestrator Synthesis**: Only Orchestrator and Synthesis-writer write files; subagents provide content
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
   - This now comes from the JIRA Space Name question (Step 5)
   - Replace spaces with underscores: "Billing Service" → "billing_service"
   - The user answer becomes both the scope and the JIRA project name

5. **User Preferences** (via `question` tool):
   - (1) Content Management: How will you add content? (Static Markdown / Headless CMS / Not sure yet)
   - (2) Design/Guidelines: Have existing brand assets or mockups? ( file path input from user / No, need recommendations)
   - (3) Hosting: Where will this be deployed? (Vercel/Netlify / Existing AWS/GCP / Local machine / Need setup)
   - (4) SEO/Analytics: Need SEO optimization or analytics? (Yes / No / Not sure yet)
   - (5) Maintenance: Who updates content? (Technical (code) / Non-technical (CMS) / Don't know)
   - (6) Framework/Architecture: What framework will be used for the feature (Existing / User Input / Recommend)
   - (7) Space Name: Enter a name for this project (e.g., "My Portfolio") - this becomes $SCOPE folder name
   - (8) JIRA Project: Enter your JIRA project key OR leave empty if not using JIRA

6. **MANDATORY STOP**: Wait for user answers before Wave 1

---

## Phase 0.5: JIRA Project Validation (OPTIONAL)

`[Mode: ValidateJIRA]`

**Trigger**: Only runs if user provided a JIRA project key in Phase 0.

1. **Use user-provided key**: If user entered "BILLING_SERVICE", use that directly
2. **Scope name**: Convert space name to scope with underscores: "Billing Service" → `billing_service`
3. **Query JIRA** to verify project exists:
   ```
   GET /project/{USER_PROVIDED_KEY}
   ```
4. **If exists → Proceed** with roadmap generation
5. **If NOT exists → Show error**:
   > "JIRA project '{KEY}' not found. Please create it in JIRA first or check your key."

**If user left JIRA Project empty**:
- Skip Phase 0.5 entirely
- Set `jira_project: none` in $SCOPE.md
- Proceed directly to Wave 1

**Benefit**: User provides their own key - no conversion/validation needed.

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
- $SCOPE.md (implementation approach aligned to existing stack)

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

User Preferences (from Phase 0):
- Content Management: Static Markdown / Headless CMS / Not sure yet
- Design/Guidelines: Have brand files / Need recommendations
- Hosting: Vercel/Netlify / Existing AWS/GCP / Need setup
- SEO/Analytics: Yes / No / Not sure yet
- Maintenance: Technical / Non-technical / Don't know

Output: Solution options with pros/cons + recommended approach
Scope: plans/$SCOPE/ domain
```

### Frontend/UX Analysis — `@frontend-engineer` (if UI involved)
```
Analyze: $ARGUMENTS + user preferences
Focus: UI structure, component design, user experience

User Preferences (from Phase 0):
- Content Management: Static Markdown / Headless CMS / Not sure yet
- Design/Guidelines: Have brand files / Need recommendations
- Hosting: Vercel/Netlify / Existing AWS/GCP / Need setup
- SEO/Analytics: Yes / No / Not sure yet
- Maintenance: Technical / Non-technical / Don't know

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

User Preferences (from Phase 0):
- Content Management: Static Markdown / Headless CMS / Not sure yet
- Design/Guidelines: Have brand files / Need recommendations
- Hosting: Vercel/Netlify / Existing AWS/GCP / Need setup
- SEO/Analytics: Yes / No / Not sure yet
- Maintenance: Technical / Non-technical / Don't know

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
| `$SCOPE.md` | `tags: [scope, $SCOPE]` | **Central Hub** (replaces both scope hub + feature) |
| `idea_research.md` | `tags: [research, $SCOPE]` | Leaf → $SCOPE |
| `coding_convention.md` | `tags: [convention, $SCOPE]` | Leaf → $SCOPE |
| `INSTRUCTIONS.md` | `tags: [instructions, $SCOPE]` | Leaf → $SCOPE |
| `tasks/*.md` | `tags: [task, $SCOPE]` | Leaf → $SCOPE |

---

### Parallel File Writing (Using synthesis-writer Agents)

Instead of writing files sequentially, spawn **2 synthesis-writer agents in parallel** using the `task` tool with `subagent_type: "synthesis-writer"`.

**Step 1: Synthesize Context**
- Combine all Wave 2 outputs (architect JSON, frontend-engineer JSON)
- Combine Wave 3 outputs (critic JSON with issues)
- Include user preferences (goal, tech_stack, features, scope, jira_project)
- Include all task data from scope hub

**Step 2: Spawn 2 parallel synthesis-writers**

Invoke via `task` tool with explicit `@synthesis-writer` subagent_type:

```json
// Writer A: Scope hub files
task(
  description: "Write scope hub files",
  subagent_type: "synthesis-writer",
  prompt: `Write these files for plans/$SCOPE/:
- $SCOPE.md (central hub)
- idea_research.md (project brief)
- coding_convention.md (tech conventions)
- INSTRUCTIONS.md (project rules)

Context Packet:
{
  "scope": "$SCOPE",
  "wave2": { "architect": {...}, "frontend": {...} },
  "wave3": { "critic": {...} },
  "user_preferences": {
    "content_management": "Static Markdown / Headless CMS / Not sure yet",
    "design_guidelines": "Yes, have files / No, need recommendations",
    "hosting": "Vercel/Netlify / Existing AWS/GCP / Need setup",
    "seo_analytics": "Yes / No / Not sure yet",
    "maintenance": "Technical (code) / Non-technical (CMS) / Don't know",
    "jira_project": "none or KEY"
  }
}

Include frontmatter with tags and scope in each file.
For $SCOPE.md, you MUST use EXACTLY this template:
---
tags: [scope, $SCOPE]
scope: $SCOPE
jira_project: "{user_preferences.jira_project}"
jira_epic: ""
type: scope
---
# Scope: $SCOPE`
)

// Writer B: Task files
task(
  description: "Write task files",
  subagent_type: "synthesis-writer",
  prompt: `Write all task files for plans/$SCOPE/tasks/:

Context Packet:
{
  "scope": "$SCOPE",
  "wave2": { "architect": {...}, "frontend": {...} },
  "wave3": { "critic": {...} },
  "user_preferences": {
    "content_management": "Static Markdown / Headless CMS / Not sure yet",
    "design_guidelines": "Yes, have files / No, need recommendations",
    "hosting": "Vercel/Netlify / Existing AWS/GCP / Need setup",
    "seo_analytics": "Yes / No / Not sure yet",
    "maintenance": "Technical (code) / Non-technical (CMS) / Don't know",
    "jira_project": "none or KEY"
  },
  "tasks": ["task-1", "task-2", "task-3", ...]
}

Each task file needs EXACTLY this hardcoded template to ensure JIRA compatibility:

---
tags: [task, $SCOPE]
scope: $SCOPE
parent: "[[$SCOPE]]"
jira_key: ""
jira_url: ""
---
# Task: {Task Name}

## Overview
{Brief description}

## Command Sequence
{Steps}

## Validation Checklist
- [ ] {Subtask 1}
- [ ] {Subtask 2}

Output all files to plans/$SCOPE/tasks/*.md`
)
```

**IMPORTANT**: Both synthesis-writers receive the FULL context packet. This ensures accurate content regardless of which files each writer produces.

**Validation after parallel write**:
- [ ] All main files exist in `plans/$SCOPE/`
- [ ] All task files exist in `plans/$SCOPE/tasks/`
- [ ] All files have frontmatter with `tags:` and `scope:`
- [ ] No duplicate writes (verify file counts)

---

## Completion Checklist
```markdown
---
tags: [scope, $SCOPE]
scope: $SCOPE
jira_project: ""  # From JIRA Project question (or "none")
jira_epic: ""     # Set by /jira-push
type: scope
---

# Scope: $SCOPE

## Overview
<!-- One-sentence description -->

## Technical Approach
- **Architecture**: {description from Wave 2}
- **Dependencies**: {list of packages}
- **Key Files**:
  - `{file-path}` - {description}

## Tasks
### Task: {TASK_NAME_1}
- [[tasks/{task-name-1}.md]]
- Type: story | task | bug
- Estimate: {N} SP

### Task: {TASK_NAME_2}
- [[tasks/{task-name-2}.md]]
- Type: story | task

## Context
- [[idea_research]]
- [[coding_convention]]
- [[INSTRUCTIONS]]
```

**idea_research.md** — Project brief:
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

**coding_convention.md** — Tech conventions:
```markdown
---
tags: [convention, $SCOPE]
scope: $SCOPE
---

# Coding Conventions: $SCOPE

## Tech Stack
- **Framework**: ...
- **Language**: ...

## File Structure
```
codebase/
├── src/
...
```

## Naming Conventions
- **Components**: PascalCase
- **Pages**: kebab-case
```

**INSTRUCTIONS.md** — Project rules:
```markdown
---
tags: [instructions, $SCOPE]
scope: $SCOPE
---

# Project Instructions: $SCOPE

## Workspace Boundaries
- **Implementation Root**: `codebase/`
- **Plans Directory**: `plans/$SCOPE/`

## Core Principles
1. ...
```

**tasks/{TASK_NAME}.md** — Task file:
```markdown
---
tags: [task, $SCOPE]
scope: $SCOPE
parent: "[[$SCOPE]]"
jira_key: ""
jira_url: ""
---

# Task: {TASK_NAME}

**JIRA**: TBD

## Overview
{Brief description}

## Command Sequence

### 1. {SUBTASK_NAME}
```bash
# Exact command
```

- **Working Directory**: `{directory}`
- **Expected Output**: {description}
- **Files Changed**: `{file-path}`
- **Verify**: {validation}

## Validation Checklist
- [ ] ...
- [ ] ...

## Notes
{Implementation notes}
```

    ---

    **JIRA Push Integration**:
    After generating roadmap, run `/jira-push $SCOPE` to create:
    - Epic with feature name
    - Tasks with proper hierarchy
    - Native Subtasks under each task (from checkbox list)

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

- [ ] `plans/$SCOPE/$SCOPE.md` — Central hub (scope + feature combined)
- [ ] `plans/$SCOPE/idea_research.md` — Project brief
- [ ] `plans/$SCOPE/coding_convention.md` — Tech conventions
- [ ] `plans/$SCOPE/INSTRUCTIONS.md` — Project rules
- [ ] `plans/$SCOPE/tasks/*.md` — Task files with `parent: "[[$SCOPE]]"`

**Output**:
```
## Bootstrap Complete [$SCOPE]

Generated 5 context files in plans/$SCOPE/
Complexity: [Simple/Medium/Complex]
Waves Executed: [1/2/3]
```

---

## Obsidian Integration

**Files now include frontmatter** for Obsidian graph linking:
- Each file has `tags: [type, $SCOPE]` and `scope: $SCOPE`
- Wiki-links connect files: `[[$SCOPE]], [[idea_research]], [[coding_convention]], etc.`

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