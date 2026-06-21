# Claude Code Adapter

Generated files:

- `CLAUDE.md` imports `AGENTS.md` with `@AGENTS.md`.
- `.agents/agents/` contains the full specialist agent prompt mirror for reference or platform-native conversion.
- `.claude/settings.json` wires hooks to `.agents/harness-hooks/`.
- `.claude/skills/` mirrors `.agents/skills/` for Claude-native discovery.

Restart Claude Code or reload settings after installing. Review hooks with `/hooks` and skills with `/skills`.
