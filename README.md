# CheatScale

OpenCode CheatScale is a portable OpenCode harness for building projects with wave-based AI orchestration, roadmap automation, Obsidian-compatible planning files, JIRA mapping, and contribution-smoothing git workflows.

It is intentionally structured as a copyable `.opencode/` configuration: agents, commands, skills, plugin hooks, and helper scripts that can be dropped into a local project.

---

## What CheatScale Does

CheatScale turns a local project into an AI-assisted execution workspace:

- **Plan first** with `/bootstrap`, `/inject`, and `/validate-roadmap`.
- **Dispatch work in waves** through domain, quality, validation, and synthesis agents.
- **Keep implementation isolated** in `codebase/` while project knowledge lives in `plans/`.
- **Commit atomically** so each completed task maps to a clean local checkpoint.
- **Drip-feed and time-shift git history** so work completed in one sitting can appear as steady daily progress.
- **Map roadmap work to JIRA** using Feature > Task > Subtask structure.
- **Preserve Obsidian graph structure** with YAML frontmatter and wiki-links.

---

## The CheatScale Cheat

The name is literal. CheatScale is designed around a controlled productivity pipeline:

```text
1. Bootstrap a roadmap
2. Execute tasks through wave-routed agents
3. Commit each task atomically
4. Keep commits local in a queue
5. Push one task or one day of work at a time
6. Optionally backdate or redate commits to smooth contribution history
```

### Command chain

| Stage | Command | What it does |
|---|---|---|
| Plan | `/bootstrap <feature>` | Creates `plans/$SCOPE/` with scope hub, conventions, instructions, and task files. |
| Extend | `/inject <scope> <change>` | Adds new requirements without rewriting the whole roadmap. |
| Validate | `/validate-roadmap <scope>` | Stress-tests roadmap structure, feasibility, and implementation risk. |
| Execute | `/routine <scope> <task>` | Runs an atomic roadmapped task using dynamic wave-based agent routing. |
| Queue | `/commit <scope> <task>` | Commits local changes inside `codebase/` without pushing. |
| Drip-feed | `/push [scope task]` | Pushes the oldest queued commit or a task-tagged batch with date smoothing. |
| Backfill | `/backdate <date/range>` | Creates dated commits from current changes or mock activity. |
| Rewrite | `/redate <commits> <date/range>` | Rewrites timestamps of existing commits across a target date or range. |

This lets you separate actual working time from visible contribution cadence. You can complete multiple tasks in one session, keep them as local checkpoints, and publish them as a steady sequence.

---

## Wave-Based Orchestration

Wave-based orchestration is the core execution model. Agents do not all fire blindly. The orchestrator classifies work, selects the necessary specialists, dispatches independent work in parallel, then waits between waves.

```text
Phase 0: Scan and Route
    - Read project structure
    - Detect greenfield vs existing codebase
    - Classify complexity
    - Assign file scopes

Wave 0.5: Codebase Ingestion, if needed
    - Architect audits stack and architecture
    - Code reviewer extracts conventions

Wave 1: Knowledge, if unknowns exist
    - Researcher investigates options
    - Fact-checker verifies claims

Wave 2: Domain Analysis or Implementation
    - Architect, frontend, database, devops, integration, ML agents as needed

Wave 3: Quality Review
    - Critic, code review, security, QA, accessibility, performance as needed

Phase: Synthesis or Checkpoint
    - Planning artifacts are written
    - Implementation is validated
    - Atomic commit is created when appropriate
```

### Complexity gating

| Complexity | Criteria | Dispatch pattern |
|---|---|---|
| Simple | One domain, clear requirement | One writer plus one reviewer |
| Medium | Two to three domains, partial ambiguity | Relevant writers plus reviewers |
| Complex | Three or more domains, unclear architecture, or high risk | Knowledge wave, domain wave, quality wave, synthesis |

### Why waves matter

- **Parallel where safe**: independent agents run together.
- **Sequential where necessary**: later waves consume earlier outputs.
- **Domain ownership**: specialists stay within assigned scopes.
- **Reduced conflicts**: reviewers do not overwrite implementers.
- **Better auditability**: each task has a visible path from plan to commit.

---

## Current Harness Structure

The repository has been cleaned down to the active OpenCode CheatScale harness.

```text
.opencode/
├── opencode.json      # Main OpenCode wiring: agents, commands, plugins, models
├── agents/            # 25 specialist agent prompts
├── commands/          # 30 slash command prompts
├── skills/            # reusable instruction packs and future placeholders
├── plugins/           # OpenCode runtime hooks
├── scripts/           # helper scripts, JIRA sync, backdating, harness health
├── instructions/      # global operating instructions
├── mcp-configs/       # MCP server reference configs
├── AGENTS.md          # agent roster and operating rules
├── RULES.md           # wave protocols and constraints
├── SOUL.md            # core identity and principles
└── .mcp.json          # active local MCP servers
```

Deleted inherited infrastructure such as old hook configs, unused schemas, rules, contexts, extra tools, Rust experiments, and installer manifests is no longer part of the active harness.

---

## Active Agents

CheatScale currently registers **25 agents** in `.opencode/opencode.json`.

### Primary agents

| Agent | Role |
|---|---|
| `build` | Default direct-use coding agent |
| `orchestrator` | Root supervisor for large workflows |

### Planning and synthesis

| Agent | Role |
|---|---|
| `planner` | Task decomposition |
| `synthesis-writer` | Bootstrap roadmap artifact writing |
| `reducer` | Merges parallel outputs |

### Domain writers

| Agent | Role |
|---|---|
| `architect` | Backend, systems, architecture |
| `frontend-engineer` | UI, components, pages |
| `database-engineer` | Schema, migrations, data modeling |
| `devops-engineer` | CI/CD, Docker, deployment |
| `integration-engineer` | External APIs, webhooks, connectors |
| `ml-engineer` | ML, AI, embeddings, inference |

### Quality and review

| Agent | Role |
|---|---|
| `code-reviewer` | Quality, maintainability, patterns |
| `security-reviewer` | Vulnerability detection and sensitive code fixes |
| `database-reviewer` | PostgreSQL and Supabase review |
| `performance-reviewer` | Bottlenecks, latency, memory |
| `accessibility-reviewer` | WCAG and UX accessibility |
| `qa-engineer` | Coverage, edge cases, regressions |
| `tdd-guide` | Test-driven development workflow |
| `e2e-runner` | Playwright/user-flow testing |
| `build-error-resolver` | Build and TypeScript failure fixes |
| `critic` | Adversarial stress testing |
| `researcher` | Investigation and synthesis |
| `fact-checker` | Accuracy checks and claim verification |
| `refactor-cleaner` | Dead code and consolidation |
| `doc-updater` | Documentation and codemap updates |

---

## Active Commands

CheatScale currently registers **30 slash commands**.

| Command | Purpose |
|---|---|
| `/bootstrap` | Generate project context and roadmap via wave orchestration |
| `/inject` | Add requirements into an existing roadmap |
| `/validate-roadmap` | Review roadmap quality, feasibility, and scope |
| `/plan` | Create implementation plan |
| `/execute` | Execute an approved plan or ad-hoc task |
| `/routine` | Execute roadmapped tasks with atomic checkpointing |
| `/tdd` | Enforce test-first workflow |
| `/test-coverage` | Analyze coverage gaps |
| `/code-review` | Run code quality review |
| `/security` | Run security review |
| `/refactor-clean` | Remove dead code and consolidate duplicates |
| `/debate` | Trigger adversarial agent debate |
| `/research` | Run research workflow |
| `/sitrep` | Report current workspace state |
| `/context-budget` | Analyze context usage |
| `/update-docs` | Update documentation |
| `/eval` | Evaluate against acceptance criteria |
| `/checkpoint` | Save progress state |
| `/commit` | Commit current local work into the drip queue |
| `/commit-all` | Detect all changes, commit separately, then push all |
| `/push` | Drip-feed queued commits and smooth contribution timing |
| `/backdate` | Create backdated commits |
| `/redate` | Rewrite existing commit timestamps |
| `/jira-push` | Push roadmap hierarchy to JIRA |
| `/jira-delete` | Delete JIRA hierarchy for a roadmap feature |
| `/sessions` | Manage saved session history and aliases |
| `/save-session` | Save current session to `~/.opencode/session-data/` |
| `/resume-session` | Resume from a saved session |
| `/aside` | Answer a side question without derailing active work |
| `/harness-health` | Validate harness wiring and cleanup state |

---

## Planning Artifacts

CheatScale uses a **Feature > Task > Subtask** model.

| CheatScale | JIRA equivalent | Example |
|---|---|---|
| Feature | Epic | `billing_service` |
| Task | Task | `checkout-flow` |
| Subtask | Subtask | `build-payment-form` |

Roadmaps live under:

```text
plans/$SCOPE/
├── $SCOPE.md
├── INSTRUCTIONS.md
├── coding_convention.md
└── tasks/
    └── task-name.md
```

Planning files use Obsidian-compatible YAML frontmatter and wiki-links so each feature becomes a graphable planning hub.

---

## JIRA Integration

JIRA integration is optional and scope-specific.

```bash
/bootstrap "billing service"
# Enter JIRA project key when prompted, for example BILLING_SERVICE

/jira-push billing_service
```

CheatScale maps:

```text
plans/$SCOPE/$SCOPE.md       -> JIRA Epic
plans/$SCOPE/tasks/*.md      -> JIRA Tasks
task checklist/subtasks      -> JIRA Subtasks
```

If no JIRA project key is provided, roadmap files stay local and frontmatter records `jira_project: none`.

JIRA helper scripts live in:

```text
.opencode/scripts/jira-sync/
```

---

## Obsidian Integration

CheatScale roadmap files include frontmatter for graph-friendly planning:

```yaml
---
tags: [scope, billing_service]
scope: billing_service
jira_project: BILLING_SERVICE
type: scope
---
```

Task files link back to their parent scope through frontmatter and wiki-links, making `plans/` usable as an Obsidian vault or a subfolder inside one.

---

## MCP Servers

Active local MCP configuration lives in:

```text
.opencode/.mcp.json
```

Currently configured active MCPs:

| Server | Purpose |
|---|---|
| `github` | Repository, issue, and PR workflows |
| `context7` | Live documentation lookup |
| `exa` | Neural web search |
| `memory` | Persistent memory |
| `playwright` | Browser automation |
| `sequential-thinking` | Stepwise reasoning |
| `obsidian` | Local vault integration |

Reference MCP examples live in:

```text
.opencode/mcp-configs/
```

Do not commit real credentials from local MCP files unless intentionally private.

---

## Installation

### Use CheatScale in a project

```bash
git clone <this-repo>
cp -r .opencode /path/to/your/project/
cd /path/to/your/project
opencode
```

Then run:

```bash
/bootstrap "my feature"
```

### Optional plugin development setup

No dependency install is needed for normal agents, commands, and skills. Only install dependencies when you want to type-check or build the local TypeScript plugin:

```bash
.opencode/scripts/install-deps.sh
```

---

## Harness Health

After changing agents, commands, skills, plugins, or config, run:

```bash
/harness-health
```

or directly:

```bash
node .opencode/scripts/harness-health.cjs
```

The health check validates:

- command files are registered
- registered commands have files
- agents are registered
- agent prompt references exist
- instruction paths exist
- skill frontmatter names match folder names
- stale upstream branding is absent
- cleanup artifacts such as `node_modules/` and `.DS_Store` are absent

---

## Plugin Hook Controls

The OpenCode plugin hooks support runtime toggles:

```bash
export OCS_HOOK_PROFILE=standard     # minimal | standard | strict
export OCS_DISABLED_HOOKS="post:edit:console-warn,pre:bash:tmux-reminder"
```

Use `minimal` for low-noise sessions, `standard` for normal development, and `strict` for stronger reminders and checks.

---

## Foundation Credit

CheatScale was built from an open-source OpenCode/Claude Code harness foundation by [affaan](https://github.com/affaan-m), then heavily adapted into OpenCode CheatScale.

The retained project respects the original license while replacing inherited branding, removing unused infrastructure, and adding CheatScale-specific orchestration, JIRA, Obsidian, and git contribution workflows.

---

## License

MIT License

---

**CheatScale** - wave-routed execution, atomic checkpoints, and contribution cadence control for OpenCode projects.
