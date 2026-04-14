---
description: Incrementally inject new project requirements into a specific scoped roadmap without overwriting prior work.
agent: planner
---

# Inject: Context Evolution Pipeline

Surgically inject new requirements into an existing project.
You must use your tool capabilities to execute each step sequentially by writing the actual files to the filesystem.

**New User Context / Requirements to Inject:**
$ARGUMENTS

---

## Core Protocols

- **OpenCode Native**: Uses built-in agent subtasks — no external binaries required
- **Code Sovereignty**: Only the orchestrating planner writes files; analysis agents are read-only
- **Stop-Loss**: Do not proceed to the next phase until the current phase output is validated

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated updates. All output must be plain professional text.

## PROJECT NAMING RULE
The "Project Name" is defined as the **name of the parent folder** where the `.opencode/` and `plans/$SCOPE/` folders reside. Use `pwd` or directory inspection to extract this, and use it in all documentation.

## Phase 0: Scoping Interrogation (MANDATORY STOP)

 `[Mode: Scoping]`

1. Parse `$ARGUMENTS` to identify the **Scope** (default: `core`).
2. Read `plans/$SCOPE/roadmap.md` and `plans/$SCOPE/idea_research.md`.

Before you start the gap analysis or modify any files, you MUST clarify the constraints of these new requirements.

Use the `question` tool to present these questions in a single call:
- **Severity & Priority**: "How urgent is this requirement?"
  - Options: ["Immediate blocking hotfix", "High priority (this sprint)", "Medium priority (backlog)", "Low priority (future consideration)"]
- **Architecture Impact**: "What's the scope of this change?"
  - Options: ["Isolated UI component (frontend only)", "Service/API change (backend only)", "Full-stack feature (both)", "Core architecture shift (database/schema)"]

You MUST invoke the `question` tool NOW and WAIT for user selection before proceeding to Phase 1.

## Phase 1: Gap Analysis & Research

`[Mode: Research]`

- **Agent**: researcher

1. Read the provided `$ARGUMENTS` and incorporate user's answers from Phase 0.
2. Open `plans/$SCOPE/idea_research.md`.
   - **Condition A (Previously SKIPPED):** If the file contains `# IDEA RESEARCH: SKIPPED`, the project used to be simple but is now evolving. Delete the SKIPPED message, treat the file as a blank slate, and initialize it with the new ideas and research gathered from `$ARGUMENTS`.
   - **Condition B (Already has content):** Safely cross-reference the new concepts and append them. Do NOT destroy historical notes.
3. Execute: Write the updates to `plans/$SCOPE/idea_research.md`.

---

## Phase 2: Guardrail Updates

`[Mode: Architecture]`

- **Agent**: architect

1. Read `plans/$SCOPE/coding_convention.md` and `plans/$SCOPE/INSTRUCTIONS.md`.
2. Determine if the new requirements introduce a fundamental paradigm shift to the tech stack.
3. Execute: If a shift occurred, surgically append the new structural rules to those files. If no shift occurred, leave them untouched.

---

## Phase 3: Surgical Roadmap Injection

`[Mode: Roadmap]`

- **Agent**: planner

1. Read the current `plans/$SCOPE/roadmap.md` — both the `## Roadmap` section and the `## Implementation Plan` section.
2. Determine where this new context fits into the project timeline.
3. **SURGICAL INJECTION:** Do *not* rewrite the entire roadmap. Do *not* change completed phases. You must securely weave the new tasks into the existing structure:
   - If the feature supplements a current active Phase, append new Tasks to existing Days, or add a new Day.
   - If it is a completely new feature, append a new Phase to the bottom of the Roadmap section.
4. Keep the strict `Phase > Day > Task` hierarchy intact.
5. **Update Implementation Plan section:** If the new requirements introduce new Key Files, Risks, or affect Security/Accessibility checklists, surgically append to those tables and checklists. Do NOT overwrite existing entries.
6. Execute: Write the updated roadmap to `plans/$SCOPE/roadmap.md`.

---

## Completion Checklist

- [ ] `plans/$SCOPE/idea_research.md` — reconciled with new context
- [ ] `plans/$SCOPE/coding_convention.md` — updated for tech shifts (or confirmed unchanged)
- [ ] `plans/$SCOPE/roadmap.md` Roadmap section — surgically updated (no data loss)
- [ ] `plans/$SCOPE/roadmap.md` Implementation Plan section — updated if new files, risks, or checklists apply

Once verified, report the successful Context Injection to the user.

## Usage
```bash
/inject core "add social login support"
/inject billing "handle VAT for EU customers"
```
