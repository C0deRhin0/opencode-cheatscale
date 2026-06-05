# OpenCode CheatScale Harness

This directory contains the active OpenCode CheatScale (OCS) harness: agents, slash commands, skills, OpenCode plugin hooks, and helper scripts for wave-routed project execution.

For the GitHub-facing project overview, see the repository root `README.md`. This file is the operator-facing map of the `.opencode/` harness itself.

---

## Current Structure

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

The inherited upstream folders that were not part of the active local harness were removed: old hook configs, unused schemas, rule packs, contexts, extra tools, installer manifests, Rust/TUI experiments, and generated dependency folders.

---

## Core Operating Model

CheatScale is built around **wave-based orchestration** and **contribution cadence control**.

```text
Phase 0: Scan and Route
    - inspect workspace
    - detect existing codebase
    - classify complexity
    - assign file scopes

Wave 0.5: Codebase Ingestion, if needed
    - architect audits stack
    - code reviewer extracts conventions

Wave 1: Knowledge, if needed
    - researcher investigates unknowns
    - fact-checker verifies assumptions

Wave 2: Domain Work
    - architect, frontend, database, devops, integration, ML agents as needed

Wave 3: Quality Review
    - critic, code review, security, QA, accessibility, performance as needed

Phase: Synthesis or Checkpoint
    - planning artifacts written, implementation validated, or atomic commit created
```

Agents are selected dynamically. The orchestrator should not spawn the full roster unless the task genuinely requires it.

---

## The CheatScale Command Chain

The “cheat” is a deliberate workflow for separating real work time from visible contribution cadence.

| Stage | Command | Role |
|---|---|---|
| Plan | `/bootstrap <feature>` | Creates `plans/$SCOPE/` with scope hub, conventions, instructions, and task files. |
| Extend | `/inject <scope> <change>` | Adds new requirements without rewriting the roadmap. |
| Validate | `/validate-roadmap <scope>` | Stress-tests roadmap structure, feasibility, and scope. |
| Execute | `/routine <scope> <task>` | Runs atomic roadmapped tasks with dynamic wave routing. |
| Queue | `/commit <scope> <task>` | Commits local work inside `codebase/` without pushing. |
| Drip-feed | `/push [scope task]` | Pushes the oldest queued commit or task-tagged batch with date smoothing. |
| Backfill | `/backdate <date/range>` | Creates dated commits from current changes or mock activity. |
| Rewrite | `/redate <commits> <date/range>` | Rewrites existing commit timestamps across a target date or range. |

The typical flow is:

```text
/bootstrap -> /routine -> /commit -> /push
```

For direct contribution-graph manipulation:

```text
/backdate
/redate
```

---

## Registered Agents

`opencode.json` currently registers **25 agents**.

| Group | Agents |
|---|---|
| Primary | `build`, `orchestrator` |
| Planning/Synthesis | `planner`, `synthesis-writer`, `reducer` |
| Domain Writers | `architect`, `frontend-engineer`, `database-engineer`, `devops-engineer`, `integration-engineer`, `ml-engineer` |
| Quality/Review | `code-reviewer`, `security-reviewer`, `database-reviewer`, `performance-reviewer`, `accessibility-reviewer`, `qa-engineer`, `tdd-guide`, `e2e-runner`, `build-error-resolver`, `critic`, `researcher`, `fact-checker`, `refactor-cleaner`, `doc-updater` |

---

## Registered Commands

`opencode.json` currently registers **30 commands**.

```text
/aside
/backdate
/bootstrap
/checkpoint
/code-review
/commit
/commit-all
/context-budget
/debate
/eval
/execute
/harness-health
/inject
/jira-delete
/jira-push
/plan
/push
/redate
/refactor-clean
/research
/resume-session
/routine
/save-session
/security
/sessions
/sitrep
/tdd
/test-coverage
/update-docs
/validate-roadmap
```

---

## Skills

Skills live in `skills/<name>/SKILL.md`. `opencode.json` also registers `.opencode/skills` through `skills.paths`, so valid skills can be discovered by the harness.

First-party/future CheatScale skills include:

```text
cheatscale-conventions
git-backdating
jira-mapping
obsidian-frontmatter
phase-zero-scan
synthesis-roadmap-format
```

The placeholder skills are intentionally present for future expansion and should not be deleted.

---

## Scripts

Only active helper scripts remain:

```text
scripts/backdate_helper.py
scripts/redate_helper.py
scripts/harness-health.cjs
scripts/install-deps.sh
scripts/jira-sync/
scripts/lib/session-manager.cjs
scripts/lib/session-aliases.cjs
scripts/lib/utils.cjs
```

### Harness health

Run after changing config, agents, commands, plugins, or skills:

```bash
/harness-health
```

or directly:

```bash
node .opencode/scripts/harness-health.cjs
```

The validator checks command registration, agent registration, file references, skill frontmatter, cleanup artifacts, and stale upstream branding.

### Optional plugin development setup

Normal usage does not require `node_modules/`. If you want to build or type-check the local TypeScript plugin, run:

```bash
.opencode/scripts/install-deps.sh
```

This recreates `node_modules/` and runs `npm run build` inside `.opencode/`.

---

## Plugin Hooks

OpenCode plugin hooks live in:

```text
plugins/ocs-hooks.ts
```

Runtime toggles:

```bash
export OCS_HOOK_PROFILE=standard     # minimal | standard | strict
export OCS_DISABLED_HOOKS="post:edit:console-warn,pre:bash:tmux-reminder"
```

Use `minimal` for low-noise sessions, `standard` for normal development, and `strict` when you want stronger reminders and checks.

---

## Active MCPs

Active local MCPs are configured in `.mcp.json`:

| Server | Purpose |
|---|---|
| `github` | Repository, issue, and PR workflows |
| `context7` | Live documentation lookup |
| `exa` | Neural web search |
| `memory` | Persistent memory |
| `playwright` | Browser automation |
| `sequential-thinking` | Stepwise reasoning |
| `obsidian` | Local vault integration |

Reference MCP examples live in `mcp-configs/`.

Do not commit real credentials from local MCP files unless intentionally private.

---

## Restart Requirement

OpenCode loads config, agents, commands, skills, and plugins at startup. After editing files in this harness, restart OpenCode before expecting changes to take effect.
