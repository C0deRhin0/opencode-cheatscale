---
description: Execute an approved plan or ad-hoc task with full agent-driven implementation, audit, and delivery
agent: orchestrator
---

# Execute: $ARGUMENTS

Plan-driven or ad-hoc execution using wave-based orchestration with dynamic agent routing. All implementations written to `codebase/`; specialists delegated via task tool.

---

## Core Protocols

- **Workspace Scoping**: All code, assets, configs to `codebase/`
- **Git Scoping**: All git operations within `codebase/`
- **Stop-Loss**: Do not advance until validated
- **Phase Isolation**: MANDATORY STOP after each phase
- **Code Sovereignty**: Orchestrator delegates; specialists write
- **Immutability**: Always create new objects; never mutate
- **Domain Authority**: Specialists own scopes; changes through architect
- **Parallelism**: MANDATORY - parallel dispatch where possible
- **Complexity Gating**: Classify task BEFORE spawning agents
- **Loop Contract**: Treat execution as a bounded loop with explicit maker/checker roles, stop conditions, budgets, and evidence.

---

## Complexity Gating

| Complexity | Criteria | Agents Spawned |
|------------|----------|----------------|
| **Simple** | 1 domain, clear requirements | 1 writer + 1 reviewer |
| **Medium** | 2-3 domains, partial clarity | Relevant writers + reviewers |
| **Complex** | 3+ domains, ambiguous | Relevant wave specialists as needed |

## Loop Contract Requirements

For loop-like execution, derive a lightweight contract from `.opencode/loop-contracts/loop-contract-template.yaml` before implementation:

- define the goal and scope
- select maker agents and checker agents
- state allowed read/write paths
- cap repair attempts at 3 unless user-approved
- define success and failure stop conditions
- require a verification record before completion

---

## Phase 0: Scan & Dynamic Routing (MANDATORY FIRST)

`[Mode: Scan]`

1. **Project Scan**: `ls -laF` to confirm structure
2. **Read Context**: `plans/$SCOPE/$SCOPE.md`, `plans/$SCOPE/tasks/*.md`, `INSTRUCTIONS.md`, `coding_convention.md`
3. **Task Analysis**: Determine domain requirements

### Dynamic Agent Router

| Task Type | Primary Agents | Secondary (if needed) |
|-----------|-----------------|----------------------|
| **Backend API** | architect | security-reviewer, code-reviewer |
| **Database** | database-engineer, database-reviewer | architect |
| **Frontend UI** | frontend-engineer | accessibility-reviewer, code-reviewer |
| **CI/CD** | devops-engineer | security-reviewer |
| **External API** | integration-engineer | security-reviewer |
| **ML/AI** | ml-engineer | architect |
| **Tests** | tdd-guide, qa-engineer | e2e-runner |
| **Build/DevOps** | build-error-resolver | tdd-guide |
| **Docs** | doc-updater | - |
| **Refactor** | refactor-cleaner | code-reviewer |
| **Ambiguous** | planner | architect, researcher |
| **Full-Stack** | architect + frontend-engineer | security-reviewer, qa-engineer |

---

## Dispatch Roster

| Agent | Specialty | When to Use |
|-------|-----------|-------------|
| **DOMAIN WRITERS** | | |
| architect | Backend systems, API, architecture | API, services, infrastructure |
| frontend-engineer | UI/UX, components, layouts | UI, components, pages |
| database-engineer | Schema, migrations, SQL | DB design, migrations |
| devops-engineer | CI/CD, Docker, deployment | Pipelines, containers |
| integration-engineer | External APIs, webhooks | Third-party integrations |
| ml-engineer | ML/AI, embeddings, prompts | AI features, models |
| **QUALITY AGENTS** | | |
| code-reviewer | Code quality, patterns | All implementations |
| security-reviewer | Vulnerabilities, auth | Sensitive code, auth |
| performance-reviewer | Bottlenecks, latency | Performance-critical code |
| accessibility-reviewer | WCAG, keyboard, screen reader | UI components |
| qa-engineer | Test coverage, edge cases | Test validation |
| tdd-guide | Test-driven development | Feature implementation |
| e2e-runner | End-to-end testing | Critical user flows |
| build-error-resolver | Build errors, type errors | When build fails |
| **UTILITY AGENTS** | | |
| refactor-cleaner | Dead code, cleanup | Maintenance tasks |
| doc-updater | Documentation, codemaps | Documentation updates |
| planner | Task decomposition | Complex/ambiguous tasks |
| **WAVE 1 AGENTS** | | |
| researcher | Investigation, synthesis | Unknowns, research |
| fact-checker | Verification, accuracy | Validate claims |
| **WAVE 6 AGENTS** | | |
| critic | Adversarial review | Stress-test plans |
| reducer | Output synthesis | Merge parallel outputs |

---

## Execution Workflow

### Phase 1: Context Boot

1. Read `plans/$SCOPE/INSTRUCTIONS.md` and `coding_convention.md`
2. Read `plans/$SCOPE/$SCOPE.md` and `plans/$SCOPE/tasks/*.md`
3. Confirm project root: `ls -laF`

### Phase 2: Complexity Classification

Classify task as Simple/Medium/Complex BEFORE spawning agents

### Phase 3: Dynamic Agent Dispatch

**Based on task type from Phase 0, invoke relevant agents in PARALLEL:**

#### Example: New Feature (Full-Stack)
```
Wave 2 (parallel):
- @architect: Backend implementation
- @frontend-engineer: Frontend implementation
- @tdd-guide: Write tests

Wave 3 (parallel):
- @security-reviewer: Auth review
- @qa-engineer: Coverage check
```

#### Example: Bug Fix
```
Single agent:
- @build-error-resolver: Fix build error
- @code-reviewer: Verify fix
```

#### Example: Database Migration
```
Wave 2 (parallel):
- @database-engineer: Create migration
- @database-reviewer: Validate SQL

Wave 3:
- @architect: Review impact
```

### Phase 4: Implementation

Each agent:
1. Writes to `codebase/` within their domain scope
2. Follows `coding_convention.md`
3. Verifies with tests/linter
4. Spawns their designated reviewer

### Phase 5: Quality Gates

Reviewer validates. Issues → dispatch back to writer for fixes.

### Phase 6: Verification Record

Before final output, summarize evidence using `.opencode/loop-contracts/verification-record-template.yaml`:

- commands run and exit codes
- test/build/lint/security status
- reviewer decisions
- unverified claims
- risks and next action

---

## Output Format

```
## Execute Complete [$SCOPE]

Task: [description]
Complexity: [Simple/Medium/Complex]
Agents Used: [list]
Files Modified: [count]
Issues: [count resolved]
Verification Record: [PASS/FAIL/PARTIAL and evidence summary]
```

---

## Usage

```bash
/execute core implement user authentication
/execute billing add payment processing
/execute auth fix login bug
/execute ml integrate sentiment analysis
```

---

**Key Principle**: Dynamic routing - select only relevant agents based on task type. Never spawn the full roster by default. Classify, route, execute.
