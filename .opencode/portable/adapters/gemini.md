# Gemini / Antigravity Adapter

Generated files:

- `GEMINI.md` imports `AGENTS.md`.
- `.agents/agents/` contains the full specialist agent prompt mirror.
- `.gemini/settings.json` sets `context.fileName` to prefer `AGENTS.md`, enables skills, and wires portable hooks.
- `.agents/skills/` is the shared skill source supported by Gemini CLI and Antigravity-style successors.

Run `/memory reload` or restart the CLI after installing so context files and hooks are reloaded.
