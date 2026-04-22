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
   - This now comes from $Q7 (Step 5)
   - Replace spaces with underscores: "Billing Service" → "billing_service"
   - The user answer becomes both the scope and the JIRA project name

5. **User Preferences** (via `question` tool — map each answer to a variable):
   - **$Q1** — Content Management: How will you add content? (Static Markdown / Headless CMS / Not sure yet)
   - **$Q2** — Design/Guidelines: Have existing brand assets or mockups? (file path input from user / No, need recommendations)
   - **$Q3** — Hosting: Where will this be deployed? (Vercel/Netlify / Existing AWS/GCP / Local machine / Need setup)
   - **$Q4** — SEO/Analytics: Need SEO optimization or analytics? (Yes / No / Not sure yet)
   - **$Q5** — Maintenance: Who updates content? (Technical (code) / Non-technical (CMS) / Don't know)
   - **$Q6** — Framework/Architecture: What framework will be used for the feature (Existing / User Input / Recommend)
   - **$Q7** — Space Name: Enter a name for this project (e.g., "My Portfolio") → becomes `$SCOPE` folder name
   - **$Q8** — JIRA Project: Enter your JIRA project key OR leave empty if not using JIRA

   **INVARIANT**: Before calling `question` tool, verify ALL 8 questions ($Q1–$Q8) are defined. Count array length. If < 8, add missing questions before proceeding.

6. **MANDATORY STOP**: Wait for user answers before Wave 1

---

## Phase 0.5: JIRA Project Validation (OPTIONAL)

`[Mode: ValidateJIRA]`

**Trigger**: Only runs if user provided a JIRA project key in $Q8.

1. **Use user-provided key**: If user entered "BILLING_SERVICE", use that directly
2. **Scope name**: Convert space name to scope with underscores: "Billing Service" → `billing_service`
3. **Query JIRA** to verify project exists:
   ```
   GET /project/{$Q8}
   ```
4. **If exists → Proceed** with roadmap generation
5. **If NOT exists → Show error**:
   > "JIRA project '{KEY}' not found. Please create it in JIRA first or check your key."

**If $Q8 is empty**:
- Skip Phase 0.5 entirely
- Set `jira_project: none` in $SCOPE.md
- Proceed directly to Wave 1

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
Analyze: $ARGUMENTS + user preferences ($Q1–$Q6)
Focus: Technical feasibility, architecture, data flow, performance, security
User Preferences: $Q1 (content), $Q2 (design), $Q3 (hosting), $Q4 (SEO), $Q5 (maintenance), $Q6 (framework)
Output: Solution options with pros/cons + recommended approach
Scope: plans/$SCOPE/ domain
```

### Frontend/UX Analysis — `@frontend-engineer` (if UI involved)
```
Analyze: $ARGUMENTS + user preferences ($Q1–$Q6)
Focus: UI structure, component design, user experience
User Preferences: $Q1 (content), $Q2 (design), $Q3 (hosting), $Q4 (SEO), $Q5 (maintenance), $Q6 (framework)
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
User Preferences: $Q1 (content), $Q2 (design), $Q3 (hosting), $Q4 (SEO), $Q5 (maintenance), $Q6 (framework)
Output: Critical issues list with severity ratings
```

**Wait for response before Synthesis**

---

## Phase: Synthesis & Roadmap Generation

`[Mode: Synthesis]`

**File formatting**: Follow skill `synthesis-roadmap-format` for all templates, frontmatter, and validation rules.

### Parallel File Writing (Using synthesis-writer Agents)

Instead of writing files sequentially, spawn **2 synthesis-writer agents in parallel** using the `task` tool with `subagent_type: "synthesis-writer"`.

**Step 1: Synthesize Context**
- Combine all Wave 2 outputs (architect JSON, frontend-engineer JSON)
- Combine Wave 3 outputs (critic JSON with issues)
- Include user preferences ($Q1–$Q8)
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
- coding_convention.md (tech conventions)
- INSTRUCTIONS.md (project rules)

Context Packet:
{
  "scope": "$SCOPE",
  "wave2": { "architect": {...}, "frontend": {...} },
  "wave3": { "critic": {...} },
  "user_preferences": {
    "Q1_content_management": "$Q1",
    "Q2_design_guidelines": "$Q2",
    "Q3_hosting": "$Q3",
    "Q4_seo_analytics": "$Q4",
    "Q5_maintenance": "$Q5",
    "Q6_framework": "$Q6",
    "Q7_scope": "$Q7",
    "Q8_jira_project": "$Q8"
  }
}

Follow skill: synthesis-roadmap-format for all file templates, frontmatter, and validation.`
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
    "Q1_content_management": "$Q1",
    "Q2_design_guidelines": "$Q2",
    "Q3_hosting": "$Q3",
    "Q4_seo_analytics": "$Q4",
    "Q5_maintenance": "$Q5",
    "Q6_framework": "$Q6",
    "Q7_scope": "$Q7",
    "Q8_jira_project": "$Q8"
  },
  "tasks": ["task-1", "task-2", "task-3", ...]
}

Follow skill: synthesis-roadmap-format for all file templates, frontmatter, and validation.
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

- [ ] `plans/$SCOPE/$SCOPE.md` — Central hub (scope + feature combined)
- [ ] `plans/$SCOPE/coding_convention.md` — Tech conventions
- [ ] `plans/$SCOPE/INSTRUCTIONS.md` — Project rules
- [ ] `plans/$SCOPE/tasks/*.md` — Task files with `parent: "[[$SCOPE]]"`

**JIRA Push Integration**:
After generating roadmap, run `/jira-push $SCOPE` to create:
- Epic with feature name
- Tasks with proper hierarchy
- Native Subtasks under each task (from checkbox list)

**Note**: Maps 1:1 to JIRA (Epic > Task > Subtask)

**Output**:
```
## Bootstrap Complete [$SCOPE]

Generated 5 context files in plans/$SCOPE/
Complexity: [Simple/Medium/Complex]
Waves Executed: [1/2/3]
```

---

## Obsidian Integration

**Files include frontmatter** for Obsidian graph linking:
- Each file has `tags: [type, $SCOPE]` and `scope: $SCOPE`
- Wiki-links connect files: `[[$SCOPE]], [[coding_convention]], [[INSTRUCTIONS]], etc.`

Configure Obsidian vault to project root (`./`) or `plans/`. All roadmaps visible in graph view.

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