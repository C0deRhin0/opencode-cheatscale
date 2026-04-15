---
description: Execute a roadmapped Phase or Day with atomic task checkpointing — implement, audit, commit per task
agent: orchestrator
---

# Routine: $ARGUMENTS

Full execution pipeline with **atomic checkpointing** — every completed task gets its own commit before the next task begins. Uses wave-based orchestration with dynamic agent routing.

---

## Core Protocols

- **Workspace Scoping**: All application code, assets, configs to `codebase/`
- **Git Scoping**: All git operations within `codebase/`
- **Stop-Loss**: Do not proceed until current phase validated
- **Phase Isolation**: MANDATORY STOP after each phase
- **Code Sovereignty**: Orchestrator delegates; specialists write
- **Immutability**: Always create new objects; never mutate
- **Domain Authority**: Specialists own scopes; changes through architect
- **Anti-Batching**: 1 Task = 1 Implementation = 1 Commit
- **No Auto-Pushing**: STOP and await human confirmation
- **Parallelism**: MANDATORY - parallel dispatch where possible

---

## Complexity Gating

**ALWAYS classify task BEFORE spawning agents:**

| Complexity | Criteria | Agents Spawned |
|------------|----------|----------------|
| **Simple** | 1 domain, clear requirements | 1 writer + 1 reviewer |
| **Medium** | 2-3 domains, partial clarity | Relevant writers + Wave 3 reviewers |
| **Complex** | 3+ domains, ambiguous | Full wave roster minus irrelevant |

---

## Phase 0: Scan & Dynamic Routing (MANDATORY FIRST)

`[Mode: Scan]`

1. **Project Scan**: `ls -laF` to confirm structure
2. **Read Context**: `plans/$SCOPE/roadmap.md`, `INSTRUCTIONS.md`, `coding_convention.md`
3. **Task Analysis**: Parse tasks from roadmap, determine domain requirements

### Dynamic Agent Router

**Based on task requirements, SELECT agents from full roster:**

| Task Type | Detection | Primary Agents | Secondary (if needed) |
|-----------|-----------|-----------------|----------------------|
| **Backend API** | endpoints, services, controllers | architect | security-reviewer, code-reviewer |
| **Database** | schema, migrations, queries | database-engineer, database-reviewer | architect |
| **Frontend UI** | components, pages, styles | frontend-engineer | accessibility-reviewer, code-reviewer |
| **CI/CD** | pipelines, docker, deployment | devops-engineer | security-reviewer |
| **External API** | integrations, webhooks | integration-engineer | security-reviewer |
| **ML/AI** | models, embeddings, prompts | ml-engineer | architect |
| **Tests** | unit, integration, e2e | tdd-guide, qa-engineer | e2e-runner |
| **Build/DevOps** | errors, types, config | build-error-resolver | tdd-guide |
| **Docs** | readme, guides, codemaps | doc-updater | - |
| **Refactor** | cleanup, dead code | refactor-cleaner | code-reviewer |
| **Ambiguous** | vague requirements | planner | architect, researcher |
| **Full-Stack** | frontend + backend | architect + frontend-engineer | security-reviewer, qa-engineer |

**Rule**: Spawn ONLY the agents needed for the task. Never spawn all agents.

---

## Full Agent Roster (24 Agents)

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

**Task**: $ARGUMENTS

### Phase 1: Context Synchronization

`[Mode: Sync]`

1. Parse `$ARGUMENTS` - format: `[SCOPE] [PHASE/DAY]` (e.g., `core P1D1`)
2. Read roadmap, instructions, conventions
3. Extract atomic tasks (15 min max each)

### Phase 2: Context Retrieval

`[Mode: Retrieval]`

**MANDATORY PARALLELISM**: Read files in PARALLEL
- Use multiple `grep`/`find` calls concurrently
- Get all relevant source files before implementation

### Phase 3: Checkpoint Execution Loop

`[Mode: Implement]`

For **each atomic task**:

#### Step A — Dynamic Agent Dispatch

Based on **Task Type** from Phase 0 router, spawn relevant agents in PARALLEL:

**Example - Backend Task**:
```
Invoke @architect + @code-reviewer in parallel
```

**Example - Full-Stack Task**:
```
Invoke @architect + @frontend-engineer + @security-reviewer + @qa-engineer in parallel
```

**Example - Database Task**:
```
Invoke @database-engineer + @database-reviewer in parallel
```

**Task Prompt Template**:
```
1. Execute: [Task Name] from plans/$SCOPE/roadmap.md
2. Implementation Root: All files in codebase/ within your domain scope
3. Follow: plans/$SCOPE/coding_convention.md
4. Verify: Run tests/linter, fix regressions
5. Quality Gate: Spawn your designated reviewer
6. Output: PASS or issues handled
```

#### Step B — Quality Gates

Reviewer agents validate. If FAIL, dispatch back to writer for fixes.

#### Step C — Atomic Checkpoint

1. Git add + commit within `codebase/`
2. Format: `<type>: <description> [$SCOPE:PnDm]`
3. Do NOT push - commits stay local

**Repeat for every task**

---

### Phase 4: Final Audit

`[Mode: Audit]`

After all tasks complete, **parallel audit**:
- `@security-reviewer` - Security scan
- `@qa-engineer` - Test coverage check
- `@doc-updater` - Sync README

---

## Output Format

```
## Routine Complete [$SCOPE:PHASE/DAY]

Tasks Completed: [n]
Commits: [n]
Agents Used: [list]
Issues Resolved: [count]
```

---

## Usage

```bash
/routine core P1D1           # Execute Day 1 of Phase 1
/routine billing Phase2     # Execute entire Phase 2
/routine auth P3D2 task-3  # Specific task only
```

---

**Key Principle**: Dynamically route to relevant agents based on task type. Never spawn all 24 agents. Classify, route, execute.