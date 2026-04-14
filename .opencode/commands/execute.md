---
description: Execute an approved plan or ad-hoc task with full agent-driven implementation, audit, and delivery
agent: orchestrator
---

# Execute: $ARGUMENTS

Plan-driven or ad-hoc execution with native OpenCode agent orchestration.
All file modifications by the orchestrating agent. Specialist agents are read-only subtasks.

---

## Boot Sequence (MANDATORY)

Synchronize context before any work:
1. Read `plans/$SCOPE/INSTRUCTIONS.md` and `plans/$SCOPE/coding_convention.md`
2. Read `plans/$SCOPE/roadmap.md` (both Roadmap and Implementation Plan sections)
3. Confirm project root with `ls -laF`

---

## Core Protocols

- **Code Sovereignty**: You do NOT write implementation code directly; you delegate to Sub-Supervisors (`@architect`, `@frontend-engineer`, etc.) securely via the `task` tool. Their workers perform file modifications and read-only reviews.
- **Workspace Scoping**: All application code, assets, and configs MUST be written to `codebase/`.
- **Git Scoping**: All git operations MUST be within `codebase/`.
- **Stop-Loss**: Do not advance to next phase until current phase output is validated.
- **Phase Isolation**: You MUST terminate response and wait for user confirmation ('PROCEED') after every Phase marked 'MANDATORY STOP'.
- **Immutability**: Always create new objects; never mutate existing state.
- **Domain Authority**: Domain specialists own their scopes; boundary changes go through architect.
- **Parallelism**: Follow **Parallel Dispatch Protocol** in `RULES.md`.
- **Complexity Gating**: ALWAYS classify task BEFORE spawning agents:
  - **Simple** (1 domain, clear requirements): Only spawn 1 writer agent + 1 relevant reviewer
  - **Medium** (2 domains): Spawn relevant writers + Wave 3 reviewers
  - **Complex** (3+ domains, ambiguous): Spawn full wave roster minus irrelevant

**Pre-Dispatch Protocol** (BEFORE any agent spawns):
1. Classify task complexity: Simple / Medium / Complex
2. Determine affected domains from Router Decision Matrix
3. Assign file scopes based on actual project structure (Phase 0: Scan)
4. Only spawn agents needed for that complexity level
5. NEVER spawn all agents - skip irrelevant ones

---

## Available Agents

| Agent | Specialty | Use For |
|-------|-----------|---------|
| planner | Task decomposition | Ambiguous tasks, complex multi-domain |
| architect | Backend systems | API, database, infrastructure |
| frontend-engineer | UI implementation | Components, pages, layouts |
| database-engineer | Schema/migrations | Database design, SQL |
| devops-engineer | CI/CD, Docker | Pipelines, deployment |
| integration-engineer | External APIs | Third-party integrations |
| ml-engineer | ML/AI | Model integration |
| code-reviewer | Code quality | Review changes |
| security-reviewer | Security | Vulnerability detection |
| performance-reviewer | Performance | Bottlenecks, latency |
| accessibility-reviewer | Accessibility | WCAG compliance |
| qa-engineer | Test coverage | Edge cases, regression |
| tdd-guide | Test-driven dev | Feature implementation |
| build-error-resolver | Build fixes | TypeScript/build errors |
| e2e-runner | E2E testing | User flow testing |
| doc-updater | Documentation | Updating docs |
| refactor-cleaner | Code cleanup | Dead code removal |
| critic | Adversarial review | Stress test proposals |
| researcher | Research | Investigations |
| fact-checker | Verification | Validate claims |

---

## Enterprise Orchestration Pattern

```text
Root Supervisor [Orchestrator]
    │
    ├── [Router] → selects relevant sub-supervisors
    │
    ├── Sub-Supervisor A (backend)   ← PARALLEL
    │       ├── Architect (parallel)
    │       ├── Database Engineer (parallel)
    │       └── Integration Engineer (parallel)
    │
    ├── Sub-Supervisor B (frontend)  ← PARALLEL
    │       ├── Frontend Engineer (parallel)
    │       └── (code-reviewer via Wave 3)
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

## Phase 0: Planning & Context

1. Identify **Scope** from `$ARGUMENTS` (default: `core`).
2. Read `plans/$SCOPE/roadmap.md` and related context.
3. If executing an ad-hoc task, locate its closest match in the roadmap or implementation plan.

### Phase 1: Plan Resolution

`[Mode: Prepare]`

1. Read `plans/$SCOPE/roadmap.md` — both the Roadmap section and the Implementation Plan section.
2. Match `$ARGUMENTS` against the roadmap phases, tasks, or implementation steps.
3. If no match is found and no Implementation Plan section exists, ask user to run `/bootstrap` first.
4. Extract: task type, implementation steps, key files.
5. Proceed directly to implementation.

**Task Type Routing**:

| Task Type | Detection | Primary Agent |
|-----------|-----------|---------------|
| Frontend | Pages, components, UI, styles, layout | `frontend-engineer` |
| Backend | API, database, logic, algorithms | `architect` |
| Full-stack | Both frontend and backend | Both, IN PARALLEL |
| Ambiguous | Vague requirements, complex | `planner` (decompose first) |

### Phase 1: Context Retrieval

 `[Mode: Retrieval]`

**MANDATORY PARALLELISM**: Read files in PARALLEL using multiple grep/find calls in single turn.
Based on the plan's Key Files table:
1. Use MULTIPLE `grep` and `find` calls CONcurrently to locate and read all relevant source files.
2. Confirm complete context before implementation.
3. If insufficient, read additional files as needed PARALLEL.

### Phase 2: Implementation

 `[Mode: Implement]`

**MANDATORY PARALLELISM**: Execute ALL domain writers CONCURRENTLY. Never execute sequentially.
- **Full-Stack Tasks**: Invoke `@architect` (backend) + `@frontend-engineer` (frontend) in parallel.
- **Backend-Only Tasks**: Invoke `@architect` alone.
- **Frontend-Only Tasks**: Invoke `@frontend-engineer` alone.

**NOTE**: Only invoke `@planner` for ambiguous/complex tasks that need decomposition BEFORE implementation. For straightforward implementation, skip Planner.

**Instruction**: Use the `task` tool to spawn ALL relevant domain specialists in PARALLEL. Pass this prompt to each:
"1. **Execute and Write**: Use your own `write`/`edit` tools to implement this task: [Task Name]
2. **Implementation Root**: All files modified MUST reside inside `codebase/` and within your designated domain.
3. Follow the plan strictly — do not deviate.
4. Verify your changes natively (run type checker/linter, tests, fix regressions).
5. Return PASS or the handled issues summary."

**CRITICAL**: Spawn ALL task calls in a single turn. Wait for ALL to complete before advancing.

### Phase 3: Dual-Perspective Audit

 `[Mode: Audit]`

After implementation is complete, run a security/quality audit.
**MANDATORY PARALLELISM**: Spawn ALL audit branches in a SINGLE turn task array. Never sequential.

**Instruction**: Use the `task` tool to invoke BOTH `@architect` AND `@frontend-engineer` in parallel. Pass this prompt:

"To BOTH sub-supervisors: After implementation is complete, run concurrent audits.
- `@architect` branch: Spawn `@security-reviewer` to audit all modified backend files. Focus: vulnerabilities, API compliance, DB ops. Return the prioritized issue list and apply fixes directly.
- `@frontend-engineer` branch: Spawn `@code-reviewer` to audit all modified frontend files. Focus: accessibility, re-renders, design patterns. Return the prioritized issue list and apply fixes directly.

**CRITICAL**: Run ALL audits in parallel. Spawn ALL task calls before waiting."

### Phase 4: Documentation Sovereignty

 `[Mode: Documentation]`

**MANDATORY PARALLELISM**: Run documentation and validation CONCURRENTLY.
**Instruction**: Use the `task` tool to invoke `@doc-updater` AND `@critic` in PARALLEL.
- To `@doc-updater`: "1. Read `codebase/README.md` and verify against `plans/$SCOPE/INSTRUCTIONS.md` 2. Sync: if new features, APIs, or setup steps are not reflected, update the README 3. Output: List of sections updated or 'README is current'"
- To `@critic`: "Adversarially verify the complete Phase 1-3 output. Focus on: edge cases, security gaps, architectural debt, missing error handling. Return: [CRITICALissues], [HIGH-issues], [recommendations]"

**CRITICAL**: Spawn BOTH in a single turn. Wait for ALL before Phase 5.

### Phase 5: Delivery

 `[Mode: Deliver]`

1. Run full test suite: `npm test` or equivalent.
2. Invoke `e2e-runner` to verify critical user flows for the implemented feature.
3. Verify both audit checklists (security + accessibility) are green.
4. Report:

```markdown
## Execution Complete

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
```

---

## Key Rules

1. **PARALLELISM FIRST**: ALWAYS execute branches at same level in parallel. Never sequential.
2. **COMPLEXITY GATING**: Classify task first (Simple/Medium/Complex) - only spawn relevant agents
3. Plan before execute — create or locate full execution plan first
4. Never modify files outside the plan's scope without user approval
5. All reviewer agents have read-only access — only domain writers implement
6. Domain Authority: `architect` (backend), `frontend-engineer` (frontend), `planner` (decomposition only)
7. Mandatory dual-perspective audit before declaring completion
8. Fix CRITICAL issues before delivery; document MEDIUM/LOW for follow-up
9. All branches above execute CONCURRENTLY - wait for ALL before advancing
10. Documentation must be current before delivery is declared

---

## Usage
```bash
/execute core "implement user login"
/execute billing "Phase 1 - Stripe Integration"
```
