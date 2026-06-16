# Changelog

## 2026-06-16

- Added six narrow, `Use ONLY` specialist agents for harness security, prompt-injection analysis, hook policy, context budget auditing, MCP supply-chain review, and incident forensics.
- Extended the portable harness exporter to mirror full `.opencode/agents/*.md` prompt files into `.agents/agents/` with adapter registry, Claude read-permission, manifest, and documentation coverage.
- Added agent-routing governance requiring unique workflows, clear non-overlap boundaries, and skills instead of agents when independent tool execution is not needed.
- Extended harness health to validate narrow specialist agent descriptions and required boundary/output sections.
- Hardened OpenCode server config to bind to `127.0.0.1`, disable mDNS discovery, and keep extra CORS origins empty by default.
- Added native and portable hook blocking for known malware IOCs, `curl`/`wget` remote-download-plus-execute payloads, process substitution into shells, downloaded `/tmp` launchers, simple network-fetch-plus-exec one-liners, base64/xxd-to-shell, `/dev/tcp`/netcat/socat shell launchers, `nohup setsid` payloads, and `chmod 777` commands.
- Added deny rules for sensitive file-tool targets including package token files, SSH keys, AWS/Kube/GitHub/Docker credentials, and local harness state.
- Added local-only blocked-tool security event capture under `.opencode/local/security-events/` and expanded compaction/tool-definition warnings for untrusted web/search/repository content.
- Pinned enabled MCP `npx` packages and strengthened harness health to fail on enabled unpinned `npx` MCP servers.

## 2026-06-10

- Added a manual-first Loop Engineering layer with `/loop-plan`, `/loop-report`, `skills/loop-engineering`, loop contract templates, verification record templates, reviewer output schema, worktree protocol, and executable benchmark spec templates.
- Strengthened meta-harness evaluation from benchmark-file presence checks to executable benchmark specs with expected exit codes/output checks, scrubbed environments, redacted output, safe Node-script allowlists for unapproved runs, shell/destructive approval gates, symlink-safe cwd/spec checks, and local-only evaluation records.
- Added `skills/context-budget` so `/context-budget` has a concrete skill-backed workflow for token/context governance.
- Updated `/routine`, `/execute`, `/eval`, `/checkpoint`, and `/harness-optimize` to reference loop contracts, maker/checker separation, stop conditions, and verification evidence.
- Added the portable harness exporter (`install.sh` and `scripts/portable-harness.cjs`) for generating AGENTS.md, `.agents/skills`, shared hook scripts, loop contract templates, and Claude/Codex/Gemini adapters without copying local secrets or traces.
- Added cross-platform hook scripts under `scripts/harness-hooks/` for portable session context, risky-command policy checks, gotcha reminders, and opt-in redacted trace capture.
- Added `.opencode/portable/` operator notes documenting the adapter strategy for Claude Code, Codex, and Gemini/Antigravity.
- Hardened portable export and hooks against symlinked managed directories, nested-git root resolution failures, stale manifest overwrites, broad read permissions, broad destructive `rm -rf` variants, `.env`/JIRA credential access, sensitive file-tool targets, commit-visible backups, and trace-size/concurrency edge cases.
- Added native OpenCode plugin denial for sensitive bash reads such as `source .env`, nested `.env` paths, JIRA config env files, and local trace/gotcha state.
- Relaxed harness health for `scripts/jira-sync/jira-config.env` from hard failure to local-only warning so working private JIRA configs can remain on disk while still being ignored.
- Added the local-only gotcha system with `/gotcha`, `skills/gotcha`, redacting gotcha scripts, generated views, pruning, and targeted risky-command reminders.
- Added `/skill-builder` with OpenCode-compatible skill templates, skill creation, validation, and collision checks.
- Added `/harness-optimize` and `skills/meta-harness` as a manual, benchmark-gated diagnosis layer with autonomous deployment disabled by default.
- Rewrote OpenCode plugin hooks to use supported hook names and fixed bash command extraction, permission mutation, shell environment injection, compaction context, gotcha warnings, and opt-in trace capture.
- Moved MCP wiring into valid OpenCode `mcp` config entries and left credentialed servers disabled by default.
- Strengthened `harness-health` to validate command/agent wiring, plugin paths and hooks, MCP shape, local-state protection, metadata counts, and potential secret exposure.
- Reduced eager startup instructions so skills rely on OpenCode progressive disclosure instead of loading full skill bodies every session.
- Added `.opencode/local/` protection, ignored local credentials and generated gotcha views, and removed the local JIRA credential env file from the harness tree.
- Hardened JIRA helper scripts by loading config as data, preserving TLS verification by default, constraining output paths to `plans/`, validating scope/project/issue keys, escaping JIRA JSON/JQL payload strings, and using configurable issue type names.
- Hardened permission auto-allow logic so formatter/test commands must be simple exact command forms without shell metacharacters.
- Reworked the drip-feeder workflow to use local-only `drip/todo/*` and `drip/done/*` git tags instead of visible task/day markers in commit messages.
- Updated `/commit`, `/routine`, `/push`, and `/sitrep` bookkeeping so pending pushes are tag-driven and rewritten commit hashes are reconciled with patch-equivalence checks.
- Added tag-leak prevention to `/push` by requiring `--no-follow-tags` and remote `drip/*` tag verification.
- Updated harness documentation and operating instructions to reflect clean conventional commits and local drip-tag queue semantics.
- Cleaned stale command inventory, model guidance, wave-gating language, and agent authority notes in core harness docs.

## 2026-06-08

- Cleaned inherited harness infrastructure that was not required for the local OpenCode CheatScale workflow.
- Rebranded the retained harness from upstream naming to OpenCode CheatScale (OCS).
- Registered all command files in `opencode.json`.
- Removed reinstallable dependency output (`node_modules/`) from the harness tree.
- Added `harness-health` validation for command, agent, skill, reference, and branding checks.
- Added an install helper for rebuilding local TypeScript plugin dependencies when needed.
