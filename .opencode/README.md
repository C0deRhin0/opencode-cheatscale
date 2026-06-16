# OpenCode CheatScale Harness

This directory contains the active OpenCode CheatScale (OCS) harness: agents, slash commands, skills, OpenCode plugin hooks, and helper scripts for wave-routed project execution.

For the GitHub-facing project overview, see the repository root `README.md`. This file is the operator-facing map of the `.opencode/` harness itself.

---

## Current Structure

```text
.opencode/
├── opencode.json      # Main OpenCode wiring: agents, commands, plugins, models
├── install.sh         # Portable exporter wrapper
├── package.json       # Optional plugin/package scripts and metadata
├── agents/            # 31 specialist agent prompts
├── commands/          # 35 slash command prompts
├── skills/            # reusable instruction packs, gotcha, skill-builder, meta-harness
├── plugins/           # OpenCode runtime hooks
├── scripts/           # helper scripts, portability exporter, hooks, JIRA sync, harness health
├── loop-contracts/    # loop contract, verification, reviewer, worktree, and benchmark templates
├── portable/          # adapter notes for non-OpenCode harness targets
├── local/             # ignored local-only gotcha, trace, benchmark, and diagnosis state
├── instructions/      # global operating instructions
├── mcp-configs/       # MCP server reference configs
├── AGENTS.md          # agent roster and operating rules
├── RULES.md           # wave protocols and constraints
├── SOUL.md            # core identity and principles
└── .mcp.json          # legacy/reference MCP server examples
```

The inherited upstream folders that were not part of the active local harness were removed: old hook configs, unused schemas, rule packs, contexts, extra tools, installer manifests, and Rust/TUI experiments. Local build output such as `node_modules/` and `dist/` is ignored and reported by `/harness-health` as cleanup candidates when present.

---

## Harness Feature Inventory

The active `.opencode/` harness contains these features:

| Feature area | Included capabilities |
|---|---|
| OpenCode config | Strict-schema `opencode.json`, localhost-only server binding, default `build` agent, reduced eager instructions, skills path registration, valid `mcp` entries, and plugin loading via `./plugins/ocs-hooks.ts`. |
| Agents | 31 registered primary/subagents with domain, planning, quality, research, harness safety, context budgeting, synthesis, and cleanup roles. |
| Commands | 35 slash commands for planning, execution, testing, review, sessions, git cadence, JIRA sync, gotchas, skill building, loop planning/reporting, and health checks. |
| Skills | 39 `SKILL.md` instruction packs, including CheatScale-specific skills and broader API/backend/frontend/security/testing/research/media/platform workflows. |
| Wave orchestration | Phase 0 route/scan, optional ingestion, knowledge wave, domain wave, quality wave, and synthesis/checkpoint phase. |
| Roadmaps | Feature > Task > Subtask planning files in `plans/$SCOPE/`, Obsidian-compatible frontmatter, wiki-links, conventions, and scope instructions. |
| Git cadence | Atomic checkpoints, local-only `drip/todo/*` and `drip/done/*` tags, `/push`, `/backdate`, and `/redate`. |
| JIRA sync | Optional local credential config, safe scope/project/issue-key validation, JIRA hierarchy creation, and JIRA hierarchy deletion. |
| Local learning | `/gotcha`, `/skill-builder`, `/harness-optimize`, local-only gotchas, generated views, optional traces, and manual meta-harness diagnosis. |
| Loop Engineering | `/loop-plan`, `/loop-report`, loop contracts, verification records, reviewer schemas, worktree protocol, executable benchmark specs, fail-closed evaluation, state ownership, and approval gates. |
| Native hooks | OpenCode-supported hooks for events, commands, tools, permissions, shell env, traces, and compaction context. |
| Native safety | Denies sensitive bash/read access to `.env`, nested `.env`, JIRA config env files, package tokens, SSH/AWS/Kube/GitHub/Docker credentials, `.opencode/local/**`, `.agents/local/**`, redirection forms such as `cat <.env`, broad destructive `rm -rf` variants, known malware IOCs, remote/encoded payload execution, and `chmod 777`. |
| Portable export | Generates `AGENTS.md`, `.agents/agents`, `.agents/skills`, `.agents/harness-hooks`, `.agents/loop-contracts`, manifests, local-state gitignore, portability docs, and Claude/Codex/Gemini adapters. |
| Portable safety | Dry-run planning, `--force` backups, `--list-targets`, managed markers, checksum manifests, partial-export manifest preservation, symlink rejection, secret exclusions, and local-only traces/backups. |
| Validation | `/harness-health`, `npm test`, `npm run build`, `npm run portable:verify`, skill validation, shell syntax checks, and dependency audits. |

---

## Portable Harness Export

OpenCode remains the native authoring harness, but CheatScale can now generate a vendor-neutral layer plus platform adapters for Claude Code, Codex, and Gemini/Antigravity.

```bash
.opencode/install.sh --target all --dry-run
.opencode/install.sh --target claude --project /path/to/project
.opencode/install.sh --target codex --project /path/to/project
.opencode/install.sh --target gemini --project /path/to/project
.opencode/install.sh --list-targets
```

Exporter options:

| Option | Purpose |
|---|---|
| `--target portable\|claude\|codex\|gemini\|all` | Select output target. Adapter targets automatically include the portable base. |
| `--project /path/to/project` | Export into a specific project root. |
| `--dry-run` | Plan writes without touching files. |
| `--force` | Overwrite existing unmanaged files after backup. |
| `--backup` / `--no-backup` | Control backup creation for overwritten files. |
| `--list-targets` | Print the adapter capability registry. |

Generated portable files use:

```text
AGENTS.md                         # shared instruction source
.agents/.gitignore                # local-state protection for backups/traces
.agents/PORTABILITY.md            # generated operator notes
.agents/agents/                   # full specialist agent prompt mirror
.agents/skills/                   # Agent Skills-compatible workflow library
.agents/harness-hooks/            # shared deterministic hook scripts
.agents/loop-contracts/           # loop contract and verification templates
.agents/harness-adapters.json     # target capability registry
.agents/harness-manifest.json     # generated-file manifest/checksums
```

Platform adapters are intentionally thin:

| Target | Generated adapter |
|---|---|
| Claude Code | `CLAUDE.md`, `.claude/settings.json`, `.claude/skills/` mirror |
| Codex | `.codex/config.toml`, `.codex/hooks.json` |
| Gemini/Antigravity | `GEMINI.md`, `.gemini/settings.json` |

Shared hook scripts:

| Script | Behavior |
|---|---|
| `session-context.cjs` | Emits concise OCS context at session start. |
| `pre-tool-policy.cjs` | Blocks broad destructive `rm -rf` variants, git tag pushes, unapproved force pushes, unapproved package publishes, sensitive local-data reads including nested `.env` and `cat <.env` forms, sensitive file-tool targets, known malware IOCs, remote/encoded payload execution, and `chmod 777`. |
| `gotcha-check.cjs` | Reads local gotcha state and surfaces relevant reminders. |
| `redact-trace.cjs` | Writes opt-in redacted traces only when `OCS_TRACE_CAPTURE=1`; output is capped, local-only, symlink-checked, and lock-protected. |

Exporter safety guarantees:

- The exporter skips unmanaged existing files unless `--force` is passed.
- Forced overwrites are backed up under `.agents/local/backups/` and `.agents/.gitignore` keeps local state out of source control.
- Managed files are tracked with `OCS-PORTABLE-MANAGED` markers where practical plus `.agents/harness-manifest.json` checksums.
- Partial exports preserve manifest entries for other targets, so running `all`, then `codex`, then `claude` remains idempotent.
- Symlinked managed directories are rejected before writes, preventing path escape from the target project.
- Local-only state is never exported: `.opencode/local/`, `.agents/local/`, generated gotcha views, JIRA credentials, traces, diagnostics, `.env` files, token files, and credential-like auxiliary files stay private.
- Claude Code permissions are scoped to generated docs, hooks, and skills; local traces, backups, credentials, and secrets are denied.

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
| Execute | `/routine <scope> <task>` | Runs a roadmapped task, creates clean local commits, and adds a private `drip/todo/<scope>/<task>` tag. |
| Queue | `/commit <scope> <task>` | Commits manual local work inside `codebase/` and adds it to the local drip-tag queue. |
| Drip-feed | `/push [scope task]` | Pushes the oldest pending local drip tag with date smoothing and records a local `drip/done/*` marker. |
| Backfill | `/backdate <date/range>` | Creates dated commits from current changes or mock activity. |
| Rewrite | `/redate <commits> <date/range>` | Rewrites existing commit timestamps across a target date or range. |

The typical flow is:

```text
/bootstrap -> /routine -> /sitrep -> /push
```

Manual changes can enter the same queue with `/commit <scope> <task>`. Drip metadata lives in local-only git tags, not commit messages, and `/push` must not publish `drip/*` tags.

For direct contribution-graph manipulation:

```text
/backdate
/redate
```

---

## Registered Agents

`opencode.json` currently registers **31 agents**.

| Group | Agents |
|---|---|
| Primary | `build`, `orchestrator` |
| Planning/Synthesis | `planner`, `synthesis-writer`, `reducer` |
| Domain Writers | `architect`, `frontend-engineer`, `database-engineer`, `devops-engineer`, `integration-engineer`, `ml-engineer` |
| Quality/Review | `code-reviewer`, `security-reviewer`, `database-reviewer`, `performance-reviewer`, `accessibility-reviewer`, `qa-engineer`, `tdd-guide`, `e2e-runner`, `build-error-resolver`, `critic`, `researcher`, `fact-checker`, `refactor-cleaner`, `doc-updater` |
| Harness Safety/Precision | `harness-security-engineer`, `prompt-injection-analyst`, `hook-policy-engineer`, `context-budget-auditor`, `mcp-supply-chain-auditor`, `incident-forensics-analyst` |

Narrow specialists use `Use ONLY` descriptions and explicit boundaries so they improve routing precision without encouraging full-roster dispatch. Reusable guidance without independent tool execution should remain a skill rather than becoming another agent.

The portable exporter mirrors these prompt files into `.agents/agents/` so non-OpenCode harnesses can inspect or adapt the full specialist definitions instead of relying only on the generated roster in `AGENTS.md`.

---

## Registered Commands

`opencode.json` currently registers **35 commands**.

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
/gotcha
/harness-health
/harness-optimize
/inject
/jira-delete
/jira-push
/loop-plan
/loop-report
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
/skill-builder
/sitrep
/tdd
/test-coverage
/update-docs
/validate-roadmap
```

---

## Skills

Skills live in `skills/<name>/SKILL.md`. `opencode.json` also registers `.opencode/skills` through `skills.paths`, so valid skills can be discovered by the harness and exported into `.agents/skills/` by the portable exporter.

The current catalog validates **39 skill files**. CheatScale-specific and roadmap skills include:

```text
cheatscale-conventions
context-budget
gotcha
git-backdating
jira-mapping
loop-engineering
meta-harness
obsidian-frontmatter
phase-zero-scan
skill-builder
synthesis-roadmap-format
```

The placeholder skills are intentionally present for future expansion and should not be deleted.

The broader skill catalog also covers API design, backend/frontend patterns, Bun, Claude API, coding standards, content/crosspost workflows, deep/exa/market research, E2E testing, evals, fal.ai media, frontend slides, investor materials/outreach, MCP server patterns, Next.js Turbopack, security review, strategic compaction, TDD, verification loops, video editing, and X API integration.

---

## Scripts

Only active helper scripts remain:

```text
install.sh
scripts/backdate_helper.py
scripts/redate_helper.py
scripts/harness-health.cjs
scripts/portable-harness.cjs
scripts/portable-harness.test.cjs
scripts/loop-plan.cjs
scripts/loop-report.cjs
scripts/install-deps.sh
scripts/harness-hooks/
scripts/gotcha/
scripts/skill-builder/
scripts/meta-harness/
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

The validator checks command registration, command frontmatter routing, agent registration, narrow specialist agent governance, file references, localhost-only server binding, sensitive-path/high-risk-command permission rules, OpenCode MCP shape and enabled `npx` package pinning, plugin file/hook validity, skill frontmatter, metadata counts, local-state protection, cleanup artifacts, and stale upstream branding.

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
export OCS_AUTO_FORMAT=0             # set to 1 to allow strict-profile formatter writes
export OCS_ALLOW_REMOTE_EXEC=0       # set to 1 only after manually verifying remote scripts
export OCS_ALLOW_CHMOD_777=0         # set to 1 only after explicit permission review
```

Use `minimal` for low-noise sessions, `standard` for normal development, and `strict` when you want stronger reminders and checks. Execution trace capture is disabled unless `OCS_TRACE_CAPTURE=1` is set for a targeted diagnosis session.

Native hook features:

| Hook area | Behavior |
|---|---|
| `event` | Logs session-related events without interrupting flow. |
| `command.execute.before` | Reminds operators that `/gotcha` uses local-only state. |
| `tool.execute.before` | Blocks sensitive file-tool targets, known malware IOCs, remote/encoded payload execution, and `chmod 777`; emits gotcha reminders before risky git/publish commands, doc-file warnings, and strict-profile long-running-command reminders. |
| `tool.execute.after` | Tracks edited files, warns on `console.log`, optionally formats only when `OCS_AUTO_FORMAT=1`, typechecks in strict mode, and writes opt-in redacted traces. |
| `tool.definition` | Adds untrusted-context warnings to bash, webfetch, and websearch tool descriptions before the model sees them. |
| `permission.ask` | Denies sensitive read-like paths, sensitive bash reads, known malware IOCs, remote-download-plus-execute payloads, and `chmod 777`; auto-allows only simple formatter/test commands after target/path checks. |
| `shell.env` | Injects OCS and project environment metadata plus package-manager detection. |
| `experimental.session.compacting` | Preserves active harness status, edited files, principles, and local-state reminders across compaction. |

Sensitive bash/read denial covers `.env`, `.env.*`, nested or parent-relative `.env` paths, shell builtins such as `source .env`, redirections such as `cat <.env`, JIRA credential env files, package-manager token files, `.ssh`, AWS/Kube/GitHub/Docker credential files, `.opencode/local/**`, `.agents/local/**`, `.agents/backups/**`, and credential/secret-like paths. High-risk shell denial covers `curl`/`wget` content piped to shells, process substitution into shells, downloaded scripts or `/tmp` payloads followed by execution/source/chmod/background launch, simple Python/Node/Perl/Ruby network-fetch-plus-exec patterns, base64/xxd-to-shell, `/dev/tcp`, netcat/socat shell launchers, `chmod 777`, and the known indicators from the referenced OpenCode incident. Blocked native events are written to `.opencode/local/security-events/blocked-tools.json`; portable blocked events are written to `.agents/local/security-events/blocked-tools.json`. Set `OCS_ALLOW_REMOTE_EXEC=1` or `OCS_ALLOW_CHMOD_777=1` only after manual source verification.

Meta-harness evaluation is fail-closed: benchmark specs must live under `.opencode/local/benchmarks/`, results stay under `.opencode/local/meta-harness/evaluations/`, symlink/cwd escapes are rejected, output is redacted, and unapproved benchmarks are limited to a safe Node script allowlist. Shell, destructive, or arbitrary commands require explicit `--approved-by-user`.

---

## Local Learning Loop

The harness now has a manual-first learning loop:

| Command | Purpose | State |
|---|---|---|
| `/gotcha` | Log/list/check local mistake patterns before risky operations. | `local/gotchas.json` |
| `/skill-builder` | Create and validate OpenCode skills with collision checks. | `skills/*/SKILL.md` |
| `/harness-optimize` | Diagnose gotchas and optional trace windows without auto-deploying changes. | `local/meta-harness/` |

The `.gitignore` keeps `local/`, local credential files, and generated gotcha views out of version control.

---

## MCPs

OpenCode MCP servers are configured in `opencode.json` under `mcp`. Credentialed servers are disabled by default until the required environment variables are configured.

| Server | Purpose | Status |
|---|---|---|
| `github` | Repository, issue, and PR workflows | Disabled by default; pinned package |
| `context7` | Live documentation lookup | Enabled |
| `exa` | Neural web search | Disabled by default |
| `memory` | Persistent memory | Enabled; pinned package |
| `playwright` | Browser automation | Enabled; pinned package |
| `sequential-thinking` | Stepwise reasoning | Enabled; pinned package |
| `obsidian` | Local vault integration | Disabled by default |

Legacy/reference MCP examples live in `.mcp.json` and `mcp-configs/`.

Do not commit real credentials from local MCP files, even in private repositories. Pin every `npx`, `uvx`, or `pip` MCP dependency before enabling it; do not use `@latest` for MCP servers.

---

## Restart Requirement

OpenCode loads config, agents, commands, skills, and plugins at startup. After editing files in this harness, restart OpenCode before expecting changes to take effect.
