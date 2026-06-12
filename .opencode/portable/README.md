# CheatScale Portability Layer

OpenCode remains the native authoring harness, but the durable cross-platform layer is generated from it:

- `AGENTS.md` for shared agent instructions.
- `.agents/skills/<name>/SKILL.md` for Agent Skills-compatible workflows.
- `.agents/harness-hooks/*.cjs` for reusable deterministic hook scripts.
- `.agents/loop-contracts/*` for Loop Engineering contracts, verification records, reviewer schemas, worktree protocols, and benchmark templates.
- Thin adapters for Claude Code, Codex, and Gemini/Antigravity.

Run from the workspace root:

```bash
.opencode/install.sh --target all --dry-run
.opencode/install.sh --target all --project /path/to/project
```

The exporter skips unmanaged existing files unless `--force` is passed, and writes backups under `.agents/local/backups/` before overwriting. The generated `.agents/.gitignore` keeps local backups and traces out of source control.

Local-only data is never exported: `.opencode/local/`, generated gotcha views, traces, diagnostics, and credential env files remain private.
Portable hooks also block sensitive shell/file-tool targets when adapters provide path payloads. Where an adapter lacks native read-deny rules, the generated `AGENTS.md` policy remains mandatory.
