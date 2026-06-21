# Codex Adapter

Generated files:

- `AGENTS.md` is read by Codex as the shared instruction source.
- `.agents/agents/` contains the full specialist agent prompt mirror.
- `.agents/skills/` is read by Codex as Agent Skills.
- `.codex/config.toml` enables conservative approvals and hooks.
- `.codex/hooks.json` calls shared hook scripts.

Codex requires project-local `.codex/` configuration and hooks to be trusted before they run. Review hooks with `/hooks`.
