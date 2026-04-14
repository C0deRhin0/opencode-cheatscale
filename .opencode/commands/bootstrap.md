---
description: End-to-end project bootstrap — Generate complete project context (roadmap, instructions, conventions, research)
agent: orchestrator
---

# Bootstrap: Project Planning & Roadmapping

Generate complete project context files with full-stack analysis. No code execution — this produces the planning artifacts only.

**CRITICAL**: You are the **Secretary/Synthesis Anchor**. While you are authorized to use the `write` tool to save final `.md` files, you are **STRICTLY FORBIDDEN** from generating the domain content (research, architecture, roadmap tasks) yourself. You MUST delegate to subagents for "Payload" generation.

---

## Core Protocols

- **Multi-Roadmap Support**: All artifacts are written to `plans/$SCOPE/`.
- **OpenCode Native**: Uses built-in agent subtasks — no external binaries required
- **Code Sovereignty**: Only the orchestrating supervisor (Orchestrator) writes files to disk; analysis agents are read-only workers.
- **Content Sovereignty**: The Orchestrator MUST NOT hallucinate specialist logic. Every file written MUST be based on a previous `task` tool output from a registered subagent.
- **Stop-Loss**: Do not proceed to the next phase until the current phase output is validated.
- **Phase Isolation**: You MUST terminate your response and wait for user confirmation ('PROCEED') after every Phase marked 'MANDATORY STOP'. Never zero-shot multiple phases in one turn.
- **Domain Authority**: `architect` is the backend authority; `planner` (frontend lens) is the UI/UX authority

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated files. All output must be plain professional text. This applies to every section, header, bullet point, and deliverable across all files.

## PROJECT NAMING RULE
The "Project Name" is defined as the **name of the parent folder** where the `.opencode/` folder resides. Use `pwd` or directory inspection to extract this, and use it in all documentation.

---

## Input

**Project Vision:** $ARGUMENTS

---

## Phase 0: Scoping (MANDATORY STOP)

 `[Mode: Scoping]`

1. Identify the **Scope Name**:
   - Extract the first word from `$ARGUMENTS` if it looks like a feature name (e.g., `billing`, `auth`).
   - If unsure, use the `question` tool to ask: "What is the scope name for this project/feature?"
     - Options: ["core (main project)", "billing", "auth", "marketing-site", "other (type your own)"]
   - Default to `core` if the user confirms it's the main project.

2. Use the `question` tool to gather user preferences. Present these questions in a single call:
   - **Primary Goal**: "What is the primary goal for this project?"
     - Options: ["MVP Speed (fastest path to working prototype)", "Enterprise Scalability (built for growth)"]
   - **Tech Stack**: "Do you have strict tech stack requirements?"
     - Options: ["Strict requirements (I know what I want)", "AI recommendation allowed (surprise me)"]
   - **Feature Priority**: "How detailed should the specification be?"
     - Options: ["Core only (minimal viable)", "Full specification (comprehensive)"]

3. **MANDATORY STOP**: You MUST invoke the `question` tool NOW and WAIT for user selection before proceeding to Phase 1. DO NOT BEGIN PHASE 1 until you have the user's answers.

---

## Phase 1: Synthesize & Research

`[Mode: Research]`

**Domain Authority**: Content MUST be retrieved from `@researcher` output. You are forbidden from drafting the project brief yourself.

**Instruction**: Use the `task` tool to invoke `@researcher`. Pass this prompt:
"1. Analyze `$ARGUMENTS` + user selections from Phase 0
2. Synthesize: tech stack, architecture, core features
3. Provide the content for `plans/$SCOPE/idea_research.md`:
   ```markdown
   ## Project Brief: $SCOPE

   ### Goal
   <One sentence: what this project achieves>

   ### Task
   <Concrete deliverables>

   ### Constraints
   - Tech stack: <stack>
   - Timeline: <phase targets>
   - Non-goals: <out of scope>
   ```
4. If mission is straightforward, provide `# IDEA RESEARCH: SKIPPED.` instead"

**Synthesis Anchor**: Receive the content from `@researcher` and use your `write` tool to save `plans/$SCOPE/idea_research.md`. Then proceed to Phase 2.

---

## Phase 2: Architectural Guardrails

`[Mode: Architecture]`

**Domain Authority**: Content MUST be retrieved from `@architect` output. You are forbidden from drafting the conventions or instructions yourself.

**Instruction**: Use the `task` tool to invoke `@architect`. Pass this prompt:
"1. Read `plans/$SCOPE/idea_research.md`
2. Based *only* on the defined Tech Stack, extract the structural rules
3. Write `plans/$SCOPE/coding_convention.md`:
    - Tech-stack specific best practices
    - Naming conventions, file structure patterns
    - Testing requirements (80%+ coverage)
4. Provide the content for `plans/$SCOPE/INSTRUCTIONS.md`:
    - Workspace boundaries: ``, `plans/$SCOPE/`, `codebase/`
    - Key project conventions
    - 3-Tier Architecture emphasis"

**Synthesis Anchor**: Receive the content from `@architect` and use your `write` tool to save `plans/$SCOPE/coding_convention.md` and `plans/$SCOPE/INSTRUCTIONS.md`. Then proceed to Phase 3.

---

## Phase 3: Context Retrieval

`[Mode: Retrieval]`

1. Run `ls -laF` to confirm project root
2. Read `plans/$SCOPE/roadmap.md` (if exists), `plans/$SCOPE/INSTRUCTIONS.md`, `plans/$SCOPE/coding_convention.md`
3. Use `grep` and `find` to locate relevant source files:
   - Backend: API routes, controllers, services, database schema, migration files, type definitions
   - Frontend: Components, layouts, pages, design system tokens, state management patterns
4. **Requirement Completeness Score** (0-10):
   - Goal clarity (0-3), Expected outcome (0-3), Scope boundaries (0-2), Constraints (0-2)
   - Score >= 7: Continue | Score < 7: Stop, ask clarifying questions

---

## Phase 4: Dual-Perspective Analysis

`[Mode: Analysis]`

**Domain Authority**: Analysis MUST be performed by specialists. You are forbidden from generating backend/frontend analysis yourself.

**Instruction**: Use the `task` tool to spawn the following sub-supervisors concurrently. **Follow the Parallel Dispatch Protocol** in `RULES.md` — call the `task` tool multiple times before waiting.

**Backend / Architecture Analysis** — `@architect`
Use the `task` tool. Pass this prompt:
"Analyze: $ARGUMENTS
Context: [paste relevant backend file excerpts and idea_research.md]
Focus: Technical feasibility, API design, database impact, data flow, performance risks, security considerations, edge cases
Output: At least 2 backend solution options with pros/cons and recommended approach"
Target: `codebase/`.

**Frontend / UX Analysis** — `@planner`
Use the `task` tool. Pass this prompt:
"Analyze: $ARGUMENTS
Context: [paste relevant UI/component file excerpts]
Focus: Component structure, UI flow, state management, accessibility, responsiveness, design system
Output: At least 2 frontend solution options with pros/cons and recommended approach"
Target: `codebase/`.

**Wait for BOTH responses before proceeding to Phase 5.**

---

## Phase 5: Solution Synthesis

`[Mode: Synthesis]`

1. Synthesize backend + frontend analyses into unified approach
2. Present a side-by-side comparison (2+ full-stack options) using the following structure:

```markdown
### Selected Approach
<Description of the synthesized solution>

### Component Structure
<Diagram or list of components and relationships>

### Implementation Steps
1. <Backend step> (File: path/to/service.ts)
   - Action: ...
   - Risk: Low/Medium/High
2. <Frontend step> (File: path/to/Component.tsx)
   - Action: ...
   - Risk: Low/Medium/High

### Key Files
| File | Layer | Operation | Description |
|------|-------|-----------|-------------|

### Risks and Mitigations
| Risk | Severity | Mitigation |
|------|----------|------------|

### Security Checklist
- [ ] Input validation at API boundaries
- [ ] SQL injection protection
- [ ] Authentication/authorization verified
- [ ] No hardcoded secrets
- [ ] Error messages do not leak sensitive data

### Accessibility Checklist
- [ ] Keyboard navigation works correctly
- [ ] ARIA labels on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Responsive at mobile / tablet / desktop breakpoints
```

3. Proceed directly to Phase 6 to generate the roadmap based on this synthesis.

---

## Phase 6: Roadmap Generation

`[Mode: Roadmap]`

1. Assume developer is staring at empty project directory (Phase 0)
2. Read all data from Phases 1-5. Treat user input as a REFERENCE SPECIFICATION ONLY.
3. Execute: Write `plans/$SCOPE/roadmap.md` with **three sections**:

---

**Section 1 — Write Scopes** (the "who owns what")

Include a table defining the dynamic authority boundaries for this project:
```markdown
### Write Scopes
| Agent | Authorized Directory Scopes | Conceptual Domain |
|-------|-----------------------------|-------------------|
| orchestrator | `plans/`, `docs/`, `codebase/README.md` | Secretary / Border Guard |
| architect | <Defined based on project tree, e.g. `codebase/src/core/`> | Logic / Engine |
| planner | <Defined based on project tree, e.g. `codebase/src/ui/`> | Interface / Assets |
```


---

---

**Section 2 — Roadmap** (the "when")


```markdown
## Roadmap

### Phase N — [Phase Name] (~N days, M tasks)
Brief description of what this phase accomplishes.

**Day 1**
- [ ] Task 1 (Atomic, 15 min or less)
- [ ] Task 2
- [ ] Task 3

**Day 2**
- [ ] Task 1
- [ ] Task 2

**Deliverable:** What is working and verifiable at the end of this phase.
```

Roadmap rules:
- Minimum Phase 0 through Phase 2
- Single-task Day NOT acceptable: Minimum 2 days per phase
- Tasks MUST be future tense ("Implement X", "Configure Y")
- Do NOT describe existing code as "already implemented"
- **Implementation Root**: All generated file paths MUST be prefixed with `codebase/`.
- Tasks mix backend and frontend steps in natural sequence

---

---

**Section 3 — Implementation Plan** (the "how")


Append directly to `plans/$SCOPE/roadmap.md` after the roadmap. Pull from the Phase 5 synthesis output:

```markdown
## Implementation Plan

### Selected Approach
<Synthesized solution confirmed by user in Phase 5>

### Component Structure
<Diagram or list of components and relationships>

### Implementation Steps
1. <Backend step> (File: path/to/service.ts)
   - Action: ...
   - Risk: Low/Medium/High
2. <Frontend step> (File: path/to/Component.tsx)
   - Action: ...
   - Risk: Low/Medium/High

### Key Files
| File | Layer | Operation | Description |
|------|-------|-----------|-------------|

### Risks and Mitigations
| Risk | Severity | Mitigation |
|------|----------|------------|

### Security Checklist
- [ ] Input validation at API boundaries
- [ ] SQL injection protection
- [ ] Authentication/authorization verified
- [ ] No hardcoded secrets
- [ ] Error messages do not leak sensitive data

### Accessibility Checklist
- [ ] Keyboard navigation works correctly
- [ ] ARIA labels on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Responsive at mobile / tablet / desktop breakpoints
```

---

## Completion Checklist

- [ ] `plans/$SCOPE/idea_research.md` — Project brief (goal, task, constraints)
- [ ] `plans/$SCOPE/coding_convention.md` — Tech-stack specific rules
- [ ] `plans/$SCOPE/INSTRUCTIONS.md` — Workspace boundaries + conventions
- [ ] `plans/$SCOPE/roadmap.md` — Roadmap (Phase/Day/Task timeline) + Implementation Plan (steps, files, risks, checklists)

**Output:**
```
## Bootstrap Complete [$SCOPE]

Generated 4 context files in plans/$SCOPE/
```

---

**Please review the generated files. You can:**
- **Modify**: Tell me what needs adjustment and I will update the file
- **Execute**: Run `/routine $SCOPE P1D1` to begin implementation
