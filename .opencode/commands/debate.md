---
description: Trigger an adversarial debate between specialized agents for a unified, hardened solution
agent: orchestrator
subtask: true
---

# Adversarial Debate: $ARGUMENTS

Orchestrate a technical debate between specialized agents to reach a unified solution that balances implementation speed with architectural robustness and security.

---

## Core Protocols

- **OpenCode Native**: Uses built-in agent subtasks — no external binaries required
- **Code Sovereignty**: Only the orchestrating agent writes files; debate agents are read-only
- **Stop-Loss**: Do not advance to the next phase until the current phase output is validated

## Boot Sequence (MANDATORY)

1. Read `plans/$SCOPE/INSTRUCTIONS.md`, `plans/$SCOPE/coding_convention.md`, and `plans/$SCOPE/roadmap.md`
2. Confirm project root with `ls -laF`

---

## Phase 1: Proposition

`[Mode: Propose]`

**Instruction**: Use the `task` tool to invoke `@architect`. Pass this prompt:
"1. Propose: Technical implementation for $ARGUMENTS
2. Context: [paste relevant file excerpts and roadmap context]
3. Focus: Scalability, alignment with `plans/$SCOPE/coding_convention.md`, data flow, performance
4. Output: Detailed implementation proposal with trade-offs"

Wait for `@architect` to finish.

Present the proposal to the user. Wait for acknowledgment before proceeding.

---

## Phase 2: Critique

`[Mode: Critique]`

**Instruction**: Use the `task` tool to invoke `@critic`. Pass the architect's proposal and this prompt:
"1. Critique: The architect's proposal from Phase 1
2. Focus: Security vulnerabilities, edge cases, blind spots, over-engineering, missing error handling
3. Output: Prioritized list of concerns (CRITICAL/HIGH/MEDIUM/LOW) with alternative suggestions"

Wait for `@critic` to finish.

---

## Phase 3: Synthesis (MANDATORY STOP)

`[Mode: Synthesis]`

**Instruction**: Use the `task` tool to invoke `@architect` again. Pass the critic's critique and this prompt:
"1. Refine: The original proposal incorporating the critic's feedback
2. Focus: Address all CRITICAL and HIGH concerns. Justify any MEDIUM/LOW deferrals.
3. Output: Final hardened implementation plan"

Wait for `@architect` to finish.

Present the synthesized plan using this structure:

```markdown
## Debate Resolution: <Topic>

### Proposition Highlights
| Point | Detail |
|-------|--------|

### Critical Counters
| Concern | Severity | Resolution |
|---------|----------|------------|

### Final Plan
<The synthesized technical plan>

### Deferred Items
- [ ] <Any MEDIUM/LOW items deferred for later>
```

WAIT for user approval before saving.

---

## Phase 4: Save

`[Mode: Deliver]`

If approved, save the final plan to `plans/$SCOPE/roadmap.md` Implementation Plan section (update Key Files and Risks tables if applicable).

---

## Key Rules

1. `architect` drives the technical proposal; `critic` challenges it
2. All CRITICAL concerns must be resolved in synthesis — no exceptions
3. User must approve the final plan before it is saved
4. If architect and critic cannot converge, escalate the unresolved point to the user for a decision
