# Changelog

## 2026-06-08

- Cleaned inherited harness infrastructure that was not required for the local OpenCode CheatScale workflow.
- Rebranded the retained harness from upstream naming to OpenCode CheatScale (OCS).
- Registered all command files in `opencode.json`.
- Removed reinstallable dependency output (`node_modules/`) from the harness tree.
- Added `harness-health` validation for command, agent, skill, reference, and branding checks.
- Added an install helper for rebuilding local TypeScript plugin dependencies when needed.
