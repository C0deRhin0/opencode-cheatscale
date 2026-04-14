---
description: Execute a roadmapped Phase or Day with atomic task checkpointing — implement, audit, commit per task
agent: orchestrator
---

# Routine: $ARGUMENTS

Full execution pipeline with **atomic checkpointing** — every completed task gets its own commit before the next task begins. Inherits all execution logic from `/execute` and adds the mandatory checkpoint loop.

---

- **Workspace Scoping**: All application source code, assets, and configurations MUST be written to the `codebase/` directory. You are STRICTLY FORBIDDEN from creating implementation files in the root or `plans/` folders.
- **Git Scoping**: All `git` operations (add, commit, push, stage, etc.) MUST be executed within the `codebase/` directory.
- **Stop-Loss**: Do not proceed to the next phase until the current phase output is validated.
- **Phase Isolation**: You MUST terminate your response and wait for user confirmation ('PROCEED') after every Phase marked 'MANDATORY STOP'. Never zero-shot multiple phases in one turn.
- **Code Sovereignty**: You do NOT write implementation code directly; you delegate to Sub-Supervisors (`@architect`, `@planner`) securely via the `task` tool. Their workers perform file modifications and read-only reviews.
- **Immutability**: Always create new objects; never mutate existing state
- **Domain Authority**: `architect` is the backend authority; `planner` (frontend lens) is the UI/UX authority
- **Anti-Batching**: 1 Task = 1 Implementation = 1 Commit. Combining multiple tasks into a single commit is strictly forbidden, regardless of size.
- **No Auto-Pushing**: You must STOP and await human confirmation after delivery. You are strictly forbidden from automatically executing the `/push` command yourself.
- **Multi-Roadmap Support**: The instruction path is determined by the `$SCOPE` argument.
- **Parallelism**: Follow the **Parallel Dispatch Protocol** in `RULES.md` for all concurrent audit tasks.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output.

---

## Available Agents

| Agent | Specialty | Use For |
|-------|-----------|---------|
| planner | Implementation planning | Complex feature design, frontend |
| architect | System design | Architectural decisions, backend |
| code-reviewer | Code quality | Review changes |
| security-reviewer | Security analysis | Vulnerability detection |
| tdd-guide | Test-driven dev | Feature implementation |
| build-error-resolver | Build fixes | Build/type errors |
| e2e-runner | E2E testing | User flow testing |
| doc-updater | Documentation | Updating docs |
| refactor-cleaner | Code cleanup | Dead code removal |
| database-reviewer | Database | Query optimization |
| critic | Adversarial review | Stress test proposals |
| researcher | Research support | Investigations and synthesis |
| fact-checker | Verification | Validate claims and assumptions |

---

## Enterprise Orchestration Pattern

```text
Root Supervisor [Orchestrator]
    │
    ├── [Router] → selects relevant sub-supervisors
    │
    ├── Sub-Supervisor A (backend: architect)   ← PARALLEL
    │       ├── security-reviewer (parallel)
    │       └── database-reviewer (parallel)
    │
    ├── Sub-Supervisor B (frontend: planner)    ← PARALLEL
    │       ├── code-reviewer (parallel)
    │       └── e2e-runner (parallel)
    │
    └── [Reducer] → synthesizes all outputs
            │
            └── [Critic/Validator] → final gate before delivery

NOTE: PARALLELISM IS MANDATORY. All branches at the same indentation level
execute concurrently. Never wait for one branch before spawning the next.
```

---

## Execution Workflow

**Task**: $ARGUMENTS

## Phase 0: Context Synchronization

`[Mode: Sync]`

1. Identify **Scope** and **Target**:
   - Parse `$ARGUMENTS`. Format: `[SCOPE] [PHASE/DAY]` (e.g., `core P1D1`, `auth Phase 1 Day 2`).
   - If only one argument is provided (e.g., `P1D1`), default **Scope** to `core`.
   - Resolve the roadmap path: `plans/$SCOPE/roadmap.md`.
2. Read `plans/$SCOPE/roadmap.md`, `plans/$SCOPE/INSTRUCTIONS.md`, and `plans/$SCOPE/coding_convention.md`.
3. Confirm project root with `ls -laF`.

### Phase 1: Plan Resolution

`[Mode: Prepare]`

1. Read `plans/$SCOPE/roadmap.md` — both the Roadmap section and the Implementation Plan section.
2. Match `$ARGUMENTS` against the roadmap phases, days, or tasks.
3. If no match is found and no Implementation Plan section exists, ask user to run `/bootstrap` first.
4. Extract the target Phase/Day and decompose into **Atomic Tasks** (max 15 minutes each).
5. Map each task to its optimal specialist agent based on the Available Agents table.
6. **MANDATORY STOP**: Present the task breakdown to user. You MUST physically terminate your response here and WAIT for user confirmation before proceeding. DO NOT BEGIN PHASE 2.

**Task Type Routing**:

| Task Type | Detection | Primary Agent |
|-----------|-----------|---------------|
| Frontend | Pages, components, UI, styles, layout | `planner` |
| Backend | API, database, logic, algorithms | `architect` |
| Full-stack | Both frontend and backend | Both, IN PARALLEL |

### Phase 2: Context Retrieval

 `[Mode: Retrieval]`

**MANDATORY PARALLELISM**: Read files in PARALLEL using multiple grep/find calls in single turn.
Based on the plan's Key Files table:
1. Use MULTIPLE `grep` and `find` calls CONCURRENTLY to locate and read all relevant source files.
2. Confirm complete context before implementation.
3. If insufficient, read additional files as needed PARALLEL.

### Phase 3: Checkpoint Execution Loop

`[Mode: Implement]`

For **each** atomic task identified in Phase 1, execute this loop:

#### Step A — Implement & Verify

**MANDATORY PARALLELISM**: For full-stack atomic tasks, invoke BOTH sub-supervisors in PARALLEL.
**Instruction**: Use the `task` tool to spawn ALL relevant Sub-Supervisors in PARALLEL. Pass this prompt to each:
"1. **Execute and Write**: Use your own `write`/`edit` tools to implement this task: [Task Name]
2. **Implementation Root**: All files modified MUST reside inside `codebase/` and within your designated domain.
3. Follow the plan strictly — do not deviate.
4. Verify your changes natively (run type checker/linter, tests, fix regressions).
5. Spawn your designated code-reviewer to perform an atomic quality gate check on the files modified.
6. Return PASS or the handled issues summary."

**CRITICAL**: For full-stack tasks, spawn BOTH @architect AND @planner in a single turn. Wait for ALL to complete before checkpoint.

#### Step B & C — Handled by Sub-Supervisor
(The invoked Sub-Supervisor natively handles Verification and Quality Gates. If they report FAILURE, command them to fix before proceeding.)

#### Step D — Atomic Checkpoint

1. Scope all git operations to `codebase/`.
2. Run `git add .` within `codebase/`.
3. Commit with the format: `<type>: <description> [$SCOPE:PnDm]`
   - Example: `feat: add auth [core:P1D1]`
   - The `<type>` AND/OR `<description>` MUST NOT contain any duplicate phase references (e.g., strip out any `[Phase N Day M]` prefixes from the raw task name). The tag MUST ONLY exist at the very end of the template.
   - The `[PnDm]` suffix is MANDATORY for routine commits.
4. Do NOT push. Commits stay local for the drip-feeder queue.
5. Do NOT proceed to the next task until this commit is confirmed.

#### Self-Healing

If you accidentally implement multiple tasks without checkpointing:
1. STOP immediately.
2. Run `git reset --soft` to the last checkpoint.
3. Split the implementation into atomic components.
4. Create the required sequential commits before proceeding.

**Repeat Steps A-D for every task in the Phase/Day.**

---

### Phase 3: Dual-Perspective Audit

 `[Mode: Audit]`

After all tasks in the target Phase/Day are implemented and committed, run a final security/quality audit.
**MANDATORY PARALLELISM**: Spawn ALL audit branches in a SINGLE turn task array. Never sequential.

**Instruction**: Use the `task` tool to invoke BOTH `@architect` AND `@planner` in parallel. Pass this prompt:

"To BOTH sub-supervisors: After all atomic tasks complete, run concurrent audits across the Phase/Day.
- `@architect` branch: Spawn `@security-reviewer` to audit all modified backend files. Focus: vulnerabilities, API compliance, DB ops. Return prioritized issue list and apply fixes directly.
- `@planner` branch: Spawn `@code-reviewer` to audit all modified frontend files. Focus: accessibility, re-renders, design patterns. Return prioritized issue list and apply fixes directly.

**CRITICAL**: Run ALL audits in parallel. Spawn ALL task calls before waiting. Each fix uses Atomic Checkpoint (Step D)."

**MANDATORY STOP**: Present the audit summary. You MUST physically terminate your response here and WAIT for user confirmation before proceeding to Phase 4. DO NOT BEGIN PHASE 4.

### Phase 4: Documentation Sovereignty (MANDATORY)

 `[Mode: Documentation]`

**MANDATORY PARALLELISM**: Run documentation and validation CONCURRENTLY.
**Instruction**: Use the `task` tool to invoke `@doc-updater` AND `@critic` in PARALLEL.
- To `@doc-updater`: "1. Read `codebase/README.md` and verify against `plans/$SCOPE/INSTRUCTIONS.md` 2. Sync: if new features, APIs, or setup steps are not reflected, update the README 3. Output: List of sections updated or 'README is current'"
- To `@critic`: "Adversarially verify the complete Phase 1-3 output. Focus on: edge cases, security gaps, architectural debt, missing error handling. Return: [CRITICALissues], [HIGH-issues], [recommendations]"

**CRITICAL**: Spawn BOTH in a single turn. Wait for ALL before Phase 5.

### Phase 5: Delivery

`[Mode: Deliver]`

1. Run full test suite or equivalent.
2. Invoke `e2e-runner` to verify critical user flows for the implemented features.
3. Confirm all checkout queue commits were successful and that the local branch is correctly ahead of the remote.
4. Display the checkpoint queue: `git log origin/main..main --oneline`
5. Verify every commit has the correct `[$SCOPE:PnDm]` suffix.
6. Report:

```markdown
## Routine Complete: [$SCOPE:PnDm]

### Checkpoint Queue
| # | Hash | Message |
|---|------|---------|
| 1 | abc1234 | feat: ... [$SCOPE:P1D1] |
| 2 | def5678 | feat: ... [$SCOPE:P1D1] |

### Change Summary
| File | Layer | Operation | Description |
|------|-------|-----------|-------------|

### Audit Results
- Backend/Security: <Passed / N issues fixed>
- Frontend/Quality: <Passed / N issues fixed>
- E2E: <Passed / N scenarios verified>
- Documentation: <Updated / Current>

### Follow-up Items
- [ ] <Deferred MEDIUM/LOW items>
- [ ] <Suggested next steps>
- [ ] **Await user command** to run `/push [$SCOPE:PnDm]` (DO NOT execute this yourself)
```

---

## Key Rules

1. **PARALLELISM FIRST**: ALWAYS execute branches at same level in parallel. Never sequential.
2. 1 Task = 1 Commit. No exceptions. No batching.
3. Never modify files outside the plan's scope without user approval.
4. All reviewer agents have read-only access — only the orchestrator writes.
5. `architect` drives backend decisions; `planner` drives frontend decisions.
6. Mandatory dual-perspective audit after all tasks in the Phase/Day are complete.
7. Fix CRITICAL issues before delivery; document MEDIUM/LOW for follow-up.
8. All branches above execute CONCURRENTLY - wait for ALL before advancing.
9. Documentation must be current before delivery is declared.
10. The `[$SCOPE:PnDm]` suffix is reserved exclusively for `/routine` commits.

---

## Usage
```bash
/routine core P1D1
/routine billing Phase 2 Day 1
```
